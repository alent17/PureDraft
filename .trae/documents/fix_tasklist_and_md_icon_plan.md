# 修复任务列表勾选 + MD 文件图标重构 — 实现计划

## 一、任务列表勾选功能修复

### 问题分析

**当前实现** ([Preview.svelte#L112-L144](file:///e:/Desktop/Projects/PureDraft/src/components/Preview.svelte#L112-L144)) 使用**文本内容模糊匹配**来定位 checkbox 对应的源文件行号。存在以下风险：
- 两个任务有相似文本时会匹配到错误行
- 嵌套任务列表中 `closest('li')` 可能找到外层 `<li>`，其 `textContent` 包含子任务文本
- 匹配逻辑依赖 `<li>` 的 `textContent` 与源行文本的一致性，不够稳健

**正确方案**：在 Markdown 解析阶段（`marked.parse()` 之后、`DOMPurify.sanitize()` 之前），直接向生成的 HTML 中注入 `data-line` 属性。原理是：按顺序扫描源文件中所有 `- [ ]` / `- [x]` 行，按相同顺序匹配 HTML 中 `<input type="checkbox">` 元素并注入行号。

### 实现步骤

#### 步骤1：在 Preview.svelte 中添加 HTML 后处理，注入 data-line

**文件**：`src/components/Preview.svelte`

在 `processedHtml` 的 `$derived` 链中添加 `injectTaskLineNumbers` 处理步骤。

新增辅助函数：

```typescript
function injectTaskLineNumbers(html: string, source: string): string {
  const taskLines: number[] = [];
  const sourceLines = source.split('\n');
  for (let i = 0; i < sourceLines.length; i++) {
    if (/^[\s>]*- \[[ x]\] /.test(sourceLines[i])) {
      taskLines.push(i);
    }
  }

  if (taskLines.length === 0) return html;

  let idx = 0;
  return html.replace(
    /<input type="checkbox" class="task-list-item-checkbox"/g,
    () => {
      const line = idx < taskLines.length ? taskLines[idx] : -1;
      idx++;
      return `<input data-line="${line}" type="checkbox" class="task-list-item-checkbox"`;
    }
  );
}
```

将处理链修改为：

```typescript
let rawHtml = $derived(markedInstance.parse(content) as string);
let htmlWithLines = $derived(injectTaskLineNumbers(rawHtml, content));
let processedHtml = $derived(processMermaid(processLatex(htmlWithLines)));
```

注意：`DOMPurify` 的配置已允许 `class` 属性（`ADD_ATTR: ['class', ...]`），所以 `data-line` 需要也加入允许列表，或者改用已有的 `ADD_ATTR` 配置。实际上 DOMPurify 默认**不**移除 `data-*` 属性 — 需要确认。DOMPurify 默认只移除非白名单属性，`data-*` 属性在默认白名单中（DOMPurify v3 默认允许 `data-*`）。

**如果不允许**，在 DOMPurify 的 `ADD_ATTR` 中添加 `'data-line'`。

#### 步骤2：恢复 attachTaskHandlers 使用 data-line

**文件**：`src/components/Preview.svelte`

将 `attachTaskHandlers` 简化回使用 `data-line` 属性的版本（移除文本匹配逻辑）：

```typescript
function attachTaskHandlers() {
  if (!previewEl) return;
  const checkboxes = previewEl.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"].task-list-item-checkbox'
  );
  checkboxes.forEach((cb) => {
    if (cb.dataset.lineBound) return;
    cb.dataset.lineBound = '1';

    cb.addEventListener('change', () => {
      const lineStr = cb.getAttribute('data-line');
      if (lineStr !== null && onTaskToggle) {
        onTaskToggle(parseInt(lineStr), cb.checked);
      }
    });
  });
}
```

---

## 二、MD 文件图标差异化展示

### 需求

- MD 文件：中间显示 "md" 文字、背景黑色、暗色模式文字白色、浅色模式文字黑色
- 其他文件类型：保持现有图标样式（两字母缩写 + 彩色背景）

### 影响范围

- [FileList.svelte](file:///e:/Desktop/Projects/PureDraft/src/components/FileList.svelte)：侧边栏文件列表（展开 + 折叠状态），两处图标渲染
- [FileTree.svelte](file:///e:/Desktop/Projects/PureDraft/src/components/FileTree.svelte)：最近文件面板，使用 emoji

### 实现步骤

#### 步骤3：添加 MD 图标 CSS 变量

**文件**：`src/app.css`

在暗色模式区域添加：
```css
--color-md-icon-bg: #000000;
--color-md-icon-text: #ffffff;
```

在浅色模式区域添加：
```css
--color-md-icon-bg: #000000;
--color-md-icon-text: #171717;
```

#### 步骤4：在 FileList.svelte 中为 MD 文件使用专属样式

**文件**：`src/components/FileList.svelte`

在模板部分（展开 + 折叠状态两处），对 MD 文件使用特殊的图标渲染：

```svelte
<!-- 展开状态 -->
{#if getFileType(file.name) === 'Markdown'}
  <span class="file-icon file-icon-md">md</span>
{:else}
  <span class="file-icon" style="background: {getFileColor(file.name)}">
    {getFileIcon(file.name)}
  </span>
{/if}

<!-- 折叠状态 — 同样修改 -->
```

新增 CSS：

```css
.file-icon-md {
  background: var(--color-md-icon-bg);
  color: var(--color-md-icon-text);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0;
}
```

#### 步骤5：同时更新 FileTree.svelte 中 MD 图标样式（可选）

**文件**：`src/components/FileTree.svelte`

当前 FileTree 使用 emoji，MD 对应 `📝`。用户提到需要差异化展示，但 FileTree 不在本次要求范围内（仅涉及文件图标在侧边栏的差异化）。如果用户要求保持一致，可以将 FileTree 中的 MD 图标也统一改为 "md" 文字样式。由于用户描述的是 "修改文件图标的显示样式"，我认为只需修改 `FileList.svelte`（侧边栏文件列表），`FileTree.svelte` 等其他组件不属于文件图标主体。

---

## 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/components/Preview.svelte` | 修改 | 添加 `injectTaskLineNumbers` + 简化 `attachTaskHandlers` |
| `src/app.css` | 修改 | 添加 `--color-md-icon-bg` / `--color-md-icon-text` |
| `src/components/FileList.svelte` | 修改 | MD 文件使用专属图标样式（黑底 + "md" 文字） |

## 验证

- 运行 `npm run check` 确保 0 错误
- 打开 MD 文件验证任务列表勾选正常
- 在暗色/浅色模式下验证 MD 文件图标显示正确
