# 滚动同步修复 + 最近文件 + 主题重设计划

---

## 问题 1：滚动同步不生效 — 根因分析

### 根因 A：Editor → Preview 的滚动比例计算错误

[App.svelte:L115-L120](file:///e:/Desktop/Projects/PureDraft/src/App.svelte#L115-L120)

```ts
function handleEditorScroll(scrollTop: number, scrollHeight: number) {
    if (!$scrollSyncEnabled || $activeTab !== 'edit') return;
    const estimateLine = Math.floor((scrollTop / (scrollHeight || 1)) * ...totalLines);
    previewScrollLine = estimateLine;
}
```

**问题**：分母用了 `scrollHeight`（总内容高），正确公式应为 `scrollTop / (scrollHeight - clientHeight)`（实际可滚动距离）。例如总高 2400px、可视 600px 时，滚动到底部 `scrollTop=1800`，`1800/2400=0.75` 只能映射到 75% 位置而非 100%。

同时 [Editor.svelte:L193-L196](file:///e:/Desktop/Projects/PureDraft/src/components/Editor.svelte#L193-L196) 只传递了 `scrollTop` 和 `scrollHeight`，缺少 `clientHeight`。

### 根因 B：同一 Effect 中读/写预览滚动线 → 递归触发

Preview.svelte 的 `$effect` 在 `scrollToLine` 变化时调用 `scrollIntoView` 滚动 DOM，这会触发 `onscroll` → `handlePreviewScroll` → `onPreviewScroll(line)` → `handlePreviewScrollToEditor` → `editorView.dispatch({ scrollIntoView: true })` → 编辑器滚动 → `handleEditorScroll` → 又设置 `previewScrollLine`，形成环路。

### 修复方案

1. **修正 Editor.svelte 滚动参数**：pass `{scrollTop, scrollHeight, clientHeight}` 三个值
2. **修正 App.svelte 比例计算**：`ratio = scrollTop / max(scrollHeight - clientHeight, 1)`，然后 `estimateLine = Math.floor(ratio * totalLines)`
3. **防止递归**：在 `handleEditorScroll` 中增加 `isSyncingFromPreview` 标志，当由预览触发的编辑器滚动不再反馈给预览；在 `handlePreviewScrollToEditor` 中增加 `isSyncingFromEditor` 标志

---

## 问题 2：文件栏显示最近打开文件

### 现状

`persistence.ts` 已保存当前会话的文件列表（`saveState`/`loadState`），但：
- 仅保存在 `beforeunload` 时，session 级
- 不会累积跨会话的历史记录
- UI 没有展示入口

### 方案

1. **新建 `recentFiles.ts`**：独立于 session 持久化的"最近文件"列表
   - 每次打开文件/从文件夹选择文件时，写入 `localStorage` 的 `puredraft_recent` key
   - 去重（同路径覆盖时间戳），最多保留 20 条
   - 提供 `getRecentFiles()` / `addRecentFile(path, name)` / `removeRecentFile(path)` 
2. **修改 FileTree.svelte**：在「文件」Tab 底部增加「最近打开」分组
   - 当没有打开文件夹时，显示最近文件列表
   - 点击最近文件项 → `readFile` + `addFile` 打开该文件
3. **修改 App.svelte**：在 `handleOpenFiles` 和 `handleSelectFile` 中调用 `addRecentFile`

---

## 问题 3：主题重做 — 只保留一个专业主题

### 设计方向

参考 VS Code Dark+、Obsidian、Linear 的现代暗色主题，采用 **深色专业风格**：
- 底色 `#1E1E1E`（VS Code 黑），内容区 `#252526`
- 强调色：柔和蓝 `#569CD6` 或 `#4FC1FF`
- 低对比度边框 `#3E3E42`，避免刺眼
- 代码高亮与编辑区背景融为一体
- 删除所有旧主题的 CSS 变量和残留

### 改动清单

| 文件 | 改动 |
|------|------|
| `src/app.css` | 重写全部 CSS 变量为单一主题；删除 Binance/Spotify/Retro 三套变量、Retro 布局样式、Fallback 兼容块；保留 layout/radius/font/reset 部分 |
| `src/lib/stores/ui.ts` | 删除 `Theme` 类型和 `theme` store，只保留 `mode: 'dark' | 'light'` |
| `src/App.svelte` | 移除 `$theme` 引用改为只用 `$mode`；移除 `createMarkedInstance($theme)` 改为 `createMarkedInstance($mode)` |
| `src/components/Editor.svelte` | 移除双 Compartment 主题切换逻辑，改为单一主题的 `EditorView.theme` + `HighlightStyle` |
| `src/components/StatusBar.svelte` | 移除主题 badge 显示，改为只显示 mode |
| `src/components/Toolbar.svelte` | 移除 `toggleTheme` 按钮（原来的三主题轮换），只保留深/浅模式切换 |
| `src/components/SettingsPanel.svelte` | 移除 Theme 选择区域（三按钮），只保留 Mode 切换；清理主题相关 CSS |
| `src/lib/utils/markdown.ts` | `createMarkedInstance` 参数从 `theme` 改为 `mode`（只影响 highlight.js CSS） |
| `src/lib/stores/file.ts` | 无改动 |

### 新主题 CSS 变量设计

```
--color-bg:                #1E1E1E    主背景
--color-bg-secondary:      #252526    次要背景（面板、hover 等）
--color-bg-hover:          #2A2D2E    hover 状态
--color-bg-active:         #37373D    激活状态
--color-ink:               #CCCCCC    正文颜色
--color-text-secondary:    #9CDCFE    次要文字（蓝调）
--color-slate:             #808080    辅助文字
--color-border:            #3E3E42    边框
--color-accent:            #4FC1FF    强调色（柔和蓝）
--color-accent-hover:      #79D4FF    hover 强调

--color-editor-bg:         #1E1E1E    编辑器背景（与主背景相同）
--color-editor-gutter:     #1E1E1E    行号区背景
--color-sidebar-bg:        #252526    侧边栏
--color-statusbar-bg:      #007ACC    状态栏（VS Code 蓝）
--color-toolbar-bg:        #2D2D30    工具栏
```

编辑器 CodeMirror 主题与整体一致：背景 `#1E1E1E`，正文 `#D4D4D4`，光标 `#4FC1FF`，选中 `rgba(79, 193, 255, 0.3)`。

### 删除内容

- `src/app.css` 中 ~150+ 行残留 Retro 主题变量、Retro 布局样式、Fallback 兼容块
- `src/components/SettingsPanel.svelte` 中 Theme 选择相关的 ~20 行 HTML + ~60 行 CSS
- `src/components/Toolbar.svelte` 中 `toggleTheme` 函数和对应按钮
- `src/lib/stores/ui.ts` 中 `Theme` 类型导出和 `theme` store
