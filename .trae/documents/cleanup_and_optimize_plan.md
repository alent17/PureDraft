# 去文件夹 + 代码复制 + 主题优化 + 新建文件 + 光标动画 + 本地图片插入 计划

---

## 1. 去掉打开文件夹功能

### 改动清单

| 文件 | 改动 |
|------|------|
| `src/App.svelte` | 删除 `handleOpenFolder`、`folderFiles`、`currentFolderPath`；删除 `openFolderTree`/`readFileNode`/`FileNode` 相关 import；删除工具栏的 `onOpenFolder` prop；移除传递给 FileTree 的 `files`/`onRefresh` prop |
| `src/components/Toolbar.svelte` | 删除 `onOpenFolder` prop 和"打开文件夹"按钮 |
| `src/components/FileTree.svelte` | 删除 `files`/`onSelectFile`/`onRefresh` prop，只保留「大纲」「最近」两个 Tab；移除文件树渲染逻辑 |
| `src/lib/utils/tauri.ts` | 删除 `openFolderDialog` 函数 |
| `src/lib/stores/ui.ts` | `SidebarTab` 类型改为 `"outline" | "recent"` |

---

## 2. 预览栏代码块添加复制功能

### 方案

在 Preview 渲染后，对每个 `<pre>` 代码块动态添加一个「复制」按钮：
- 按钮位于代码块右上角，默认半透明，hover 时完全显示
- 点击后复制代码内容到剪贴板，按钮短暂变为 ✓ 确认图标
- 在 `initMermaid`/`initKaTeX` 同级的 `$effect` 中注入

### 修改文件

- `src/components/Preview.svelte` — 新增 `attachCopyButtons()` 函数，在 `$effect` 中调用

---

## 3. 深色模式代码块背景色修复 & 代码高亮优化

### 问题

`app.css` 中 `--color-preview-code-bg: #1E1E1E` 与 `--color-bg: #1E1E1E` 完全相同，代码块与页面背景融为一体无法区分。

### 方案

1. **修改暗色模式下代码块背景**：`--color-preview-code-bg` 改为 `#0D0D0D`（比页面背景更深），`--color-preview-code-text` 改为 `#D4D4D4`
2. **切换到更好的 highlight.js 主题**：从 CDN 加载 `atom-one-dark.min.css` 替代 `github-dark.min.css`（github-dark 在深色背景下表现不佳，代码颜色对比度太低）
3. **预览区全局代码样式**：确保行内代码 `code` 也有明显的背景区分（当前 `--color-bg-secondary: #252526` 已经足够）

### 修改文件

- `src/app.css` — 修改 dark 模式下 `--color-preview-code-bg` 和 `--color-preview-code-text`
- `src/lib/utils/markdown.ts` — `createMarkedInstance` 中 dark 模式加载 `atom-one-dark.min.css` 替代 `github-dark.min.css`

---

## 4. 优化新建文件功能

### 当前问题

- 弹窗 UI 过时，使用 `--color-yellow` 已不适配新主题
- 文件名输入框和扩展名选择器排列不够直观
- 没有对新主题的 CSS 变量适配

### 方案

1. **重写 UI**：使用新主题 CSS 变量，`--color-accent` 替换 `--color-yellow`，整体风格与 SettingsPanel 一致
2. **添加快捷模板选择**：在扩展名选择下方增加常用模板快捷入口（Markdown/JS/HTML/CSS 一键创建）
3. **输入框自动聚焦**：打开弹窗时输入框自动获得焦点（已有但需确保）
4. **优化布局**：文件名和扩展名并排更紧凑

### 修改文件

- `src/components/NewFileModal.svelte` — 重写样式和布局，添加模板快捷入口

---

## 5. 编辑器光标平滑移动（类 VS Code）

### 方案

VS Code 的光标平滑移动通过 CSS `transition` 实现。CodeMirror 6 中可以在 `EditorView.theme` 中添加：

```css
.cm-cursor {
  transition: left 80ms ease-out, top 80ms ease-out;
}
```

但 CodeMirror 的光标是通过 `border-left` 实现的，其位置由 DOM 决定，CSS transition 可能不完全生效。

**推荐方案**：使用 CSS `caret-color` + 设置光标动画，以及使用 `EditorView.theme` 添加平滑过渡：

```css
.cm-cursor-primary {
  transition: all 100ms ease-out;
}
.cm-cursor-secondary {
  transition: all 150ms ease-out;
}
```

并在暗色/亮色主题的 `EditorView.theme` 中分别添加。

### 修改文件

- `src/components/Editor.svelte` — 在 `darkCM` 和 `lightCM` 的 `EditorView.theme` 中添加 `.cm-cursor` 的 transition

---

## 6. 本地选择图片插入

### 方案

MDToolbar 中的图片按钮当前只是插入 `![](url)` 占位符。改为：
1. 点击图片按钮 → 触发 Tauri 文件选择对话框（图片过滤器）
2. 选择图片后，将图片读取为 base64 并插入 `![](data:image/...;base64,...)` 格式
3. 同时保留原有的图片粘贴功能（Ctrl+V 粘贴剪贴板图片）

### 修改文件

- `src/lib/components/MDToolbar.svelte` — 替换 `insertImage` 逻辑，调用图片选择对话框
- `src/lib/utils/image.ts` — 新增 `selectImageFile()` 函数，使用 Tauri dialog 打开图片选择
