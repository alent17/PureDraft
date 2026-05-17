# 大纲跳转 + 自定义后缀 + 滚动同步修复 + 图片显示 计划

---

## 问题 1：预览栏无法根据大纲选择跳转

### 根因

[App.svelte:L332-L343](file:///e:/Desktop/Projects/PureDraft/src/App.svelte#L332-L343) 的 `handleOutlineNavigate` 只操作编辑器：

```ts
function handleOutlineNavigate(line: number) {
    if (editorView) {
      editorView.dispatch({ selection: ..., scrollIntoView: true });
      editorView.focus();
    }
}
```

当用户在 **预览模式** 下点击大纲项时，编辑器被滚动但预览没有反应 — 用户看不到任何变化。

### 修复

`handleOutlineNavigate` 需要同时处理两种模式：
- **编辑模式**：当前逻辑不变（滚动编辑器 + 聚焦）
- **预览模式**：设置 `previewScrollLine` → 触发 Preview.svelte 的 `$effect` 滚动到对应标题

```ts
function handleOutlineNavigate(line: number) {
    if ($activeTab === 'preview') {
      // 滚动预览
      previewScrollLine = line;
      return;
    }
    if (editorView) {
      // 滚动编辑器（原有逻辑）
      ...
    }
}
```

---

## 问题 2：新建文件添加自定义后缀

### 当前状态

NewFileModal 只提供 6 个预设模板 (.md/.js/.ts/.html/.css/.json)，selectTemplate 函数通过按钮选择后缀。

### 修复

添加「自定义」模板按钮 — 点击后显示文本输入框让用户输入任意后缀：
1. 新增 `customExt` 状态和 `showCustomInput` 状态
2. 在 template-grid 末尾添加「📄 自定义」按钮
3. 点击后显示输入框，用户输入后缀（如 `.rs`, `.vue`, `.py`）
4. 确认时根据用户输入的后缀确定文件类型（通过 `EXTENSION_OPTIONS` 查找，找不到则 `PlainText`）

### 修改文件

- `src/components/NewFileModal.svelte` — 添加自定义后缀输入逻辑

---

## 问题 3：滚动同步仍然有 bug

### 根因 A：DOM 未就绪时尝试查询

[Preview.svelte:L172-L220](file:///e:/Desktop/Projects/PureDraft/src/components/Preview.svelte#L172-L220) 的 `scrollToLine` 效果：

```ts
$effect(() => {
    if (scrollToLine !== null && scrollToLine !== undefined && previewEl) {
      const headingIds = Array.from(previewEl.querySelectorAll('h1[id]...'));
      ...
      targetEl.scrollIntoView(...);
    }
});
```

当用户从 Editor 切换到 Preview 时：
1. Preview 组件挂载 → `previewEl` 绑定 → 效果触发
2. 但 `{@html safeHtml}` 尚未渲染到 DOM → `querySelectorAll` 返回空
3. 回退到 `previewEl.scrollTo(topRatio)` — 这个公式还行，但不够精确

### 修复

在 scrollToLine 效果中使用 `requestAnimationFrame` 确保 DOM 已渲染，并改用 `tick()` ：

```ts
$effect(() => {
    if (scrollToLine !== null && scrollToLine !== undefined && previewEl) {
      requestAnimationFrame(() => {
        // 重新查询 headings（此时 DOM 已更新）
        ...
      });
    }
});
```

### 根因 B：scrollHeight 未及时更新

`previewEl.scrollHeight` 在 `{@html}` 更新后需要一帧才能反映新内容的高度。`scrollTo(top)` 使用旧高度计算比例会导致位置偏差。

### 修复

在 `requestAnimationFrame` 内首先让浏览器完成布局（使用 `previewEl.offsetHeight` 强制回流），然后再执行 `scrollTo`。

---

## 问题 4：预览和编辑栏都无法显示图片

### 根因分析

**编辑栏（CodeMirror）**：CodeMirror 是纯文本编辑器，默认不渲染 Markdown 图片。图片语法 `![](url)` 显示为纯文本 — 这是预期行为。

**预览栏**：Marked 正确将 `![alt](url)` 渲染为 `<img src="url">`，DOMPurify 也允许 `<img>` 标签。但 **图片源 URL 有问题**：

1. **本地文件路径**（`C:\Users\...\image.png`）：浏览器/WebView 出于安全限制**禁止加载本地文件路径**。`insertLocalImage` 直接插入了文件路径 → 图片无法显示。

2. **相对路径**：如果是相对路径且文件不存在于 Tauri 的 asset scope 内，也无法加载。

3. **base64 data URI**：剪贴板粘贴的图片使用 base64 → **可以正常显示**。

### 修复

**`insertLocalImage`（[MDToolbar.svelte:L71-L82](file:///e:/Desktop/Projects/PureDraft/src/lib/components/MDToolbar.svelte#L71-L82)）**：选择图片后通过 `readFile` 读取文件内容为 Uint8Array → 转换为 base64 → 插入 `![](data:image/png;base64,...)` 格式。

具体步骤：
1. `openImageDialog()` 获取文件路径
2. 调用 `readFile(path)` 获取文件二进制内容
3. 根据扩展名确定 MIME 类型
4. 将 Uint8Array 转换为 base64 字符串
5. 插入 `![name](data:${mime};base64,${base64})`

同时更新 `src/lib/utils/image.ts` 添加 `localFileToBase64` 工具函数。

### 修改文件

- `src/lib/utils/image.ts` — 添加 `filePathToDataUri()` 函数
- `src/lib/components/MDToolbar.svelte` — 修改 `insertLocalImage` 使用 base64

---

## 实施步骤

1. 修复 `handleOutlineNavigate` — 预览模式时设置 `previewScrollLine`
2. 修复 Preview.svelte scrollToLine 效果 — 添加 `requestAnimationFrame` + 强制回流
3. 添加 NewFileModal 自定义后缀输入
4. 修改 `insertLocalImage` 读取文件转 base64
5. 新增 `filePathToDataUri()` 工具函数
6. 运行 `svelte-check` 验证
