# 预览区代码块语言标签显示计划

## 需求

在预览渲染的代码块上显示对应的语言名称标签（如 `javascript`、`python`、`rust` 等）。

## 现状分析

### DOM 结构

marked 渲染代码块时，通过 `langPrefix: "hljs language-"` 生成如下 HTML：

```html
<pre style="position: relative;">
    <code class="hljs language-javascript">...高亮后的代码...</code>
    <button class="copy-btn">...</button>  <!-- 仅 Preview 有 -->
</pre>
```

- `<code>` 元素的 `class` 中包含 `language-xxx` 类名 → 语言信息来源
- `<pre>` 已被设置为 `position: relative`（`attachCopyButtons` 设置）
- 复制按钮 `.copy-btn` 位于 `top: 8px; right: 8px`
- HoverPreview 中 `<pre>` 没有 `position: relative` 也没有复制按钮

### 涉及文件

| 文件 | 说明 |
|------|------|
| `src/components/Preview.svelte` | 主预览区，已有 `attachCopyButtons()` 等后处理函数 |
| `src/components/HoverPreview.svelte` | 悬浮预览区，无后处理函数 |

---

## 实现方案

### 方案设计

- 在 `<pre>` 元素内插入一个 `<span class="lang-label">` 标签
- 定位在代码块左上角（`top: 0; left: 0`），与右上角的复制按钮对应
- 从 `<code>` 元素的 `language-xxx` 类名中提取语言名称
- 排除 mermaid 代码块（`pre.mermaid`）
- 对于没有 `language-*` 类名的代码块（纯文本），不显示标签

### 步骤 1：Preview.svelte — 添加 `attachLanguageLabels()` 函数

在 `attachCopyButtons()` 同级位置添加新函数：

```typescript
function attachLanguageLabels() {
  if (!previewEl) return;
  const pres = previewEl.querySelectorAll<HTMLElement>('pre:not(.mermaid)');
  pres.forEach((pre) => {
    if (pre.querySelector('.lang-label')) return;
    
    const code = pre.querySelector('code');
    if (!code) return;
    
    const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
    if (!langClass) return;
    
    const lang = langClass.replace('language-', '');
    if (!lang) return;
    
    const label = document.createElement('span');
    label.className = 'lang-label';
    label.textContent = lang;
    
    // 确保 pre 的 position 为 relative
    if (getComputedStyle(pre).position === 'static') {
      pre.style.position = 'relative';
    }
    pre.appendChild(label);
  });
}
```

### 步骤 2：Preview.svelte — 在 `$effect` 中调用新函数

在 `requestAnimationFrame` 回调中，`attachCopyButtons()` 调用之后添加 `attachLanguageLabels()` 调用：

```diff
  requestAnimationFrame(() => {
    initMermaid();
    initKaTeX();
    attachTaskHandlers();
    attachCopyButtons();
+   attachLanguageLabels();
  });
```

### 步骤 3：Preview.svelte — 添加语言标签 CSS 样式

```css
.preview :global(.lang-label) {
  position: absolute;
  top: 0;
  left: 0;
  padding: 2px 8px;
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-slate);
  background: var(--color-border);
  border-bottom-right-radius: 4px;
  text-transform: lowercase;
  letter-spacing: 0.3px;
  line-height: 1.6;
  pointer-events: none;
  user-select: none;
}
```

### 步骤 4：HoverPreview.svelte — 添加语言标签后处理

在 HoverPreview 的 `$effect` 中添加语言标签注入逻辑。

首先需要在 `<script>` 中添加 `$effect`（当前 HoverPreview 的 `$effect` 只处理滚动恢复）。由于 HoverPreview 没有复杂的后处理 chain，可以在现有的处理 `safeHtml` 变化的 `$effect` 中添加。

修改现有的 `$effect`（在 `$effect.pre` 之后）：

```diff
  $effect(() => {
    const _ = safeHtml;
    const el = hoverEl;
-   if (!el || hoverSavedRatio <= 0) return;
-   queueMicrotask(() => {
-     if (!el || !el.isConnected) return;
-     const max = el.scrollHeight - el.clientHeight;
-     if (max > 0 && hoverSavedRatio > 0) {
-       el.scrollTop = hoverSavedRatio * max;
-     }
-   });
+   if (!el) return;
+   requestAnimationFrame(() => {
+     // 语言标签
+     const pres = el.querySelectorAll<HTMLElement>('pre:not(.mermaid)');
+     pres.forEach((pre) => {
+       if (pre.querySelector('.hover-lang-label')) return;
+       const code = pre.querySelector('code');
+       if (!code) return;
+       const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
+       if (!langClass) return;
+       const lang = langClass.replace('language-', '');
+       if (!lang) return;
+       const label = document.createElement('span');
+       label.className = 'hover-lang-label';
+       label.textContent = lang;
+       if (getComputedStyle(pre).position === 'static') {
+         pre.style.position = 'relative';
+       }
+       pre.appendChild(label);
+     });
+     
+     // 滚动恢复
+     if (hoverSavedRatio <= 0) return;
+     const max = el.scrollHeight - el.clientHeight;
+     if (max > 0 && hoverSavedRatio > 0) {
+       el.scrollTop = hoverSavedRatio * max;
+     }
+   });
  });
```

### 步骤 5：HoverPreview.svelte — 添加语言标签 CSS 样式

```css
.hover-body :global(.hover-lang-label) {
  position: absolute;
  top: 0;
  left: 0;
  padding: 1px 6px;
  font-size: 9px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-slate);
  background: var(--color-border);
  border-bottom-right-radius: 3px;
  text-transform: lowercase;
  letter-spacing: 0.2px;
  line-height: 1.6;
  pointer-events: none;
  user-select: none;
}
```

---

## 修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/Preview.svelte` | 修改 | 添加 `attachLanguageLabels()` 函数 + CSS 样式 |
| `src/components/HoverPreview.svelte` | 修改 | 添加语言标签注入逻辑 + CSS 样式 |

---

## 边界情况

| 场景 | 处理 |
|------|------|
| 无语言标识的代码块（纯缩进代码） | `language-*` 类不存在 → 不显示标签 |
| mermaid 代码块 | `pre:not(.mermaid)` 排除 |
| 代码块内容为空 | 标签仍显示（表示代码块语言） |
| 重复调用 | `querySelector('.lang-label')` 检查防止重复创建 |

---

## 验证

- `pnpm check` 确保类型无错误
- 打开含代码块的 MD 文件，验证 Preview 模式下语言标签显示
- 开启 HoverPreview，验证悬浮预览中语言标签显示
- 确认 mermaid 块不显示语言标签
- 确认无语言标识的代码块不显示标签
