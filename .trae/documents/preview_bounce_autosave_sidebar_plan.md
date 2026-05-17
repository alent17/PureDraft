# 预览回跳修复 + 自动保存显示 + 侧边栏折叠计划

---

## 问题 1：预览栏滚动回跳 (Scroll Bounce-Back)

### 根因分析

预览栏回跳的精确执行顺序：

```
1. 用户在编辑栏输入文字
2. handleEditorChange → updateFileContent → $currentFile.content 变化
3. Preview.svelte 的 $derived 重新计算 safeHtml
4. Svelte 将新的 safeHtml 通过 {@html safeHtml} 写入 .markdown-body 元素
5. innerHTML 被整体替换 → 浏览器将父级 .preview-wrapper 的 scrollTop 重置为 0
6. Editor 的 handleEditorScroll 可能在 1-2 帧后触发（editor 内容高度变化）
7. syncScrollTo(previewEl, ratio, 'preview') 尝试恢复滚动位置
```

**在步骤 5 和步骤 7 之间**，用户看到预览区短暂跳回顶部（约 16-33ms），形成"回弹"感知。

**核心根因**：`{@html safeHtml}` 在 Svelte 5 中通过设置 `innerHTML` 更新 DOM。浏览器在 `innerHTML` 被整体替换时，会重置父级可滚动容器的 `scrollTop`。

### 修复方案：保存/恢复滚动位置

在 `safeHtml` 计算前捕获当前滚动比率，在 DOM 更新后立即恢复。

**Preview.svelte** 新增 scroll preservation 逻辑：

```ts
let savedRatio = 0;

$effect(() => {
  // 在 safeHtml 被计算之前保存滚动比率
  if (previewEl) {
    const max = previewEl.scrollHeight - previewEl.clientHeight;
    savedRatio = max > 0 ? previewEl.scrollTop / max : 0;
  }
  // safeHtml 在此之后通过 $derived 被使用，触发 DOM 更新
});

$effect(() => {
  // safeHtml 更新后，DOM 已替换，立即恢复滚动位置
  if (previewEl && safeHtml) {
    // 使用 tick() 确保 DOM 已写入
    requestAnimationFrame(() => {
      const max = previewEl.scrollHeight - previewEl.clientHeight;
      if (max > 0 && savedRatio > 0) {
        previewEl.scrollTop = savedRatio * max;
      }
    });
  }
});
```

但 `$effect` 中 `safeHtml` 作为依赖会自动追踪。更好的方式是用 `$effect.pre` 或 `$effect` 配合 `tick()`。

**最终方案**：利用 `safeHtml` 作为 `$effect` 的依赖，在 DOM 更新帧恢复位置：

```ts
$effect(() => {
  // safeHtml 是 $derived，作为此 effect 的依赖
  const _ = safeHtml;
  if (!previewEl) return;

  const max = previewEl.scrollHeight - previewEl.clientHeight;
  if (max > 0 && savedRatio > 0) {
    // requestAnimationFrame 确保浏览器已应用 innerHTML
    requestAnimationFrame(() => {
      previewEl.scrollTo({ top: savedRatio * max, behavior: 'instant' });
    });
  }
});

// 在 scroll 事件中持续更新 savedRatio（用户主动滚动时）
function handlePreviewScroll() {
  if (!previewEl) return;
  const max = previewEl.scrollHeight - previewEl.clientHeight;
  if (max > 0) savedRatio = previewEl.scrollTop / max;
  if (onScroll) {
    onScroll(previewEl.scrollTop, previewEl.scrollHeight, previewEl.clientHeight);
  }
}
```

**额外防护**：添加 CSS `overflow-anchor: none` 到 `.preview-wrapper`，禁用浏览器的 scroll anchoring 特性（防止浏览器尝试"智能"保持滚动位置，与实际恢复逻辑冲突）。

---

## 问题 2：自动保存时间显示错误

### 根因

