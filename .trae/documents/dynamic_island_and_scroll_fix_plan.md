# 灵动岛动画 + 滚动同步修复计划

---

## 问题 1：滚动同步未生效 — 根因分析

Preview 的 DOM 结构如下：

```html
<div class="preview-wrapper">  <!-- 有 overflow-y: auto，真正的滚动容器 -->
  <SearchBar />
  <div class="preview markdown-body"
       bind:this={previewEl}       ← ❌ 绑定在内部元素上
       onscroll={handlePreviewScroll}>  ← ❌ 监听在内部元素上
    {@html safeHtml}
  </div>
</div>
```

**两个 bug**：
- `bind:this={previewEl}` 绑定在 `.preview.markdown-body`，但真正的滚动容器是 `.preview-wrapper`
- `onscroll={handlePreviewScroll}` 也在 `.preview.markdown-body` 上，导致滚动事件**永远不会触发**

**影响**：
- 用户在预览区滚动时 `handlePreviewScroll` 不发 → `onPreviewScroll` 回调不执行 → 编辑器不会跟随
- `$effect` 中 `previewEl.scrollTo(...)` 操作的是错误的元素 → 编辑器→预览方向的同步也不生效

### 修复方案

将 `bind:this` 和 `onscroll` 移到 `.preview-wrapper` 上：

```diff
- <div class="preview-wrapper">
+ <div class="preview-wrapper" bind:this={previewEl} onscroll={handlePreviewScroll}>
    <SearchBar ... />
-   <div class="preview markdown-body" bind:this={previewEl} onscroll={handlePreviewScroll}>
+   <div class="preview markdown-body">
      {@html safeHtml}
    </div>
  </div>
```

同时需调整 `handlePreviewScroll` 中引用 `previewEl` 的地方 — 原代码是正确的，`previewEl.scrollTop` 等属性会指向 `.preview-wrapper`。

**额外修复**：`handlePreviewScrollToEditor` 中通过 `editorView.dispatch({ selection: ..., scrollIntoView: true })` 来滚动编辑器。但 CodeMirror 的 `scrollIntoView` 选项会触发滚动，可能再次触发 `onScroll` 回调。当前的 `syncingFromPreview` / `syncingFromEditor` 标志已经在防止递归，但需要验证在 `scrollIntoView` 被 dispatch 后，CodeMirror 的 `updateListener` 和 scroll 事件的执行顺序。

**安全加固**：在 `handleEditorScroll` 中也检查 `$activeTab === 'edit'`，在 `handlePreviewScroll` 中检查 `$activeTab === 'preview'` — 这些已正确实现。

### 修改文件

- `src/components/Preview.svelte` — 将 `bind:this` 和 `onscroll` 移到 `.preview-wrapper`

---

## 问题 2：灵动岛（Dynamic Island）动画效果

### 设计理念

参考 Apple Dynamic Island 的核心特征：
- **胶囊形态**：圆角药丸形状，位于标题栏中央
- **弹性动画**：使用 spring 物理曲线实现状态切换的弹跳效果
- **多状态切换**：空闲态 → 展开态 → 详细信息态，通过 `scale`/`width`/`border-radius` 过渡
- **内容自适应**：内部内容通过 `opacity` 和 `transform` 在不同状态间淡入淡出

### 实现方案

#### 组件结构

新建 `src/components/DynamicIsland.svelte`：

- **Collapsed（默认）**：仅显示文件图标 + 文件名，约 180px 宽
- **Expanded（保存/自动保存时）**：左侧文件信息 + 右侧状态文案，约 280px 宽，显示 2 秒后自动收起
- **Idle Pulse**：自动保存倒计时时，边缘有微弱的呼吸光晕

#### 动画构成

| 阶段 | 动画 | 时长/曲线 |
|------|------|----------|
| 收起→展开 | `width` 扩大、`border-radius` 从 20px→24px、内容淡入 | 400ms spring |
| 展开保持 | 静态展示 | ~2000ms |
| 展开→收起 | `width` 缩小、内容淡出 | 300ms ease-out |
| 内容切换 | 旧内容 `opacity` → 0，新内容 `opacity` → 1 | 150ms cross-fade |

#### 显示内容

| 场景 | 内容 |
|------|------|
| 默认（编辑中） | 📝 `filename.md` + 修改指示点 ● |
| 手动保存成功 | 📝 `filename.md` + ✓ 已保存 |
| 自动保存中 | 📝 `filename.md` + ↻ 自动保存... |
| 无文件打开 | `PureDraft` 品牌文字 |
| 切换模式 | ☀/🌙 浅色/深色 已切换 |

#### 技术实现

使用 CSS `@keyframes` + Svelte 条件渲染，通过 `$state` 管理当前动画阶段：

```
states: 'idle' | 'expanding' | 'expanded' | 'collapsing'
```

- 展开时：记录当前内容 + 设置 `state = 'expanding'`，400ms 后自动切换为 `state = 'expanded'`，2000ms 后自动 `state = 'collapsing'`，300ms 后恢复 `idle`
- 使用 `transition: width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)` 实现弹簧回弹效果
- 内容使用 `position: absolute` + `opacity` 实现 cross-fade

#### 集成位置

替换当前 TitleBar 中的 `titlebar-center` 区域：

```diff
- <div class="titlebar-center" data-tauri-drag-region ...></div>
+ <div class="titlebar-center" data-tauri-drag-region ...>
+   <DynamicIsland file={$currentFile} ... />
+ </div>
```

注意：根据 Claude.md 规范，**控制按钮（关闭、最小化、最大化）禁止放入 Dynamic Island**。这些按钮保持在 TitleBar 右侧独立区域。

### 修改文件

- 新建 `src/components/DynamicIsland.svelte` — 灵动岛组件
- 修改 `src/components/TitleBar.svelte` — 集成 DynamicIsland 到 titlebar-center
- 修改 `src/App.svelte` — 传递保存状态/自动保存等 signal 给 TitleBar → DynamicIsland

---

## 实施步骤

1. 修复 Preview.svelte 滚动元素绑定
2. 创建 DynamicIsland.svelte 组件（含完整动画 CSS）
3. 修改 TitleBar.svelte 集成 DynamicIsland
4. 修改 App.svelte 传递必要的 signal props
5. 运行 `svelte-check` 验证
