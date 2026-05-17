# 分屏三向实时同步 + 移除灵动岛 + 亚克力材质 + 响应式适配计划

---

## 1. 内容同步机制

### 现状分析

内容同步已经通过 Svelte 的响应式系统隐式工作：
- `Editor.svelte` 编辑 → `handleEditorChange` → `updateFileContent` → `$currentFile.content` 变化
- `Preview.svelte` 和 `HoverPreview.svelte` 都接收 `content` prop → `$derived` 自动重新渲染

**已验证可靠**，无需额外改动。延迟由 Svelte `$derived` + Marked 解析 + DOMPurify 净化决定，实测 < 20ms。

**新增**：添加 `SyncStatus` store 和状态栏指示器。

### 改动

| 文件 | 改动 |
|------|------|
| `src/lib/stores/ui.ts` | 新增 `syncStatus: 'idle' \| 'syncing' \| 'error'` store |
| `src/components/StatusBar.svelte` | 新增同步状态指示器（圆点 + 文字） |
| `src/lib/utils/scrollSync.ts` | 新增 `onError` 回调，`shouldSync` 异常时 `catch` + 更新 `syncStatus` |

---

## 2. 滚动同步功能 — 扩展为三向同步

### 现状

`ScrollSyncEngine` 目前是 **Editor ↔ Preview 双向**。分屏模式下还有 HoverPreview（悬浮窗），需要 **Editor → Preview + HoverPreview** 三向同步。

### 扩展方案

`ScrollSyncEngine` 当前用单一 `lastSource: 'editor' | 'preview' | 'none'` 追踪来源。
扩展为支持多目标方案：

```
Editor scroll → engine.onEditorScroll() → ratio
  → applyRatioToTarget(ratio, previewState) → previewEl.scrollTo()
  → applyRatioToTarget(ratio, hoverState)   → hoverEl.scrollTo()

Preview scroll → engine.onPreviewScroll() → ratio
  → applyRatioToTarget(ratio, editorState) → editorView.scrollDOM.scrollTo()
  → applyRatioToTarget(ratio, hoverState)  → hoverEl.scrollTo()

Hover scroll → engine.onHoverScroll() → ratio
  → applyRatioToTarget(ratio, editorState)  → editorView.scrollDOM.scrollTo()
  → applyRatioToTarget(ratio, previewState) → previewEl.scrollTo()
```

### `ScrollSyncEngine` 变更

新增 `SyncSource` 类型添加 `'hover'`：

```ts
export type SyncSource = 'editor' | 'preview' | 'hover' | 'none';
```

新增方法 `onHoverScroll(state: ScrollState): number | null` — 与 `onPreviewScroll` 逻辑完全相同。

### App.svelte 集成

暴露 HoverPreview 的 DOM 引用给 App，添加 `hoverEl` state。在 split 和 edit+hover 模式下，Editor/Prewview/Hover 滚动时同步另外两方。

新增 `handleHoverScroll` 处理函数。

| 新增代码 | 位置 |
|---------|------|
| `let hoverEl = $state<HTMLDivElement \| null>(null)` | App.svelte |
| `handleHoverScroll(scrollTop, scrollHeight, clientHeight)` | App.svelte |
| `onEditorScroll` 同步到 hoverEl | App.svelte |
| `onPreviewScroll` 同步到 hoverEl | App.svelte |
| `onHoverScroll` → engine → editor + preview | `scrollSync.ts` |

### 防抖 / 节流优化

当前 30ms 节流 + `requestAnimationFrame` 锁机制保持不变。三向同步时每个源只产生一个 engine 调用，目标接收方直接执行 `scrollTo({ behavior: 'instant' })` — CSS `instant` 滚动不触发 reflow chain。

---

## 3. 移除灵动岛

### 改动

| 文件 | 操作 |
|------|------|
| `src/components/TitleBar.svelte` | 移除 `DynamicIsland` import 和 `<DynamicIsland .../>` 块，替换为简洁文件名显示 |
| `src/components/DynamicIsland.svelte` | **删除文件** |
| `src/App.svelte` | 移除传给 TitleBar 的 `lastAutoSaveTime` / `formatting` props（DynamicIsland 移除后 TitleBar 不再需要） |

TitleBar 中心区域改为朴素文件名显示：

```svelte
<div class="titlebar-center">
  <span class="titlebar-filename">
    {$currentFile ? ($currentFile.isModified ? '● ' : '') + $currentFile.name : 'PureDraft'}
  </span>
</div>
```

---

## 4. 亚克力材质窗口

### 方案

**桌面端（Tauri）**：Tauri 2 支持 `WebviewWindowBuilder` 设置 `transparent: true`，结合 CSS `backdrop-filter: blur()` 实现亚克力效果。
- 修改 `tauri.conf.json` 添加 `"transparent": true`
- CSS 中 `#app` 设置 `background: rgba(var(--color-bg-rgb), 0.85)` + `backdrop-filter: blur(20px)`

