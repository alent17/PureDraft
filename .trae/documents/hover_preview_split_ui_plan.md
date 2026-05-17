# 预览悬浮窗 + 分屏布局 + UI 直角化重构计划

---

## 现状分析

| 方面 | 当前状态 |
|------|---------|
| **视图模式** | `activeTab: 'edit' \| 'preview'` — 二选一，通过 TabBar 切换 |
| **预览悬浮窗** | 不存在 |
| **分屏** | 不存在（计划阶段曾提及但未实现） |
| **圆角** | 全局 CSS 变量 `--radius-sm: 4px` / `--radius-md: 6px` / `--radius-lg: 10px`，所有按钮、面板、弹窗大量使用 |
| **阴影** | 少量使用（`.welcome-icon` 的 `box-shadow`），弹窗使用 `--color-shadow-md`，整体视觉偏平面 |

---

## 功能 1：预览悬浮窗 (Hover Preview)

### 设计

在 **编辑模式** 下，用户可开启一个悬浮的迷你预览面板：
- 位于编辑器右下角，大小约 360×300px
- 初始半透明，hover 时完全显示
- 实时渲染当前 Markdown 内容（复用 Preview 组件的渲染管线）
- 支持拖拽调整位置和大小
- 支持一键关闭（× 按钮）

### 实现方案

新建 [`HoverPreview.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/HoverPreview.svelte)：

```
Props:
  - content: string          ← 当前 Markdown 内容
  - visible: boolean         ← 是否显示

行为:
  - 固定定位在编辑器区域右下角
  - z-index 高于编辑器但低于弹窗
  - opacity 默认 0.6，hover 时 1.0
  - 右上角关闭按钮
  - 复用 Preview 的渲染逻辑（markedInstance + DOMPurify）
  - 内容区域 overflow-y: auto
```

### 控制按钮

在 [`TabBar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/TabBar.svelte) 中添加悬浮预览切换按钮：

| 操作 | 快捷键 | 说明 |
|------|--------|------|
| `Ctrl+Shift+H` | 切换悬浮预览 | toggle `hoverPreviewEnabled` |

### Store 变更

[`ui.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/stores/ui.ts) 新增：
```ts
const hoverPreviewEnabled = writable<boolean>(false);
```

---

## 功能 2：分屏布局 (Split View)

### 设计

在 `activeTab` 中新增 `'split'` 模式：
- 左侧占 50%：Editor
- 右侧占 50%：Preview
- 中间可拖拽调整分屏比例
- 分屏时滚动同步自动启用

### 实现方案

[`App.svelte`](file:///e:/Desktop/Projects/PureDraft/src/App.svelte) 中修改 `editor-preview-area`：

```svelte
{#if $activeTab === 'split'}
  <div class="split-layout">
    <div class="split-editor" style="width: {splitRatio * 100}%">
      <Editor ... />
    </div>
    <div class="split-drag-handle" onmousedown={startResize}></div>
    <div class="split-preview" style="width: {(1 - splitRatio) * 100}%">
      <Preview ... />
    </div>
  </div>
{:else if $activeTab === 'edit' || !showPreview}
  ...现有逻辑
{:else}
  ...现有逻辑
{/if}
```

### 控制按钮

[`TabBar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/TabBar.svelte) 中新增第三个 Tab：

```
[ Editor ] [ Preview ] [ Split ]   |   [同步] [悬浮预览]
```

### Store 变更

[`ui.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/stores/ui.ts) 修改：
```ts
export type ActiveTab = "edit" | "preview" | "split";
```

### 分屏拖拽

使用 `splitRatio` state（默认 0.5），`mousedown` → `mousemove` → 更新比例 → `mouseup`/`mouseleave` 结束拖拽。

---

## 功能 3：UI 全面直角化 + 阴影

### 改动范围

| 文件 | 改动 |
|------|------|
| [`app.css`](file:///e:/Desktop/Projects/PureDraft/src/app.css) | 全局 `--radius-*` 变量全部设为 0；为 `.sidebar-panel`、`.content-area` 等主要区块添加 `box-shadow` |
| 所有 `.svelte` 组件 | 移除内联 `border-radius: var(--radius-*)` 引用（但 CSS 变量已改，自动生效） |

### app.css 变更

```css
:root {
  --radius-sm: 0px;       /* 原先 4px */
  --radius-md: 0px;       /* 原先 6px */
  --radius-lg: 0px;       /* 原先 10px */
  --shadow-panel: 0 2px 8px rgba(0, 0, 0, 0.3);    /* 新增 */
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.4); /* 新增 */
}
```

### 阴影层级规划

| 组件 | 阴影 |
|------|------|
| TitleBar | `0 1px 3px rgba(0,0,0,0.3)` — 底部细阴影 |
| Toolbar | 无阴影（紧贴 TitleBar） |
| Sidebar | `1px 0 4px rgba(0,0,0,0.2)` — 右侧阴影 |
| Editor/Preview 内容区 | 无独立阴影 |
| HoverPreview 悬浮窗 | `0 4px 16px rgba(0,0,0,0.5)` |
| SettingsPanel / NewFileModal | `0 8px 32px rgba(0,0,0,0.5)` |
| StatusBar | `0 -1px 3px rgba(0,0,0,0.3)` — 顶部细阴影 |

### 特殊调整

- **滚动条** `::-webkit-scrollbar-thumb` 的 `border-radius` 移除
- **标题栏窗口按钮** 的 hover 背景取消圆角
- **灵动岛 (DynamicIsland)** 的 `border-radius` 保留（这是它的核心视觉特征）
- **Tab 标签高亮指示条** 的 `border-radius: 1px` 改为 0
- **搜索栏** 的 focus 状态去掉 `border-radius`

---

## 实施步骤

1. **Store 扩展** — `ui.ts` 新增 `hoverPreviewEnabled`、`ActiveTab` 加入 `'split'`
2. **HoverPreview.svelte** — 新建悬浮预览组件
3. **App.svelte 分屏** — 新增 `split-layout`，`splitRatio` 拖拽逻辑、HoverPreview 集成
4. **TabBar.svelte 重做** — 新增 Split Tab + 悬浮预览按钮 + 滚动同步按钮
5. **app.css 重构** — 全局 `--radius-*` → 0、各组件 `box-shadow`
6. **Preview.svelte** — 复用渲染逻辑，同一组件在 hover/split 场景下尺寸自适应
7. **组件级样式清理** — 检查和清理各组件中单独定义的圆角（如 `.cm-tooltip`）
8. **运行 `svelte-check` + `vitest`** — 验证
