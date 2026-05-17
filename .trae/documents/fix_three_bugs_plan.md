# 修复三个功能问题 — 实现计划

## 问题分析

### 问题1：任务列表交互失效
- **根因**：`attachTaskHandlers()` 在 [Preview.svelte#L112-L123](file:///e:/Desktop/Projects/PureDraft/src/components/Preview.svelte#L112-L123) 中通过 `cb.getAttribute('data-line')` 获取行号，但 `marked` v12 GFM 渲染器不会自动给 checkbox 添加 `data-line` 属性。因此 `lineMatch` 恒为 `null`，`onTaskToggle` 永远不会被调用。
- **修复方向**：在 markdown 解析阶段通过 `marked` 的 `walkTokens` 或自定义 `renderer` 给每个任务列表项的 checkbox 注入 `data-line` 属性。

### 问题2：代码块语法高亮不显示
- **根因**：highlight.js 的 CSS 主题文件在 [markdown.ts#L95-L104](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/markdown.ts#L95-L104) 中从 CDN (`cdnjs.cloudflare.com`) 动态加载，但 `tauri.conf.json` 的 CSP 策略 `style-src 'self' 'unsafe-inline'` **阻止**外部样式表加载。
- **修复方向**：改为从 npm 包本地导入 CSS 主题文件（Vite 会打包），绕过 CSP 限制。

### 问题3：亚克力材质效果不完整
- **根因1**：`body` 在 [app.css#L164](file:///e:/Desktop/Projects/PureDraft/src/app.css#L164) 使用 `var(--color-bg)` 作为背景，该变量在亚克力开启时保持不透明色 `#202020`，阻止了下层亚克力透明度透出。
- **根因2**：部分组件背景未使用 `--acrylic-*` 变量体系（如 SearchBar、FileList 等），这些区域在亚克力模式下仍然不透明。
- **修复方向**：
  - `body` 背景在亚克力 ON 时切换为 `transparent`
  - 确保所有区域背景统一使用 `--acrylic-*` 变量
  - DWM `Effect::Acrylic` 已提供系统级模糊 → 无需 CSS `backdrop-filter`

## 实现步骤

### 步骤1：修复任务列表交互 — 注入 data-line 属性

**文件**：`src/lib/utils/markdown.ts`

在 `markedInstance` 配置中添加自定义 `renderer`，覆盖 task list item 的 checkbox 渲染：

```typescript
import { Marked, type Tokens } from "marked";
// ... existing imports

markedInstance.use({
  gfm: true,
  breaks: true,
  walkTokens(token) {
    if (token.type === 'checkbox') {
      // 每遇到一个 checkbox token，递增计数，将源码行号注入
    }
  },
});

// 更好的方案：使用 renderer 扩展
const renderer = {
  checkbox(checked: boolean) {
    return `<input type="checkbox" ${checked ? 'checked' : ''} class="task-list-item-checkbox" data-line="${lineCounter++}">`;
  },
};
markedInstance.use({ renderer, gfm: true, breaks: true });
```

具体实现方案：
1. 在 `createMarkedInstance` 中，在 marked instance 上应用 `walkTokens` 方法来遍历 token 树
2. 对每个 `type === 'list_item'` 且包含 `task: true` 的 token，注入 `data-line` 属性
3. 使用源码内容中 `[ ]` 或 `[x]` 的行来定位具体的行号

**更简洁的实现**：在 `processMermaid` 等后处理之后、DOMPurify 之前，通过正则匹配 HTML 中 `<input type="checkbox" class="task-list-item-checkbox">` 并按顺序注入 `data-line`。或者，直接在 `attachTaskHandlers` 中改为遍历 checkbox 的 DOM 位置来推算行号。

**推荐方案**：使用 marked `walkTokens` 扩展。因为 marked v12 支持 `walkTokens`，我们可以在 token 遍历时给 list_item token 附加自定义属性。

```typescript
import { Marked } from "marked";

// 创建 marked 实例后添加 walkTokens
markedInstance.use({
  walkTokens(token) {
    if (token.type === 'list_item' && (token as any).task) {
      // token has raw text, find corresponding line in source
    }
  }
});
```

最终采用：在 `attachTaskHandlers()` 中，通过对比 checkbox 所在行的文本内容与源文件行号来匹配，而非依赖 `data-line`。即遍历 checkbox 的父 `<li>` 文本内容，在源文件中查找匹配行。

**最终方案（最稳健）**：在 `attachTaskHandlers()` 中改用基于源文件内容匹配的方法：

```typescript
function attachTaskHandlers() {
  if (!previewEl || !content) return;
  const checkboxes = previewEl.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"].task-list-item-checkbox'
  );
  const sourceLines = content.split('\n');
  
  checkboxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      const li = cb.closest('li');
      if (!li || !onTaskToggle) return;
      const liText = li.textContent?.trim() || '';
      
      for (let i = 0; i < sourceLines.length; i++) {
        const line = sourceLines[i];
        if (line.includes('- [ ]') || line.includes('- [x]')) {
          const taskText = line.replace(/^[\s>]*- \[[ x]\] /, '').trim();
          if (taskText === liText || liText.includes(taskText)) {
            onTaskToggle(i, cb.checked);
            break;
          }
        }
      }
    });
  });
}
```

### 步骤2：修复代码块语法高亮 — 本地导入 CSS 主题

**文件**：`src/lib/utils/markdown.ts`

**改动**：
1. 移除 CDN 动态加载 CSS 的代码（L95-L104）
2. 改为 ES import 直接导入 highlight.js 主题 CSS

```typescript
// 替换 CDN 加载为本地导入
import 'highlight.js/styles/atom-one-dark.css';  // 暗色主题
import 'highlight.js/styles/github.css';          // 亮色主题
```

但由于需要根据模式切换主题，不能简单双导入。需要用 CSS 变量覆盖或动态切换。

**方案**：导入两个主题 CSS，通过 CSS 作用域控制在暗/亮模式下分别生效：

```typescript
// markdown.ts - 在文件顶部导入
import 'highlight.js/styles/atom-one-dark.css';
```

然后亮色模式覆盖可以通过在 app.css 中覆盖 hljs 的 CSS 变量。或者：

**更优方案**：只导入一个主题的 CSS，然后用 CSS 变量覆盖它的颜色值使其适配亮色模式。

```css
/* 暗色: 默认 atom-one-dark.css */
/* 亮色: 覆盖 hljs 相关颜色变量 */
[data-mode="light"] .hljs {
  /* 覆盖为亮色主题颜色 */
}
```

**最简单可行方案**：直接导入 `atom-one-dark.css`（暗色默认），`github.css`（亮色用）。由于 Vite 支持 CSS 导入，两个都会被捆绑。然后在运行时通过 `<style>` 标签的 `disabled` 属性或 class 做切换。

但两个文件都导入会有冲突。**最佳做法**：

1. 只导入 `atom-one-dark.css` 作为默认（暗色模式始终使用）
2. 在 app.css 中为 `[data-mode="light"]` 添加覆盖规则，将 hljs 颜色映射为亮色
3. 如果不想手写覆盖，可以用 `highlight.js/styles/github.css` 的变量，但需要 `@import` 语法

**最终采用**：由于 Vite 在构建时处理 CSS import，两个 CSS 文件都会合并到最终的 bundle。我们可以在 app.css 中添加亮色模式的 hljs 覆盖规则。但这太复杂。

**更实际的方案**：在 markdown.ts 中，根据 mode 动态 import CSS 文件内容，以 `<style>` 标签注入：

```typescript
export function createMarkedInstance(mode: string = "dark") {
  // ... remove CDN link code
  applyHljsTheme(mode);
  // ... rest
}

function applyHljsTheme(mode: string) {
  const styleId = 'hljs-theme-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  // 使用 Vite 的 ?inline 或静态 import
}
```

**最简洁方案**（采用此方案）：
1. 在 `src/lib/utils/markdown.ts` 顶部添加：`import hljsDarkTheme from 'highlight.js/styles/atom-one-dark.css?inline';` 和 `import hljsLightTheme from 'highlight.js/styles/github.css?inline';`
2. 在 `createMarkedInstance` 中用 `<style>` 注入对应的 CSS 字符串
3. 移除 CDN 创建 `<link>` 的代码

```typescript
import hljsDarkTheme from 'highlight.js/styles/atom-one-dark.css?inline';
import hljsLightTheme from 'highlight.js/styles/github.css?inline';

export function createMarkedInstance(mode: string = "dark") {
  if (typeof document === "undefined") {
    return new Marked();
  }

  let styleEl = document.getElementById("hljs-theme-style") as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "hljs-theme-style";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = mode === "light" ? hljsLightTheme : hljsDarkTheme;

  return new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try { return hljs.highlight(code, { language: lang }).value; }
          catch { return hljs.highlightAuto(code).value; }
        }
        return hljs.highlightAuto(code).value;
      },
    }),
  );
}
```

同时需要将 `highlight.js` 从 `devDependencies` 移到 `dependencies`（否则生产构建时不可用）。

### 步骤3：完善亚克力材质效果

#### 3.1 修复 body 背景阻塞问题

**文件**：`src/app.css`

将 `body` 的背景改为使用 `--acrylic-content-bg`，并在 `.acrylic-on` 下自动透明：

```css
/* 修改前 */
body {
  background: var(--color-bg);
}

/* 修改后 */
body {
  background: var(--acrylic-content-bg);
}
```

`--acrylic-content-bg` 在默认状态下是 `var(--color-bg)`，在 `.acrylic-on` 下是 `transparent`。

#### 3.2 确保所有组件使用 acrylic 变量

**文件**：`src/components/SearchBar.svelte` — 背景改为 `--acrylic-content-bg`

**文件**：`src/components/FileList.svelte` — 背景改为 `--acrylic-sidebar-bg`

#### 3.3 确认 Rust 端 Effect::Acrylic 实现正确

当前实现正确：使用 `EffectsBuilder` + `Effect::Acrylic`，调用 DWM API 实现系统级桌面模糊。无需修改。

#### 3.4 将 highlight.js 从 devDependencies 移到 dependencies

**文件**：`package.json`

```diff
- "devDependencies": { "highlight.js": "^11", ... }
+ "dependencies": { "highlight.js": "^11" }
```

因为运行时需要在 markdown.ts 中 `import hljs from 'highlight.js/lib/core'` 以及注册语言。

### 步骤4：验证

- 运行 `npm run check` 确保无 TypeScript 错误
- 运行 `cargo check` 确保 Rust 编译通过
- 启动应用验证三个功能

## 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `package.json` | 修改 | `highlight.js` 移至 `dependencies` |
| `src/lib/utils/markdown.ts` | 修改 | 本地导入 hljs CSS 主题替代 CDN |
| `src/components/Preview.svelte` | 修改 | 修复 `attachTaskHandlers` 行号匹配逻辑 |
| `src/app.css` | 修改 | `body` 背景改用 `--acrylic-content-bg` |
| `src/components/SearchBar.svelte` | 修改 | 背景改用 `--acrylic-content-bg` |
| `src/components/FileList.svelte` | 修改 | 背景改用 `--acrylic-sidebar-bg` |
