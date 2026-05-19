# 字体图标隔离、工具栏取消折叠、滚动同步流畅度修复计划

## 需求概述

1. **字体修改不改变文件图标样式** — 设置面板中修改字体大小/字体后，侧边栏文件图标（`.file-icon`）不受影响
2. **取消顶部功能栏的折叠** — 工具栏始终展开，移除折叠/展开按钮和折叠状态
3. **双向滚动同步更流畅** — 编辑器↔预览两个方向的同步滚动都做到平滑动画，不卡顿不跳跃

---

## 一、问题诊断

### 问题 A：文件图标被字体设置影响

**根因**：[Editor.svelte:L275](file:///e:/Desktop/Projects/PureDraft/src/components/Editor.svelte#L275) 中的 `$effect` 将 `--font-mono` 动态设置为用户选择的字体：

```typescript
document.documentElement.style.setProperty('--font-mono', $fontFamily);
```

而 [FileTree.svelte:L288](file:///e:/Desktop/Projects/PureDraft/src/components/FileTree.svelte#L288) 中 `.file-icon` 使用了这个变量：

```css
.file-icon {
    font-family: var(--font-mono);   /* ← 被编辑器字体设置污染 */
    font-size: 8px;
    ...
}
```

用户在设置面板改字体 → `--font-mono` 全局变量变化 → 侧边栏文件图标（如 `md`、`js`）也跟着变字体。

### 问题 B：工具栏可折叠

[Toolbar.svelte](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte) 存在完整的折叠/展开机制：
- `toolbarOpen` store 控制展开（36px）或折叠（24px窄条）
- 展开时有 "折叠工具栏" 按钮（向上箭头）
- 折叠状态只剩一个 "展开" 按钮

### 问题 C：滚动同步不够流畅

上一轮修改中使用了 `scrollTop` 直接赋值（instant），虽然修复了回弹问题，但同步是**瞬时跳转**而非平滑动画。用户反馈 "不够流畅"。

**当前同步流程：**
1. 编辑器滚动事件 → RAF 防抖（1帧延迟）→ `syncEngine.onEditorScroll`（30ms throttle）→ `previewEl.scrollTop = target`（instant 跳转）
2. 预览滚动事件 → RAF 防抖（1帧延迟）→ `syncEngine.onPreviewScroll`（30ms throttle）→ `scrollDOM.scrollTop = target`（instant 跳转）

**卡顿原因：**
- RAF 防抖引入 1 帧（~16ms）延迟 + throttle 30ms = 总和可达 46ms 延迟
- `scrollTop` 直接赋值是瞬时跳变，视觉效果是"跳跃"而非"平滑滚动"
- 上一轮为了修复回弹而改用了 instant，牺牲了流畅性

---

## 二、实现步骤

### 步骤 1：隔离文件图标字体

**文件：** `src/components/FileTree.svelte`

将 `.file-icon` 中的 `font-family: var(--font-mono)` 改为硬编码的等宽字体栈，与编辑器字体解耦：

```css
.file-icon {
    /* ... 其他样式不变 ... */
    font-family: "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    font-size: 8px;
    font-weight: 700;
    /* ... */
}
```

或者定义一个独立的 CSS 变量 `--file-icon-font`，不与 `--font-mono` 共享。

**同时检查**：`SettingsPanel.svelte` 中 `font-size-value` 使用了 `var(--font-mono)`，这是合理的（设置面板中显示当前字体的预览），不需要修改。

### 步骤 2：取消工具栏折叠

**文件：** `src/components/Toolbar.svelte`

修改内容：
1. 删除 `toolbarOpen` store 的导入和使用
2. 删除 `collapseToolbar()` 函数
3. 删除 `{#if $toolbarOpen}` 条件渲染和 `{:else}` 折叠分支
4. 删除 "折叠工具栏" 按钮（向上箭头按钮）
5. 删除 `.toolbar-collapsed` CSS 样式

修改后 toolbar 始终渲染完整的展开状态，无折叠按钮。

具体修改点：
- **[L2](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte#L2)**：移除 `toolbarOpen` 导入
- **[L26-L28](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte#L26-L28)**：删除 `collapseToolbar` 函数
- **[L31](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte#L31)**：删除 `{#if $toolbarOpen}` 包裹
- **[L108-L112](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte#L108-L112)**：删除折叠按钮
- **[L114-L122](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte#L114-L122)**：删除 `{:else}` 折叠分支
- **[L122](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte#L122)**：删除 `{/if}`
- **[L136-L144](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte#L136-L144)**：删除 `.toolbar-collapsed` CSS

**文件：** `src/lib/stores/ui.ts`

`toolbarOpen` store 仍保留定义（不破坏引用），但不再被 Toolbar 组件使用。

### 步骤 3：实现平滑滚动同步

**文件：** `src/App.svelte`

核心思路：使用 CSS `scroll-behavior: smooth` 实现平滑动画，配合方向感知的标志防止回弹，去掉 RAF 防抖以减少延迟。

**3a. 为编辑器滚动容器添加 CSS smooth 行为**

在 `Editor.svelte` 的 `.cm-scroller` 主题样式中添加 `scroll-behavior: smooth`：

```typescript
const darkCM = EditorView.theme({
    '.cm-scroller': {
        fontFamily: 'var(--editor-font-family)',
        fontSize: 'var(--editor-font-size)',
        lineHeight: '1.6', overflow: 'auto',
        scrollBehavior: 'smooth',   // ← 新增
    },
    // ...
});
```

同样在 `lightCM` 中添加。

**然而** CodeMirror 的 `EditorView.theme()` 可能不会把 `scroll-behavior` 正确应用到 `.cm-scroller` 上。更稳妥的方式是通过 JS 直接设置：

在 Editor.svelte 的 `onMount` 中：
```typescript
onMount(() => {
    // ... existing code ...
    view = new EditorView({ state, parent: container });
    view.scrollDOM.style.scrollBehavior = 'smooth';
    // ...
});
```

**3b. 为预览容器添加 CSS smooth 行为**

在 `Preview.svelte` 的 `.preview-wrapper` 样式中添加：

```css
.preview-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-anchor: none;
    background: var(--acrylic-content-bg);
    scroll-behavior: smooth;    /* ← 新增 */
}
```

**3c. 重写 App.svelte 滚动同步逻辑**

去掉 RAF 防抖，使用 `ScrollSyncEngine` 自带的 throttle（保持 30ms），同步时直接使用 `element.scrollTop = target`（会因 CSS `scroll-behavior: smooth` 自动产生平滑动画），并用方向感知标志 + `scrollend`/timeout 防止回弹。

```typescript
// 状态变量
let isSyncingEditorTarget = false;   // 编辑器正在被同步（禁止编辑器滚动事件反向同步）
let isSyncingPreviewTarget = false;  // 预览正在被同步（禁止预览滚动事件反向同步）
let editorScrollEndTimer: ReturnType<typeof setTimeout> | null = null;
let previewScrollEndTimer: ReturnType<typeof setTimeout> | null = null;

function clearEditorSyncFlag() {
    isSyncingEditorTarget = false;
    if (editorScrollEndTimer) { clearTimeout(editorScrollEndTimer); editorScrollEndTimer = null; }
}

function clearPreviewSyncFlag() {
    isSyncingPreviewTarget = false;
    if (previewScrollEndTimer) { clearTimeout(previewScrollEndTimer); previewScrollEndTimer = null; }
}

function handleEditorScroll(scrollTop, scrollHeight, clientHeight) {
    if (isSyncingEditorTarget) return;   // 编辑器是被同步目标，忽略其滚动事件
    const inSplitOrEdit = $activeTab === 'edit' || $activeTab === 'split';
    if (!inSplitOrEdit) return;
    
    const state: ScrollState = { scrollTop, scrollHeight, clientHeight };
    const ratio = syncEngine.onEditorScroll(state);
    if (ratio === null) return;

    // 同步预览（smoth 动画）
    if (previewEl) {
        clearPreviewSyncFlag();
        const target = syncEngine.applyRatioToTarget(ratio, {
            scrollTop: previewEl.scrollTop,
            scrollHeight: previewEl.scrollHeight,
            clientHeight: previewEl.clientHeight,
        });
        isSyncingPreviewTarget = true;
        previewEl.scrollTop = target;   // CSS scroll-behavior: smooth 生效
        previewScrollEndTimer = setTimeout(clearPreviewSyncFlag, 300);
    }
    
    // 同步 hover（instant，hover 窗口不需要平滑）
    if (hoverEl) {
        const target = syncEngine.applyRatioToTarget(ratio, {
            scrollTop: hoverEl.scrollTop,
            scrollHeight: hoverEl.scrollHeight,
            clientHeight: hoverEl.clientHeight,
        });
        hoverEl.scrollTop = target;
    }
}

function handlePreviewScroll(scrollTop, scrollHeight, clientHeight) {
    if (isSyncingPreviewTarget) return;   // 预览是被同步目标，忽略其滚动事件
    const inSplitOrPreview = $activeTab === 'preview' || $activeTab === 'split';
    if (!inSplitOrPreview) return;
    
    const state: ScrollState = { scrollTop, scrollHeight, clientHeight };
    const ratio = syncEngine.onPreviewScroll(state);
    if (ratio === null) return;

    // 同步编辑器（smooth 动画）
    if (editorView?.scrollDOM) {
        clearEditorSyncFlag();
        const target = syncEngine.applyRatioToTarget(ratio, {
            scrollTop: editorView.scrollDOM.scrollTop,
            scrollHeight: editorView.scrollDOM.scrollHeight,
            clientHeight: editorView.scrollDOM.clientHeight,
        });
        isSyncingEditorTarget = true;
        editorView.scrollDOM.scrollTop = target;   // CSS scroll-behavior: smooth 生效
        editorScrollEndTimer = setTimeout(clearEditorSyncFlag, 300);
    }
    
    // 同步 hover
    if (hoverEl) {
        const target = syncEngine.applyRatioToTarget(ratio, {
            scrollTop: hoverEl.scrollTop,
            scrollHeight: hoverEl.scrollHeight,
            clientHeight: hoverEl.clientHeight,
        });
        hoverEl.scrollTop = target;
    }
}
```

**移除的代码：**
- `latestEditorScrollState`、`latestPreviewScrollState` 变量
- `pendingEditorSync`、`pendingPreviewSync` RAF 相关变量
- `syncScrollTo`、`syncScrollToEditor` 函数（逻辑合并到 handle 函数中）
- 所有 RAF 防抖代码

**3d. 清理组件卸载时的定时器**

在 App.svelte 的 `onDestroy` 或 return cleanup 中清除定时器：

```typescript
// 在组件销毁时清理
import { onDestroy } from 'svelte';
onDestroy(() => {
    clearEditorSyncFlag();
    clearPreviewSyncFlag();
});
```

### 步骤 4：验证

- `npm run check` — 确保 0 错误
- `npm run build` — 确保构建成功
- 手动测试：
  1. 修改字体大小和字体 → 检查侧边栏文件图标样式不变
  2. 确认工具栏始终展开，无折叠按钮
  3. 在 split 模式下双向滚动，确认同步动画平滑无回弹

---

## 三、涉及的文件

| 文件 | 操作 | 修改内容 |
|------|------|----------|
| `src/components/FileTree.svelte` | 修改 | `.file-icon` 字体改为硬编码，与 `--font-mono` 解耦 |
| `src/components/Toolbar.svelte` | 修改 | 删除折叠/展开逻辑和按钮，始终渲染完整工具栏 |
| `src/components/Editor.svelte` | 修改 | CM `.cm-scroller` 添加 `scroll-behavior: smooth` |
| `src/components/Preview.svelte` | 修改 | `.preview-wrapper` 添加 `scroll-behavior: smooth` |
| `src/App.svelte` | 修改 | 重写滚动同步逻辑为 smooth 方案，去除 RAF 防抖 |

---

## 四、技术细节

### 为什么不用 `element.scrollTo({ behavior: 'smooth' })`

`scrollTo` 的 `behavior: 'smooth'` 是 JS 级别触发，而 CSS 的 `scroll-behavior: smooth` 对 `element.scrollTop = value` 赋值也会生效。使用 CSS 方式的好处：
1. 只需 `scrollTop = target` 一行代码
2. 不需要传递 behavior 参数
3. 动画由浏览器 CSS 引擎调度，性能更好
4. 不依赖 scrollTo 的 Promise/回调

### 为什么去掉 RAF 防抖

RAF 防抖的本质是：在本帧内收集多次滚动事件，在下一帧开始时只执行一次同步。这引入了 1 帧（~16ms）的延迟。对于 60fps 滚动，这个延迟在视觉上是可感知的。

替代方案：`ScrollSyncEngine` 的 `shouldSync` 已通过 `performance.now()` 提供 30ms 节流，足以防止过度同步。去掉 RAF 防抖后，同步响应更即时。

### 回弹防护原理

- 当编辑器滚动触发同步 → 设置 `isSyncingPreviewTarget = true` + 300ms 超时
- 编辑器 smooth 滚动到目标位置期间，预览会被同步（smooth 动画），但预览的滚动事件不会反向触发编辑器同步（因为 `isSyncingPreviewTarget` 阻止了 `handlePreviewScroll`）
- 300ms 后标志清除，恢复正常双向同步
- 用户在编辑器 smooth 滚动期间继续滚动编辑器不受影响（因为 `isSyncingEditorTarget` 为 false）