[StatusBar.svelte:L46](file:///e:/Desktop/Projects/PureDraft/src/components/StatusBar.svelte#L46)：

```ts
自动保存 {Math.ceil(parseInt($autoSaveInterval) / 60)}min
```

| 设置值 | 计算 | 显示 | 正确显示 |
|--------|------|------|---------|
| `'10'` | `Math.ceil(10/60) = 1` | "1min" | **"10s"** |
| `'30'` | `Math.ceil(30/60) = 1` | "1min" | **"30s"** |
| `'60'` | `Math.ceil(60/60) = 1` | "1min" | "1min" ✓ |
| `'120'` | `Math.ceil(120/60) = 2` | "2min" | "2min" ✓ |

### 修复

[StatusBar.svelte](file:///e:/Desktop/Projects/PureDraft/src/components/StatusBar.svelte) 新增计算函数：

```ts
let autoSaveDisplay = $derived.by(() => {
  if ($autoSaveInterval === 'off') return '';
  const sec = parseInt($autoSaveInterval);
  if (sec < 60) return `自动保存 ${sec}s`;
  return `自动保存 ${sec / 60}min`;
});
```

同时 [SettingsPanel.svelte](file:///e:/Desktop/Projects/PureDraft/src/components/SettingsPanel.svelte) 中自动保存按钮的标签也需修正（当前标签正确：`'10s'`, `'30s'`, `'1min'`, `'2min'` — 无需修改）。

---

## 问题 3：侧边栏折叠功能

### 现状

- `sidebarOpen` store 已存在，`Ctrl+B` 可切换
- 折叠时侧边栏通过 `{#if $sidebarOpen}` 条件渲染完全消失
- 没有 CSS 过渡动画
- 没有可见的折叠/展开按钮
- 状态未持久化到 localStorage

### 修复方案

#### CSS 动画

将 `sidebar-panel` 从条件渲染改为始终存在但通过 `width` + `overflow` 控制：

```svelte
<div class="sidebar-panel" class:collapsed={!$sidebarOpen}>
  {#if $sidebarOpen}
    <FileTree ... />
  {/if}
</div>
```

```css
.sidebar-panel {
  width: 240px;
  transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-panel.collapsed {
  width: 0;
  border-right: none;
}
```

#### 折叠按钮

在 sidebar-panel 与 content-area 的交界处（或 sidebar-panel 右上角）放置一个细的 toggle 按钮：

- 展开时：在 sidebar 右侧边界显示 `«` 箭头按钮
- 折叠时：在 content-area 左侧边缘显示 `»` 箭头按钮

按钮绝对定位在 sidebar 右边缘，始终可见。

#### 状态持久化

[persistence.ts](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/persistence.ts) 新增 `sidebarOpen` 字段：

```ts
// saveState 中存储
localStorage.setItem('puredraft_sidebar', String(isOpen));

// App.svelte onMount 中读取恢复
const saved = localStorage.getItem('puredraft_sidebar');
if (saved !== null) sidebarOpen.set(saved === 'true');
```

或者更简单地：使用 `localStorage` 直接在 `sidebarOpen` store 的 subscribe 中同步：

```ts
// ui.ts
sidebarOpen.subscribe(v => {
  localStorage.setItem('puredraft_sidebar', String(v));
});

// 初始化时读取
const saved = localStorage.getItem('puredraft_sidebar');
if (saved !== null) sidebarOpen.set(saved === 'true');
```

### 修改文件汇总

| 文件 | 改动 |
|------|------|
| `src/components/Preview.svelte` | 添加 `savedRatio` + content change 后恢复 scroll + `overflow-anchor: none` |
| `src/components/StatusBar.svelte` | 修正 `autoSaveDisplay` 计算逻辑 |
| `src/App.svelte` | 侧边栏折叠动画（width transition）+ toggle 按钮 |
| `src/lib/stores/ui.ts` | sidebarOpen 初始值从 localStorage 读取 + subscribe 持久化 |
| `src/app.css` | 侧边栏折叠按钮样式 |

---

## 实施步骤

1. **Preview.svelte** — 添加 `savedRatio` 保存/恢复逻辑 + `overflow-anchor: none`
2. **StatusBar.svelte** — 修正自动保存时间显示
3. **App.svelte + ui.ts** — 侧边栏折叠动画 + 按钮 + localStorage 持久化
4. **运行验证** — `pnpm check` + `npx vitest run`
