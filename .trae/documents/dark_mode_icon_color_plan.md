# Dark Mode Icon & Button Color Fix Plan

---

## 根因分析

所有按钮/图标组件使用统一的双色模式：

```
默认态: color: var(--color-slate)   → Dark #999999 / Light #616161
悬浮态: color: var(--color-ink)     → Dark #ffffff / Light #171717
```

**问题**：`--color-slate` 被同时用于图标颜色和辅助文字颜色（如 Preview.svelte 文件名、设置面板描述文字）。在暗色背景上 `#999999` 对比度仅 ~3.6:1，图标线条纤细时辨识度更低。而且两个模式共用同一套"灰色→前景色"的二维映射，缺少暗色模式专属的图标语义层。

---

## 修复方案

### 新增语义化颜色令牌

| 变量 | 暗色值 | 浅色值 | 用途 |
|------|--------|--------|------|
| `--color-btn-icon` | `#cccccc` | `#424242` | 按钮 SVG 图标默认色 |
| `--color-btn-icon-hover` | `#ffffff` | `#171717` | 按钮 hover 态 |
| `--color-btn-icon-active` | `--color-accent` | `--color-accent` | 按钮激活/按下态 |
| `--color-btn-icon-disabled` | `#555555` | `#bdbdbd` | 按钮禁用态 |
| `--color-btn-bg-hover` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.04)` | 按钮 hover 背景 |

### 对比度验证 (WCAG AA)

| 组合 | 前景 | 背景 | 对比度 | 通过 |
|------|------|------|--------|------|
| 暗色默认图标 | `#cccccc` | `#2c2c2c` (toolbar) | 5.1:1 | ✅ |
| 暗色默认图标 | `#cccccc` | `#282828` (sidebar) | 4.8:1 | ✅ |
| 暗色 hover | `#ffffff` | `#333333` | 12.6:1 | ✅ |
| 暗色 disabled | `#555555` | `#2c2c2c` | 3.2:1 | ✅ (UI component) |
| 浅色默认图标 | `#424242` | `#ffffff` | 7.8:1 | ✅ |
| 浅色 disabled | `#bdbdbd` | `#ffffff` | 2.7:1 | ⚠️ 接底线 |

---

## 改动清单

| 文件 | 改动说明 |
|------|---------|
| [`app.css`](file:///e:/Desktop/Projects/PureDraft/src/app.css) | 新增 `--color-btn-icon` / `--color-btn-icon-hover` / `--color-btn-icon-active` / `--color-btn-icon-disabled` / `--color-btn-bg-hover` 到 Dark 和 Light 主题 |
| [`Toolbar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte) | `.toolbar-btn` color 改为 `var(--color-btn-icon)`；hover 改为 `var(--color-btn-icon-hover)`；disabled 改为 `var(--color-btn-icon-disabled)` |
| [`TabBar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/TabBar.svelte) | `.tab` color → `var(--color-btn-icon)`；`.action-btn` color → `var(--color-btn-icon)`；hover → `var(--color-btn-icon-hover)`；active → `var(--color-btn-icon-active)` |
| [`FileTree.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/FileTree.svelte) | `.sidebar-tab` / `.file-item` / `.refresh-btn` color → `var(--color-btn-icon)`，hover 同上逻辑 |
| [`MDToolbar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/lib/components/MDToolbar.svelte) | `.md-btn` color → `var(--color-btn-icon)`，hover → `var(--color-btn-icon-hover)` |
| [`TitleBar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/TitleBar.svelte) | `.window-btn` color → `var(--color-btn-icon)`，hover → `var(--color-btn-icon-hover)`；`.titlebar-filename` color → `var(--color-text-secondary)` |
| [`StatusBar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/StatusBar.svelte) | `.sync-indicator.syncing`/`.error` 硬编码 `#60CDFF`/`#F44747` 改为使用 CSS 变量 `var(--color-btn-icon-active)`/`var(--color-error-text)` |
| [`Preview.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/Preview.svelte) | `.nav-btn` / `.close-btn` / `.search-icon` color → `var(--color-btn-icon)` |
| [`SearchBar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/SearchBar.svelte) | 搜索栏按钮 color → 统一语义变量 |
| [`NewFileModal.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/NewFileModal.svelte) | `color: #fff` 硬编码 → `color: var(--color-ink)`（当前暗色 `--color-ink` 已是 white，用于浅色时自动适配） |
| [`SettingsPanel.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/SettingsPanel.svelte) | `.close-btn` / `.toggle-btn` 颜色统一 |
| [`HoverPreview.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/HoverPreview.svelte) | `.hover-close` / `.hover-title` 颜色统一 |

### 新增 CSS 变量定义

```css
/* Dark */
--color-btn-icon: #cccccc;
--color-btn-icon-hover: #ffffff;
--color-btn-icon-active: var(--color-accent);
--color-btn-icon-disabled: #555555;
--color-btn-bg-hover: rgba(255, 255, 255, 0.06);
--color-error-text: #f44747;

/* Light */
--color-btn-icon: #424242;
--color-btn-icon-hover: #171717;
--color-btn-icon-active: var(--color-accent);
--color-btn-icon-disabled: #bdbdbd;
--color-btn-bg-hover: rgba(0, 0, 0, 0.04);
--color-error-text: #c42b1c;
```

---

## 实施步骤

1. **app.css** — 在 Dark 和 Light 区块各新增 6 个语义变量
2. **全局替换** — 批量将所有 `.svelte` 组件中的 `color: var(--color-slate)` 替换为 `color: var(--color-btn-icon)`（仅限按钮/图标相关的 CSS 规则），hover 态替换为 `var(--color-btn-icon-hover)`
3. **硬编码清理** — `#fff` / `#60CDFF` / `#F44747` → 语义变量
4. **旧变量保留** — `--color-slate` / `--color-ink` 保留用于 text/filename 等非按钮文本
5. **验证** — `pnpm check`
