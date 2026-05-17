# 图片显示 + 滚动同步优化计划

---

## 问题 1：图片资源无法显示

### 根因分析

图片插入有 **两种途径**，各有不同的问题：

#### 途径 A：剪贴板粘贴 (Ctrl+V)

[image.ts](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/image.ts) → `blobToBase64Image()` 生成 `![name](data:image/png;base64,...)` → 插入编辑器。

**问题**：Editor.svelte 是 CodeMirror 实例，显示纯文本 `![](data:image/...)`。图片仅在 Preview/HoverPreview 渲染。base64 data URI 已在 CSP `img-src` 放行，**应该能显示**。但仍需验证。

#### 途径 B：本地文件选择 (MDToolbar 图片按钮)

[MDToolbar.svelte:L78](file:///e:/Desktop/Projects/PureDraft/src/lib/components/MDToolbar.svelte#L78) → `convertFileSrc(imagePath)` → 生成 `https://asset.localhost/C%3A/...` URL。

**问题**：Tauri 2 的 `convertFileSrc()` 将本地路径转为 asset 协议 URL，但 **Asset Protocol 需要配置 scope** 才能从任意文件系统路径提供文件。当前 [`tauri.conf.json`](file:///e:/Desktop/Projects/PureDraft/src-tauri/tauri.conf.json) 中未配置 `app.security.assetProtocol`，默认只允许访问应用资源目录（`$RESOURCE/...`）。任意路径如 `C:\Users\...\image.png` 会被拒绝。

**修复**：不使用 `convertFileSrc`，改为通过已有的 `readFile` Rust command 读取图片二进制 → 转为 base64 → 插入 data URI。这样可以复用已有的文件系统权限（dialog + path scope），无需新增 asset protocol 配置。

### 方案

将 [MDToolbar.svelte](file:///e:/Desktop/Projects/PureDraft/src/lib/components/MDToolbar.svelte) 的 `insertLocalImage` 改为：

```
1. openImageDialog() → 文件路径
2. readFile(path) → 文件二进制内容 (Uint8Array)
3. bytesToBase64(bytes) + getImageMime(ext) → data URI
4. 插入 ![name](data:image/png;base64,...)
```

这样 Preview 渲染的 `<img src="data:image/png;base64,...">` 不受 asset protocol 限制，CSP 已放行 `data:`。

### 额外修复：DOMPurify 确保 src 属性

[Preview.svelte:L39-L42](file:///e:/Desktop/Projects/PureDraft/src/components/Preview.svelte#L39-L42) 的 `ADD_ATTR` 列表中缺少 `src`（虽然 DOMPurify 默认允许 `src`，但显式添加更安全）。

### 额外修复：readFile 需要返回二进制

当前 `readFile` Rust command 返回 `{ content: string, fileType: string }` — 文本内容。图片文件通过文本方式读取会破坏二进制数据。需要新增一个 `readFileBinary` 方法，或者确保图片路径走 `bytesToBase64` 时使用正确的编码。

**关键修复**：当前 `readFile` 返回字符串 (`content: string`)，对图片文件无效。需要新增专门读取二进制文件的工具函数，使用 `fetch` + `ArrayBuffer` 或者修改 Rust command 返回 base64。

**最简方案**：前端使用 `window.__TAURI__.core.convertFileSrc()` 获取 asset URL 并在 `tauri.conf.json` 中添加 asset protocol scope：

```json
"security": {
  "assetProtocol": {
    "enable": true,
    "scope": ["**"]
  }
}
```

这样最简单，不需要修改 readFile 逻辑。配合已有的 CSP `img-src` 设置即可。

### 修改文件

| 文件 | 改动 |
|------|------|
| `src-tauri/tauri.conf.json` | 新增 `app.security.assetProtocol.enable` + `scope` |
| `src/components/Preview.svelte` | `ADD_ATTR` 显式添加 `'src'` |

---

## 问题 2：预览同步滚动不流畅

### 根因分析

| 问题 | 根因 | 影响 |
|------|------|------|
| **A. syncStatus 高频写** | `handleEditorScroll` 中每 30ms 执行 `syncStatus.set('syncing')` + `syncStatus.set('idle')` | Store 更新触发 StatusBar 重渲染，浪费 CPU |
| **B. Editor 方向滚动不跟随光标** | Preview→Editor 用 `scrollDOM.scrollTo({behavior:'instant'})` 直接跳转 | 视觉跳跃感强，无平滑过渡 |
| **C. 单一 lock 阻塞多目标** | `lastSource` 在 RAF 期间阻止所有来源，包括目标之间的反馈 | 三向同步时 A→B 后 B→C 的链条断裂 |
| **D. Preview 滚动事件重复触发** | Preview→Editor 的 `scrollDOM.scrollTo()` 触发 CodeMirror 内部的 scroll 事件 → 回调 `handleEditorScroll` | 虽被 `lastSource` 拦截，但事件仍传播 |
| **E. split 模式下不触发同步** | Editor scroll 时 `$activeTab === 'split'` 通过 filter，但 Preview 只在 `bind:previewEl` 时才绑定 ref | split-preview 缺少 `bind:previewEl` |

### 修复方案

#### A. 移除 syncStatus 无意义切换

在 `handleEditorScroll` / `handlePreviewScroll` / `handleHoverScroll` 中**删除** `syncStatus.set('syncing')` 和 `syncStatus.set('idle')`。只有在 `syncScrollTo` 的 catch 分支才设置 `syncStatus.set('error')`。

#### B. Editor 平滑跟随

将 `editorView.scrollDOM.scrollTo({ top, behavior: 'instant' })` 改为使用 CSS `scroll-behavior: smooth` 或换用 CodeMirror 的 `scrollIntoView` — 但因为我们已经移除了 `dispatch({scrollIntoView})`，改为用 `scrollDOM.style.scrollBehavior = 'smooth'` 在做同步前临时开启 smooth，然后重置为 `'auto'`：

```ts
scrollDOM.style.scrollBehavior = 'smooth';
scrollDOM.scrollTo({ top: target, behavior: 'smooth' });
// reset after transition completes (~300ms)
setTimeout(() => { scrollDOM.style.scrollBehavior = ''; }, 300);
```

#### C. 拆分锁为多源

当前 `lastSource` 只允许一个方向。改为 `activeSource: SyncSource` 表示"当前正在做同步的源"，目标滚动事件忽略所有 `scroll` 回调，不调用 engine。

实际上当前逻辑已经通过 `this.lastSource === source` 防止了自我循环。问题是 **Preview→Editor 的 scrollTo 会触发 Editor 的 scroll 事件**，而 Editor scroll 事件回调 `handleEditorScroll` 会设置 `syncStatus` 并再次调用 engine…

**修复**：在 `syncScrollToEditor` 和 `syncScrollTo` 中，scrollTo 之前设置一个标志 `isProgrammaticScroll = true`，在下一个 microtask 中重置。所有 `handleEditorScroll` / `handlePreviewScroll` / `handleHoverScroll` 在最开头检查该标志。

```ts
let isProgrammaticScroll = false;

function syncScrollTo(...) {
  isProgrammaticScroll = true;
  element.scrollTo({ top: target, behavior: 'instant' });
  requestAnimationFrame(() => { isProgrammaticScroll = false; });
}

function handleEditorScroll(...) {
  if (isProgrammaticScroll) return; // ← 跳过程序化滚动
  ...
}
```

#### D. 确保 split-preview 的 previewEl 被绑定

Split 模式下的 Preview 组件在 [App.svelte:L580-L587](file:///e:/Desktop/Projects/PureDraft/src/App.svelte#L580-L587) 已有 `bind:previewEl`。确认已正确绑定。

#### E. 统一节流到 16ms

当前 `throttleMs = 30`（~33fps）。改为 `throttleMs = 16`（~60fps）提高平滑度。

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/App.svelte` | 添加 `isProgrammaticScroll` 标志；删除 `syncStatus` setter；Editor 用 smooth scroll；throttleMs 改为 16 |
| `src/lib/utils/scrollSync.ts` | 无改动（引擎逻辑正确） |

---

## 实施步骤

1. **tauri.conf.json** — 添加 `assetProtocol` 配置（enable + scope `**`）
2. **Preview.svelte** — DOMPurify `ADD_ATTR` 显式添加 `'src'`
3. **App.svelte** — 添加 `isProgrammaticScroll` 防护；移除 `syncStatus` 多余 setter；Editor smooth scroll；throttleMs: 16
4. **运行验证** — `pnpm check` + `npx vitest run`
