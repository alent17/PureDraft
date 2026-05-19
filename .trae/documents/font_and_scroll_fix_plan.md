# 字体设置与滚动修复实现计划

## 需求概述

1. **字体大小设置** — 在设置面板中添加编辑器字体大小调节
2. **字体设置与自定义上传** — 可选择预设字体或上传自定义字体文件
3. **预览窗滚动回弹修复** — 修复预览窗快速滚动时会回弹的问题
4. **滚动同步更流畅** — 优化编辑器和预览之间的滚动同步体验

---

## 一、问题诊断

### 问题 A：字体设置缺失
- `ui.ts` 中已存在 `fontSize` store（默认14），但 `Editor.svelte` 中未消费它，字体在 CM 主题中硬编码为 `fontSize: '14px'`
- 无 `fontFamily` store，编辑器字体固定为 Cascadia Code / JetBrains Mono 等宽字体栈
- `SettingsPanel.svelte` 中无字体设置 UI
- `app.css` 有 `--font-mono` CSS 变量，但 Editor 未引用它

### 问题 B：预览窗滚动回弹
- **根因**：`isProgrammaticScroll` 是全局单一标志，编辑器同步时使用 `smooth` 行为 + 300ms 超时。在这 300ms 内，预览窗的用户滚动事件被全局 `isProgrammaticScroll` 阻塞，但超时结束后预览位置可能已被后续渲染改变，导致回弹。
- **位置**：[App.svelte:L90-L113](file:///e:/Desktop/Projects/PureDraft/src/App.svelte#L90-L113) 的 `syncScrollToEditor` 函数
- 策略：将编辑器同步改为 `instant` 行为，消除 300ms 阻塞窗口；改为每个目标方向独立跟踪程序滚动标志

### 问题 C：滚动同步不够流畅
- 同步使用 `behavior: 'instant'` 跳转，缺乏平滑过渡感
- 使用简单比例映射，编辑器行数与预览像素高度不成线性关系，快速滚动时跳跃感明显
- 策略：使用 `requestAnimationFrame` 批量处理同步，避免频繁跳转；引入阻尼/防抖机制

---

## 二、实现步骤

### 步骤 1：添加 `fontFamily` 和 `customFonts` store
**文件：** `src/lib/stores/ui.ts`

- 新增 `fontFamily` writable store，默认值：`"'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, monospace"`
- 新增 `customFonts` writable store，类型 `Array<{name: string, dataUrl: string}>`，用于存储用户上传的字体
- `fontFamily` 和 `fontSize` 均持久化到 localStorage
- `customFonts` 存储为 base64 data URL（限制总数，如最多5个）

```typescript
export interface CustomFont {
  name: string;
  dataUrl: string;  // base64 font data
}

const fontFamily = writable<string>(
  (typeof localStorage !== 'undefined' && localStorage.getItem('puredraft_fontFamily'))
    || "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, monospace"
);
fontFamily.subscribe(v => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('puredraft_fontFamily', v);
});

const fontSizeStore = writable<number>(
  (typeof localStorage !== 'undefined' && +(localStorage.getItem('puredraft_fontSize') || ''))
    || 14
);
fontSizeStore.subscribe(v => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('puredraft_fontSize', String(v));
});

const customFonts = writable<CustomFont[]>([]); 
// 也在 onMount 时从 localStorage 恢复
```

### 步骤 2：实现自定义字体加载器
**文件：** `src/lib/utils/fontLoader.ts`（新建）

功能：
1. `loadCustomFonts(fonts: CustomFont[])` — 遍历字体列表，使用 `FontFace` API 动态注册
2. `removeCustomFonts()` — 移除所有动态注册的字体
3. `handleFontUpload(): Promise<CustomFont | null>` — 打开文件选择对话框，读取 `.ttf`/`.otf`/`.woff`/`.woff2` 文件为 base64 data URL

```typescript
export async function loadCustomFonts(fonts: CustomFont[]): Promise<void> {
  const loadedFonts: FontFace[] = [];
  for (const font of fonts) {
    const ff = new FontFace(font.name, `url(${font.dataUrl})`);
    await ff.load();
    document.fonts.add(ff);
    loadedFonts.push(ff);
  }
  window.__puredraft_custom_fonts = loadedFonts;
}

export async function uploadFontFile(): Promise<CustomFont | null> {
  // 1. 使用 <input type="file" accept=".ttf,.otf,.woff,.woff2"> 选择文件
  // 2. 读取为 base64 data URL
  // 3. 尝试用 FontFace 验证
  // 4. 提取字体名
  // 5. 返回 CustomFont
}
```

### 步骤 3：修改 `Editor.svelte` — 动态字体大小和族
**文件：** `src/components/Editor.svelte`

当前字体硬编码在 `darkCM` 和 `lightCM` 的 `.cm-scroller` 中（[L46-L48](file:///e:/Desktop/Projects/PureDraft/src/components/Editor.svelte#L46-L48) 和 [L70-L72](file:///e:/Desktop/Projects/PureDraft/src/components/Editor.svelte#L70-L72)）。

方案：CodeMirror 的 `EditorView.theme()` 是静态 CSS，无法动态修改字体。需要使用 `EditorView.dom` 的 `style.setProperty` 动态设置 CSS 变量，然后 CM 主题引用该变量。

具体步骤：
1. 在 `getCMLightDark` 中将 `.cm-scroller` 的 `fontFamily` 改为 `var(--editor-font-mono)`，`fontSize` 改为 `var(--editor-font-size)`
2. 在 `$effect` 中（响应 `$fontSize` 和 `$fontFamily` 变化），更新 CM 的 `EditorView.dom.style` 上设置 CSS 变量
3. 同时更新 `--font-mono`（用于 Preview 等全局引用）

关键实现：
```typescript
// 在 theme 定义中将硬编码改为 CSS 变量引用
const darkCM = EditorView.theme({
  '.cm-scroller': {
    fontFamily: 'var(--editor-font-family)',
    fontSize: 'var(--editor-font-size)',
    lineHeight: '1.6', overflow: 'auto',
  },
  // ... 其他不变
});

const lightCM = EditorView.theme({
  '.cm-scroller': {
    fontFamily: 'var(--editor-font-family)',
    fontSize: 'var(--editor-font-size)',
    lineHeight: '1.6', overflow: 'auto',
  },
  // ... 其他不变
});

// 新增 $effect 响应字体变化
$effect(() => {
  const el = view?.dom;
  if (el) {
    el.style.setProperty('--editor-font-family', $fontFamily);
    el.style.setProperty('--editor-font-size', `${$fontSize}px`);
  }
  // 同时更新全局 CSS 变量，供 Preview 使用
  document.documentElement.style.setProperty('--font-mono', $fontFamily);
  document.documentElement.style.setProperty('--editor-font-size', `${$fontSize}px`);
});

// 初始加载时恢复自定义字体
onMount(() => {
  loadCustomFonts($customFonts);
  // ... 现有初始化代码
});
```

### 步骤 4：修改 `SettingsPanel.svelte` — 添加字体设置 UI
**文件：** `src/components/SettingsPanel.svelte`

新增三个设置项：

**4a. 字体大小**
- 滑块控件 `[8px ... 32px]`，步长 1px
- 当前值显示在滑块旁
- 预设按钮：12px、14px、16px、18px、20px

**4b. 字体选择**
- 下拉列表/按钮组，从预设字体中选择
- 预设字体列表：
  - `'Cascadia Code'` (Windows Terminal 默认)
  - `'JetBrains Mono'`
  - `'Fira Code'`
  - `'Consolas'` (系统默认)
  - `'Source Code Pro'`
  - `'monospace'`
- 如果用户上传了自定义字体，也显示在列表中

**4c. 自定义字体上传**
- "上传字体"按钮
- 接受 `.ttf`、`.otf`、`.woff`、`.woff2` 文件
- 上传后添加到字体列表
- 已上传字体旁显示删除按钮（×），可以移除
- 最多 5 个自定义字体

```svelte
<!-- 字体大小 -->
<div class="setting-row">
  <div class="setting-info">
    <span class="setting-label">字体大小</span>
    <span class="setting-desc">编辑器字号 (8-32px)</span>
  </div>
  <div class="font-size-control">
    <button class="size-btn" onclick={() => fontSize.set($fontSize - 1)} disabled={$fontSize <= 8}>−</button>
    <span class="size-value">{$fontSize}px</span>
    <button class="size-btn" onclick={() => fontSize.set($fontSize + 1)} disabled={$fontSize >= 32}>+</button>
    <input type="range" min="8" max="32" value={$fontSize}
      oninput={(e) => fontSize.set(parseInt(e.target.value))} class="size-slider" />
  </div>
  <div class="size-presets">
    {#each [12, 14, 16, 18, 20] as sz}
      <button class="preset-btn" class:active={$fontSize === sz} onclick={() => fontSize.set(sz)}>{sz}</button>
    {/each}
  </div>
</div>

<!-- 字体选择 -->
<div class="setting-row">
  <div class="setting-info">
    <span class="setting-label">编辑器字体</span>
  </div>
  <select class="font-select" value={currentFontName} onchange={handleFontChange}>
    <!-- 预设字体选项 -->
    <!-- 自定义字体选项 -->
  </select>
</div>

<!-- 自定义字体上传 -->
<div class="setting-row">
  <div class="setting-info">
    <span class="setting-label">自定义字体</span>
    <span class="setting-desc">上传 .ttf/.otf/.woff 字体文件</span>
  </div>
  <button class="upload-btn" onclick={handleUploadFont}>上传字体</button>
  {#each $customFonts as font}
    <div class="custom-font-item">
      <span>{font.name}</span>
      <button onclick={() => removeCustomFont(font.name)}>×</button>
    </div>
  {/each}
</div>
```

### 步骤 5：修复预览窗滚动回弹
**文件：** `src/App.svelte`

问题根因已在上方诊断部分分析。修复方案：

**5a. 编辑器同步改为 instant 行为**
将 `syncScrollToEditor` 的 `behavior: 'smooth'` 改为 `'instant'`，同时缩短 `isProgrammaticScroll` 解锁时间。

```typescript
function syncScrollToEditor(scrollDOM: HTMLElement, ratio: number): boolean {
  try {
    const s: ScrollState = {
      scrollTop: scrollDOM.scrollTop,
      scrollHeight: scrollDOM.scrollHeight,
      clientHeight: scrollDOM.clientHeight,
    };
    const target = syncEngine.applyRatioToTarget(ratio, s);
    isProgrammaticScroll = true;
    scrollDOM.scrollTop = target;  // 直接设置，无需 scrollTo
    requestAnimationFrame(() => { isProgrammaticScroll = false; });
    return true;
  } catch (err) {
    // ...
  }
}
```

**5b. 使用方向感知的程序滚动标志**
用两个独立的标志替代单个全局标志，避免滚动源被错误阻塞：

```typescript
let isProgrammaticEditorScroll = false;
let isProgrammaticPreviewScroll = false;

function handleEditorScroll(scrollTop, scrollHeight, clientHeight) {
  if (isProgrammaticEditorScroll) return;    // 仅检查编辑器方向
  // ...
}

function handlePreviewScroll(scrollTop, scrollHeight, clientHeight) {
  if (isProgrammaticPreviewScroll) return;   // 仅检查预览方向
  // ...
}

function syncScrollTo(element, ratio, label) {
  // 标记对应方向
  if (label === 'editor') isProgrammaticEditorScroll = true;
  else if (label === 'preview') isProgrammaticPreviewScroll = true;
  element.scrollTop = target;
  requestAnimationFrame(() => {
    if (label === 'editor') isProgrammaticEditorScroll = false;
    else if (label === 'preview') isProgrammaticPreviewScroll = false;
  });
}
```

### 步骤 6：优化滚动同步流畅度
**文件：** `src/App.svelte`

**6a. 增加滚动同步节流**
将 `ScrollSyncEngine` 的 `throttleMs` 从 16ms 增加到 30ms（约 33fps），减少同步频率，使滚动更平滑。

**6b. 使用 RAF 防抖批量处理同步**
在 `handleEditorScroll` 和 `handlePreviewScroll` 中使用 `requestAnimationFrame` 防抖，确保同一帧内多次滚动事件只触发一次同步：

```typescript
let pendingEditorSync: number | null = null;
let pendingPreviewSync: number | null = null;

function handleEditorScroll(scrollTop, scrollHeight, clientHeight) {
  if (isProgrammaticEditorScroll) return;
  // 取消之前的待处理同步
  if (pendingEditorSync !== null) cancelAnimationFrame(pendingEditorSync);
  
  pendingEditorSync = requestAnimationFrame(() => {
    pendingEditorSync = null;
    // 使用最新的 scrollTop 计算 ratio
    const el = editorView?.scrollDOM;
    if (!el) return;
    const state = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
    const ratio = syncEngine.onEditorScroll(state);
    if (ratio === null) return;
    syncScrollTo(previewEl, ratio, 'preview');
    syncScrollTo(hoverEl, ratio, 'hover');
  });
}
```

**6c. 同步时使用 `element.scrollTop` 直接赋值**
替代 `element.scrollTo()`，避免浏览器内部的滚动行为开销，使同步瞬时完成。

### 步骤 7：在 App.svelte 中初始化自定义字体
**文件：** `src/App.svelte`

在 `onMount` 或 `$effect` 中加载自定义字体：
```typescript
import { loadCustomFonts } from '$lib/utils/fontLoader';

$effect(() => {
  loadCustomFonts($customFonts);
});
```

### 步骤 8：类型检查和构建验证
- `npm run check` — 确保 0 错误
- `npm run build` — 确保构建成功
- 手动测试字体切换、上传、滚动行为

---

## 三、涉及的文件

| 文件 | 操作 | 修改内容 |
|------|------|----------|
| `src/lib/stores/ui.ts` | 修改 | 新增 `fontFamily`、`customFonts` store；`fontSize` 增加 localStorage 持久化 |
| `src/lib/utils/fontLoader.ts` | **新建** | 自定义字体加载/上传工具函数 |
| `src/components/Editor.svelte` | 修改 | CM 主题使用 CSS 变量引用字体；$effect 响应字体变化 |
| `src/components/SettingsPanel.svelte` | 修改 | 新增字体大小滑块、字体选择器、字体上传 UI |
| `src/App.svelte` | 修改 | 修复滚动回弹 + 优化滚动同步流畅度 + 自定义字体初始化 |
| `src/app.css` | 修改 | 新增 `--editor-font-size` / `--editor-font-family` CSS 变量 |

---

## 四、技术细节

### CM 主题动态字体方案
CM 的 `EditorView.theme()` 生成的 CSS 是静态的类名注入。要实现动态字体：

1. 在主题定义中使用 `var(--editor-font-family)` 和 `var(--editor-font-size)`
2. 通过 JS 在 `EditorView.dom` 元素上设置这些 CSS 属性
3. CM 的子元素会继承 DOM 上的 CSS 变量，实现动态切换

### 自定义字体上传流程
1. 用户点击 "上传字体" → 创建 `<input type="file">` 触发文件选择
2. 读取文件为 ArrayBuffer → 转为 base64 data URL
3. 使用 `new FontFace(name, url)` 验证字体有效性
4. 存储到 `customFonts` store + localStorage
5. 通过 `document.fonts.add()` 注册字体
6. 字体名出现在设置面板的字体列表中，可选择

### 预览回弹修复原理
- 原方案：预览滚动 → 触发平滑同步编辑器(300ms) → `isProgrammaticScroll=true` 阻塞预览用户后续滚动 → 300ms 后位置跳变
- 新方案：预览滚动 → 触发即时同步编辑器(0ms) → 分离的 `isProgrammaticPreviewScroll` 不阻塞预览 → 无阻塞无回弹