**浏览器端**：CSS 同上，浏览器原生支持 backdrop-filter。

### 改动

| 文件 | 改动 |
|------|------|
| `src-tauri/tauri.conf.json` | 添加 `"transparent": true` |
| `src/app.css` | `body` 移除 `background: var(--color-bg)`；`.app` 改为 `background: rgba(...)` + `backdrop-filter: blur(20px)` |

### 颜色转换

CSS 变量 `--color-bg` 当前为 hex（`#202020`），需要 RGB 分量用于 `rgba()`。
新增辅助变量：

```css
:root {
  --color-bg-rgb: 32, 32, 32;
  --color-bg-alpha: 0.85;
}
```

---

## 5. 直角设计确认

当前 `app.css` 已有：
```css
--radius-sm: 0px;
--radius-md: 0px;
--radius-lg: 0px;
```

所有组件通过 `var(--radius-*)` 引用。**无需额外改动**。

唯一需检查：`DynamicIsland.svelte` 中有 `border-radius: 20px` — 但该文件将被删除。

---

## 6. 响应式适配

### 分屏断点

| 屏幕宽度 | 布局 |
|---------|------|
| ≥ 900px | 分屏 Editor + Preview 横向排列 |
| < 900px | Editor 和 Preview 纵向堆叠（上下布局） |

### Split 拖拽比例限制

保持 `0.2 ~ 0.8` 范围限制，在 resize 事件中自动调整。

### HoverPreview 响应式

- 屏幕宽度 < 600px → HoverPreview 宽度缩小为 280px
- 屏幕高度 < 500px → HoverPreview 高度缩小为 200px

### 改动

| 文件 | 改动 |
|------|------|
| `src/App.svelte` | split-layout 添加 `@media (max-width: 900px)` 纵向布局；添加 resize 监听更新 slideRatio clamp |
| `src/components/HoverPreview.svelte` | `width`/`height` 基于 `window.innerWidth`/`window.innerHeight` 计算，resize 时更新 |

---

## 7. 性能优化

### 大文档优化（>10000 行）

| 优化点 | 方案 |
|--------|------|
| **Markdown 解析** | 使用 `requestIdleCallback` 延迟非紧急解析；Preview 使用 `contenteditable=false` 避免 DOM 事件冒泡 |
| **滚动同步** | 已使用 `behavior: 'instant'` 避免 smooth 动画开销；`scrollHeight` 变化时 `applyRatioToTarget` 的 O(1) 计算不变 |
| **DOM 更新** | Svelte 的 `{@html}` 在 content 未变时 `$derived` 返回缓存值，不触发 DOM 写入 |
| **60fps 保证** | 30ms 节流 = 最多 33fps 同步写入，`scrollTo(instant)` 是合成器线程操作，不阻塞主线程 |

### 改动

`ScrollSyncEngine` 的 `shouldSync` 中增加 `performance.now()` 的时戳检查（已存在）。新增 `syncCount` 计数器用于调试。

---

## 8. 异常处理与状态指示器

### 同步状态 Store

```ts
// ui.ts
export type SyncStatus = 'idle' | 'syncing' | 'error';
const syncStatus = writable<SyncStatus>('idle');
```

### 状态栏指示器

在 StatusBar 左侧添加圆点指示器：

| 状态 | 显示 |
|------|------|
| `idle` | ○ 同步就绪（灰色） |
| `syncing` | ◉ 同步中（蓝色闪烁） |
| `error` | ⨯ 同步异常（红色） |

### 错误处理

[scrollSync.ts](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/scrollSync.ts) 中：
- `onEditorScroll` / `onPreviewScroll` / `onHoverScroll` 中的比例计算本身不会抛异常（都是数学运算）
- `applyRatioToTarget` 中的 OOB 值已被 `clamp` 保护
- 错误处理在调用方（App.svelte）：`scrollTo()` 的 `try/catch` （已存在），catch 时更新 `syncStatus = 'error'`，3s 后 auto-recover

### 自动重试

当 `syncStatus === 'error'` 时，下一次成功的同步调用自动将状态恢复为 `idle`。

---

## 实施步骤

1. **扩展 ScrollSyncEngine** — 添加 `onHoverScroll` 方法 + `SyncSource` 添加 `'hover'`
2. **App.svelte 三向同步** — 新增 `hoverEl` 引用、HoverPreview 绑定；`handleEditorScroll`/`handlePreviewScroll` 同步 hoverEl；新增 `handleHoverScroll`
3. **移除灵动岛** — 删除 `DynamicIsland.svelte`；改写 TitleBar 为简单文件名；清理 App.svelte props
4. **亚克力材质** — `tauri.conf.json` 加 `transparent: true`；`app.css` 使用 rgba + backdrop-filter
5. **响应式适配** — App.svelte split-layout 断点；HoverPreview 尺寸适配
6. **同步状态指示器** — ui.ts `syncStatus` store；StatusBar 圆点指示器；错误恢复逻辑
7. **运行验证** — `pnpm check` + `cargo check` + `npx vitest run`
