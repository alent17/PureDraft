# 修复 bug + 主题设置重构计划

## 问题1：`effect_update_depth_exceeded` 无限循环

**根因**：[App.svelte:L51](file:///e:/Desktop/Projects/PureDraft/src/App.svelte#L51)

```ts
let autoSaveTimer = $state<ReturnType<typeof setInterval> | null>(null);
```

`autoSaveTimer` 被声明为响应式 `$state`，而在 `$effect`（L59-L77）中同时读(`if (autoSaveTimer)`)和写(`autoSaveTimer = null`、`autoSaveTimer = setInterval(...)`)该变量，导致 effect 被自身触发 → 无限递归 → `effect_update_depth_exceeded`。

**修复方案**：
- 将 `autoSaveTimer` 从 `$state(...)` 改为普通 `let` 变量 — 定时器 ID 不需要响应式追踪，只需要在 cleanup 时获取

---

## 问题2：主题 CSS 设置重构

**现状问题**：
1. Retro 主题 CSS（L367—L607）大量选择器引用了实际组件中不存在的类名（`.editor-pane`、`.preview-pane`、`.markdown-editor`、`.markdown-preview`、`.titlebar .logo`、`.titlebar .filename`、`.status-bar` 等），这些样式**完全不生效**
2. 全局 CSS 中 `* { transition-property: background-color, border-color, color, box-shadow; ... }` 过于宽泛，在某些情况下可能引起性能问题
3. `button:hover { transform: translateY(-1px); }` 全局规则过于粗暴，会导致已在组件内精细控制 hover 行为的按钮出现意外位移
4. 缺少 `--color-bg-active` CSS 变量（OutLine.svelte 和 FileTree.svelte 中使用了 `.active` 状态但没有对应的 CSS 变量定义）

**修复方案**：
1. **删除无效的 Retro 主题选择器**：移除所有引用不存在类名的 CSS 规则块（L367—L607），这些样式需要通过组件的全局 `:global()` 或各组件内定义来实现。保留 CSS 变量定义（`[data-theme="retro"][data-mode="dark/light"]` 中的变量部分完好）
2. **添加 `--color-bg-active` CSS 变量**：在所有 6 套主题中补充该变量，供侧边栏/大纲的高亮状态使用
3. **收窄全局 transition 规则**：将 `*` 改为 `html, body, #app`，避免性能影响
4. **移除全局 `button:hover { transform }`**：每个按钮的 hover 效果应在各自组件内定义

**修改文件**：
- `src/App.svelte` — 修复 `autoSaveTimer` 的 `$state` 问题
- `src/app.css` — 清理无效 CSS、补充 `--color-bg-active` 变量、收窄全局规则
