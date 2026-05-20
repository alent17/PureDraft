# PureDraft 综合实施计划

---

## 目录

1. [主题与样式系统](#1-主题与样式系统)
   - 1.1 双主题双模式架构
   - 1.2 Spotify 主题实现
   - 1.3 暗色模式图标颜色修复
   - 1.4 Windows 11 材质窗口
   - 1.5 UI 直角化重构

2. [亚克力材质效果](#2-亚克力材质效果)
   - 2.1 真正桌面亚克力模糊效果
   - 2.2 全局亚克力材质切换
   - 2.3 亚克力开关设置

3. [滚动同步系统](#3-滚动同步系统)
   - 3.1 滚动同步功能重新设计
   - 3.2 三向实时同步 (Editor ↔ Preview ↔ Hover)
   - 3.3 滚动同步流畅度优化
   - 3.4 预览回弹修复

4. [编辑器核心功能](#4-编辑器核心功能)
   - 4.1 大纲/目录导航面板
   - 4.2 字数统计与阅读时间
   - 4.3 专注模式/打字机模式
   - 4.4 自动保存
   - 4.5 Markdown Snippets 快捷插入

5. [预览与渲染](#5-预览与渲染)
   - 5.1 Mermaid 图表渲染
   - 5.2 KaTeX 数学公式
   - 5.3 交互式任务列表
   - 5.4 图片显示修复

6. [文件管理](#6-文件管理)
   - 6.1 最近文件列表与删除
   - 6.2 文件存档槽系统
   - 6.3 新建文件自定义后缀

7. [视图布局](#7-视图布局)
   - 7.1 分屏视图 (Split View)
   - 7.2 预览悬浮窗 (Hover Preview)
   - 7.3 侧边栏折叠功能

8. [Bug 修复](#8-bug-修复)
   - 8.1 任务列表勾选功能修复
   - 8.2 代码块语法高亮修复
   - 8.3 自动保存时间显示错误

9. [代码规范与重构](#9-代码规范与重构)
   - 9.1 Claude.md 规范修复
   - 9.2 API 层改为 Result 元组模式
   - 9.3 Capabilities 模块化

---

## 1. 主题与样式系统

### 1.1 双主题双模式架构

**设计目标**：将主题系统拆分为两个独立维度

| 维度 | 选项 | 说明 |
|------|------|------|
| **主题** | Binance.US / Spotify | 决定品牌色和特殊样式 |
| **模式** | 暗色 / 亮色 | 决定基础颜色（明暗） |

**组合效果**：4 种组合可选
- Binance.US + 暗色（默认）
- Binance.US + 亮色
- Spotify + 暗色
- Spotify + 亮色

**修改文件**：
- `src/lib/stores/ui.ts` — 添加 `theme` 和 `mode` store
- `src/components/SettingsPanel.svelte` — 添加两个选择器
- `src/app.css` — 添加 4 套 CSS 变量
- `src/App.svelte` — 更新主题应用逻辑

---

### 1.2 Spotify 主题实现

**Spotify 主题颜色系统**：

| 变量 | 值 | 用途 |
|------|-----|------|
| `--color-green` | `#1ed760` | 主品牌色 |
| `--color-bg` | `#121212` | 深黑背景 |
| `--color-bg-secondary` | `#181818` | 卡片表面 |
| `--color-ink` | `#ffffff` | 主要文本 |
| `--color-text-secondary` | `#b3b3b3` | 次要文本 |

**组件样式特点**：
- 按钮使用 9999px 圆角（药丸形状）
- 加重阴影效果
- 输入框使用内嵌边框效果

---

### 1.3 暗色模式图标颜色修复

**问题根因**：`--color-slate` 被同时用于图标和辅助文字，暗色背景上对比度仅 ~3.6:1

**新增语义化颜色令牌**：

| 变量 | 暗色值 | 浅色值 | 用途 |
|------|--------|--------|------|
| `--color-btn-icon` | `#cccccc` | `#424242` | 按钮 SVG 图标默认色 |
| `--color-btn-icon-hover` | `#ffffff` | `#171717` | 按钮 hover 态 |
| `--color-btn-icon-active` | `var(--color-accent)` | `var(--color-accent)` | 按钮激活态 |
| `--color-btn-icon-disabled` | `#555555` | `#bdbdbd` | 按钮禁用态 |

---

### 1.4 Windows 11 材质窗口

**目标**：
1. 启用 Windows DWM 原生窗口阴影
2. 采用 WinUI 3 视觉语言
3. 使用 Segoe UI Variable 字体

**WinUI 3 色彩令牌**：

| 令牌 | CSS 变量 | 值 |
|------|----------|-----|
| SolidBackgroundFillColorBase | `--color-bg` | `#202020` |
| SolidBackgroundFillColorSecondary | `--color-bg-secondary` | `#2C2C2C` |
| AccentFillColorDefault | `--color-accent` | `#60CDFF` |
| TextFillColorPrimary | `--color-ink` | `#FFFFFF` |

**Rust 改动**：
```rust
.setup(|app| {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_shadow(true);
    }
    Ok(())
})
```

---

### 1.5 UI 直角化重构

**改动**：
- 全局 `--radius-sm` / `--radius-md` / `--radius-lg` 全部设为 `0px`
- 为主要区块添加 `box-shadow`

**阴影层级规划**：

| 组件 | 阴影 |
|------|------|
| TitleBar | `0 1px 3px rgba(0,0,0,0.3)` |
| Sidebar | `1px 0 4px rgba(0,0,0,0.2)` |
| SettingsPanel / Modal | `0 8px 32px rgba(0,0,0,0.5)` |

---

## 2. 亚克力材质效果

### 2.1 真正桌面亚克力模糊效果

**核心原理**：使用 Tauri 的 `Window::set_effects(Effect::Acrylic)` 调用 Windows DWM API

**架构层次**：
```
桌面壁纸
  ↓ DWM 亚克力合成器 (原生模糊 + 色调混合)
  ↓ 透明窗口 (transparent: true)
  ↓ CSS rgba() 半透明背景
  ↓ 应用内容
```

**修改文件**：
- `src-tauri/src/lib.rs` — 添加 `.setup()` 钩子调用 `set_effects(Effect::Acrylic)`
- `src-tauri/capabilities/window-control.json` — 追加 `allow-set-effects` 权限
- CSS 组件 — 移除 `backdrop-filter`，保留半透明背景

---

### 2.2 全局亚克力材质切换

**CSS 变量控制**：

```css
/* 关闭亚克力 */
:root {
  --acrylic-bg: var(--color-toolbar-bg);
  --acrylic-content-bg: var(--color-bg);
}

/* 开启亚克力 */
:root.acrylic-on {
  --acrylic-bg: rgba(var(--color-bg-rgb), 0.55);
  --acrylic-content-bg: transparent;
}
```

---

### 2.3 亚克力开关设置

**功能**：
- 设置面板添加亚克力材质开关
- 状态持久化到 localStorage
- 切换时调用 Tauri 命令动态切换效果

**修改文件**：
- `src/lib/stores/ui.ts` — 添加 `acrylicEnabled` store
- `src-tauri/src/commands/window_ops.rs` — 添加 `set_acrylic_effect` 命令
- `src/components/SettingsPanel.svelte` — 添加开关 UI

---

## 3. 滚动同步系统

### 3.1 滚动同步功能重新设计

**核心问题**：逻辑割裂、无节流、无错误处理

**新架构**：

```typescript
class ScrollSyncEngine {
  onEditorScroll(state: ScrollState): number | null
  onPreviewScroll(state: ScrollState): number | null
  updateConfig(config: Partial<SyncConfig>): void
  reset(): void
}
```

**设计原则**：
1. 集中管理 — 所有同步逻辑收敛到单一模块
2. 只通过 `scrollTop` 通信
3. 比例映射引擎（而非行号）
4. 30ms 节流 + RAF
5. 来源追踪锁

---

### 3.2 三向实时同步

**同步方向**：

```
Editor scroll → engine → Preview + HoverPreview
Preview scroll → engine → Editor + HoverPreview
Hover scroll → engine → Editor + Preview
```

**新增方法**：
```typescript
onHoverScroll(state: ScrollState): number | null
```

---

### 3.3 滚动同步流畅度优化

**关键改进**：
- 使用 CSS `scroll-behavior: smooth` 实现平滑动画
- 方向感知的标志防止回弹
- 去掉 RAF 防抖减少延迟

---

### 3.4 预览回弹修复

**根因**：`{@html safeHtml}` 更新时 `innerHTML` 被整体替换，浏览器重置 `scrollTop`

**修复方案**：
```typescript
let savedRatio = 0;

// 保存滚动比率
function handlePreviewScroll() {
  const max = previewEl.scrollHeight - previewEl.clientHeight;
  if (max > 0) savedRatio = previewEl.scrollTop / max;
}

// DOM 更新后恢复滚动位置
$effect(() => {
  const _ = safeHtml;
  requestAnimationFrame(() => {
    const max = previewEl.scrollHeight - previewEl.clientHeight;
    if (max > 0 && savedRatio > 0) {
      previewEl.scrollTo({ top: savedRatio * max, behavior: 'instant' });
    }
  });
});
```

---

## 4. 编辑器核心功能

### 4.1 大纲/目录导航面板

**功能**：
- 提取所有标题构建树形大纲
- 点击跳转对应位置
- 当前阅读标题高亮

**修改文件**：
- 新建 `src/lib/components/Outline.svelte`
- 修改 `src/lib/stores/ui.ts` — 添加 `sidebarTab` 状态

---

### 4.2 字数统计与阅读时间

**统计内容**：
- 字数（中英文混合）
- 字符数（含/不含空格）
- 段落数
- 预估阅读时间

**修改文件**：
- 新建 `src/lib/utils/statistics.ts`
- 修改 `src/components/StatusBar.svelte`

---

### 4.3 专注模式/打字机模式

**专注模式**：隐藏工具栏、侧边栏、状态栏，仅显示编辑器

**打字机模式**：光标始终保持在屏幕垂直中央

**快捷键**：`Ctrl+Shift+F` 切换，`Esc` 退出

---

### 4.4 自动保存

**功能**：
- 可配置保存间隔（10s/30s/60s/120s/关闭）
- 仅保存已修改且有保存路径的文件
- 状态栏显示自动保存状态

**修复时间显示错误**：
```typescript
let autoSaveDisplay = $derived.by(() => {
  if ($autoSaveInterval === 'off') return '';
  const sec = parseInt($autoSaveInterval);
  if (sec < 60) return `自动保存 ${sec}s`;
  return `自动保存 ${sec / 60}min`;
});
```

---

### 4.5 Markdown Snippets 快捷插入

**工具栏按钮**：
- 加粗 `Ctrl+B`
- 斜体 `Ctrl+I`
- 删除线
- 行内代码
- 链接 `Ctrl+K`
- 图片
- 引用块
- 列表
- 任务列表
- 表格模板
- 分割线
- 代码块

---

## 5. 预览与渲染

### 5.1 Mermaid 图表渲染

**实现**：检测 ` ```mermaid` 代码块，使用 Mermaid.js 渲染为 SVG

**新增依赖**：`mermaid` (^10.x)

---

### 5.2 KaTeX 数学公式

**支持**：
- 行内公式 `$E=mc^2$`
- 块级公式 `$$\int_a^b f(x)dx$$`

**新增依赖**：`katex` (^0.16.x)

---

### 5.3 交互式任务列表

**修复方案**：在 Markdown 解析阶段注入 `data-line` 属性

```typescript
function injectTaskLineNumbers(html: string, source: string): string {
  const taskLines: number[] = [];
  const sourceLines = source.split('\n');
  for (let i = 0; i < sourceLines.length; i++) {
    if (/^[\s>]*- \[[ x]\] /.test(sourceLines[i])) {
      taskLines.push(i);
    }
  }
  // 注入到 checkbox 元素
}
```

---

### 5.4 图片显示修复

**问题**：本地文件路径无法在 WebView 中加载

**修复**：选择图片后读取为 base64，插入 `![](data:image/png;base64,...)` 格式

---

## 6. 文件管理

### 6.1 最近文件列表与删除

**功能**：
- 维护最近打开文件列表（最多 20 条）
- 每个文件条目后添加删除按钮
- 标题旁添加"全部删除"按钮
- 删除时同时清理对应存档槽位

**修改文件**：
- `src/lib/utils/recentFiles.ts` — 添加 `clearRecentFiles` 函数
- `src/lib/utils/saveSlots.ts` — 添加 `clearAllSaveSlots` 函数
- `src/components/FileTree.svelte` — 添加删除按钮 UI

---

### 6.2 文件存档槽系统

**设计**：
- 手动存档：5 个槽位
- 自动存档：5 个槽位
- FIFO 覆盖策略（满时自动覆盖最旧）

**数据结构**：
```typescript
interface SaveSlotMeta {
  slotId: number;
  type: 'manual' | 'auto';
  timestamp: number;
  description: string;
  cursor: { line: number; col: number };
  contentLength: number;
  savedPath: string;
}
```

---

### 6.3 新建文件自定义后缀

**功能**：添加「自定义」模板按钮，允许用户输入任意后缀

---

## 7. 视图布局

### 7.1 分屏视图 (Split View)

**功能**：
- 左侧 Editor，右侧 Preview
- 中间可拖拽调整分割比例
- 滚动同步自动启用

**响应式断点**：
- ≥ 900px：横向排列
- < 900px：纵向堆叠

---

### 7.2 预览悬浮窗 (Hover Preview)

**设计**：
- 编辑器右下角，约 360×300px
- 初始半透明，hover 时完全显示
- 实时渲染 Markdown 内容
- 支持拖拽调整位置和大小

**快捷键**：`Ctrl+Shift+H` 切换

---

### 7.3 侧边栏折叠功能

**改进**：
- 动画过渡（width transition）
- 折叠按钮可见
- 状态持久化到 localStorage

---

## 8. Bug 修复

### 8.1 任务列表勾选功能修复

**问题**：`marked` v12 GFM 渲染器不会自动给 checkbox 添加 `data-line` 属性

**修复**：在解析阶段注入 `data-line` 属性

---

### 8.2 代码块语法高亮修复

**问题**：CSP 阻止外部 CDN CSS 加载

**修复**：本地导入 highlight.js 主题 CSS

```typescript
import hljsDarkTheme from 'highlight.js/styles/atom-one-dark.css?inline';
import hljsLightTheme from 'highlight.js/styles/github.css?inline';
```

---

### 8.3 自动保存时间显示错误

**问题**：小于 60 秒的间隔被显示为"1min"

**修复**：区分秒和分钟显示

---

## 9. 代码规范与重构

### 9.1 Claude.md 规范修复

**修复内容**：
1. 移除未使用的 `tracing::error` 导入
2. 修复 `UrlNotSupported` 类型不匹配
3. 添加 `From<tauri::Error>` 实现

---

### 9.2 API 层改为 Result 元组模式

**规范要求**：所有 IPC 调用返回 `[AppError | null, T | null]` 元组

```typescript
export async function cmd<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<[AppError | null, T | null]> {
  try {
    const data = await invoke<T>(command, args);
    return [null, data];
  } catch (err) {
    const e = err as { code: number; message: string };
    return [new AppError(e.code, e.message), null];
  }
}
```

---

### 9.3 Capabilities 模块化

**拆分文件**：
- `src-tauri/capabilities/window-control.json` — 窗口控制权限
- `src-tauri/capabilities/file-system.json` — 文件系统权限
- `src-tauri/capabilities/events.json` — 事件系统权限

---

## 实施优先级建议

| 优先级 | 模块 | 说明 |
|--------|------|------|
| **P0** | Bug 修复 | 任务列表、代码高亮、滚动回弹 |
| **P1** | 滚动同步 | 重新设计、三向同步 |
| **P2** | 主题系统 | 双主题双模式、暗色图标 |
| **P3** | 编辑器功能 | 大纲、字数统计、自动保存 |
| **P4** | 视图布局 | 分屏、悬浮窗 |
| **P5** | 代码规范 | API 重构、Capabilities |

---

## 涉及文件总览

| 目录 | 文件数 | 说明 |
|------|--------|------|
| `src/lib/utils/` | 新建/修改 ~10 | scrollSync、saveSlots、statistics、image |
| `src/lib/stores/` | 修改 2 | ui.ts、file.ts |
| `src/components/` | 修改/新建 ~15 | Editor、Preview、Toolbar、SettingsPanel 等 |
| `src/lib/api/` | 修改 3 | index.ts、file.ts、window.ts |
| `src-tauri/src/` | 修改 3 | lib.rs、error.rs、commands/window_ops.rs |
| `src-tauri/capabilities/` | 新建 3 | 模块化权限文件 |
| `src/app.css` | 修改 | 主题变量、阴影、圆角 |

---

*文档整理完成*
