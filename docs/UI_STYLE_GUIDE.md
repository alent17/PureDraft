# PureDraft UI 风格指南

本文档定义了 PureDraft 应用的 UI 设计规范，所有新增界面都应遵循此文档。

---

## 1. 设计原则

### 1.1 核心理念
- **简洁现代**：遵循 Windows 11 / WinUI 3 设计语言
- **亚克力材质**：半透明毛玻璃效果，增强层次感
- **一致性**：统一的颜色、间距、圆角、动画
- **可访问性**：良好的对比度和交互反馈

### 1.2 设计参考
- Microsoft WinUI 3 Design System
- Windows 11 Fluent Design
- VS Code 界面风格

---

## 2. 颜色系统

### 2.1 主题色

| 用途 | 深色模式 | 浅色模式 | CSS 变量 |
|------|---------|---------|----------|
| **强调色** | `#60cdff` | `#005fb8` | `--color-accent` |
| **强调色悬停** | `#88d8ff` | `#003e92` | `--color-accent-hover` |

### 2.2 背景色

| 用途 | 深色模式 | 浅色模式 | CSS 变量 |
|------|---------|---------|----------|
| 主背景 | `#202020` | `#f3f3f3` | `--color-bg` |
| 次级背景 | `#2c2c2c` | `#ffffff` | `--color-bg-secondary` |
| 悬停背景 | `#333333` | `#e6e6e6` | `--color-bg-hover` |
| 激活背景 | `#393939` | `#dcdcdc` | `--color-bg-active` |
| 编辑器背景 | `#1f1f1f` | `#ffffff` | `--color-editor-bg` |
| 侧边栏背景 | `#282828` | `#ffffff` | `--color-sidebar-bg` |
| 工具栏背景 | `#2c2c2c` | `#ffffff` | `--color-toolbar-bg` |
| 状态栏背景 | `#0078d4` | `#005fb8` | `--color-statusbar-bg` |

### 2.3 文字色

| 用途 | 深色模式 | 浅色模式 | CSS 变量 |
|------|---------|---------|----------|
| 主文字 | `#ffffff` | `#171717` | `--color-ink` / `--color-text-primary` |
| 次级文字 | `#b0d6ff` | `#003e92` | `--color-text-secondary` |
| 灰色文字 | `#999999` | `#616161` | `--color-slate` |
| 禁用文字 | `#555555` | `#bdbdbd` | `--color-btn-icon-disabled` |

### 2.4 边框色

| 用途 | 深色模式 | 浅色模式 | CSS 变量 |
|------|---------|---------|----------|
| 主边框 | `#3b3b3b` | `#d1d1d1` | `--color-border` |
| 次级边框 | `#2e2e2e` | `#e0e0e0` | `--color-border-subtle` |

### 2.5 特殊色

| 用途 | 颜色 | 说明 |
|------|------|------|
| 危险/删除 | `#e5534b` | 删除、警告等危险操作 |
| 成功 | `#4caf50` | 成功状态 |
| 警告 | `#ff9800` | 警告状态 |

---

## 3. 圆角规范

| 级别 | 值 | 用途 | CSS 变量 |
|------|-----|------|----------|
| 小 | `4px` | 小按钮、标签、输入框内部元素 | `--radius-sm` |
| 中 | `8px` | 按钮、输入框、卡片内部元素 | `--radius-md` |
| 大 | `12px` | 对话框、面板、大卡片 | `--radius-lg` |
| 超大 | `16px` | 模态框、大型容器 | `--radius-xl` |
| 胶囊 | `9999px` | 标签、徽章 | `--radius-pill` |

---

## 4. 间距规范

### 4.1 基础间距
使用 4px 为基础单位：`4px`、`8px`、`12px`、`16px`、`20px`、`24px`

### 4.2 组件内间距

| 组件 | 内间距 (padding) |
|------|-----------------|
| 小按钮 | `4px 8px` |
| 中按钮 | `8px 16px` |
| 大按钮 | `10px 20px` |
| 输入框 | `10px 14px` |
| 对话框 | `24px` |
| 卡片 | `16px` |
| 列表项 | `8px 12px` |

### 4.3 组件外间距

| 场景 | 外间距 (margin) |
|------|----------------|
| 组件之间 | `8px` |
| 区块之间 | `16px` |
| 区段之间 | `24px` |

---

## 5. 布局尺寸

### 5.1 固定高度

| 组件 | 高度 | CSS 变量 |
|------|------|----------|
| 标题栏 | `32px` | `--titlebar-height` |
| 工具栏 | `36px` | `--toolbar-height` |
| 标签栏 | `36px` | `--tabbar-height` |
| 状态栏 | `26px` | `--statusbar-height` |

### 5.2 侧边栏

| 属性 | 值 | CSS 变量 |
|------|-----|----------|
| 宽度 | `60px` | `--sidebar-width` |
| 折叠宽度 | `36px` | `--sidebar-collapsed-width` |
| 项目大小 | `40px` | `--sidebar-item-size` |
| 项目圆角 | `8px` | `--sidebar-item-radius` |
| 边距 | `12px` | `--sidebar-margin` |

---

## 6. 字体规范

### 6.1 字体家族

```css
/* 系统字体 */
--font-system: "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;

/* 等宽字体 */
--font-mono: "Cascadia Code", "JetBrains Mono", "Fira Code", Consolas, monospace;
```

### 6.2 字号

| 用途 | 字号 | 字重 |
|------|------|------|
| 大标题 | `16px` | `600` (Semibold) |
| 标题 | `14px` | `600` (Semibold) |
| 正文 | `13px` | `400` (Normal) |
| 小文字 | `12px` | `400` (Normal) |
| 微小文字 | `11px` | `400` (Normal) |
| 标签文字 | `10px` | `600` (Semibold) |

---

## 7. 阴影规范

| 级别 | 深色模式 | 浅色模式 | 用途 |
|------|---------|---------|------|
| 标题栏 | `0 1px 3px rgba(0,0,0,0.4)` | `0 1px 2px rgba(0,0,0,0.06)` | `--shadow-titlebar` |
| 侧边栏 | `1px 0 4px rgba(0,0,0,0.25)` | `1px 0 4px rgba(0,0,0,0.04)` | `--shadow-sidebar` |
| 面板 | `0 2px 8px rgba(0,0,0,0.4)` | `0 2px 6px rgba(0,0,0,0.06)` | `--shadow-panel` |
| 弹出层 | `0 8px 32px rgba(0,0,0,0.6)` | `0 8px 24px rgba(0,0,0,0.1)` | `--shadow-elevated` |

---

## 8. 动画规范

### 8.1 时长

| 类型 | 时长 | 用途 |
|------|------|------|
| 快速 | `100ms` | 按钮悬停、颜色变化 |
| 标准 | `150ms` | 面板展开、下拉菜单 |
| 中等 | `200ms` | 对话框、模态框 |
| 慢速 | `300ms` | 主题切换、大动画 |

### 8.2 缓动函数

```css
/* 标准缓动 */
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* 弹性缓动 */
--ease-bounce: cubic-bezier(0.2, 0.8, 0.2, 1);
```

### 8.3 常用动画

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 上滑淡入 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 缩放淡入 */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## 9. 组件规范

### 9.1 按钮

```css
/* 基础按钮 */
.btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-btn-icon);
  background: transparent;
  border: 1px solid var(--color-border);
  transition: all 120ms ease;
}

.btn:hover {
  background: var(--color-btn-bg-hover);
  color: var(--color-btn-icon-hover);
}

/* 主要按钮 */
.btn-primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

/* 危险按钮 */
.btn-danger {
  background: #e5534b;
  border-color: #e5534b;
  color: white;
}

.btn-danger:hover {
  background: #c4453c;
  border-color: #c4453c;
}
```

### 9.2 输入框

```css
.input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-ink);
  transition: border-color 120ms ease, box-shadow 120ms ease;
  outline: none;
}

.input::placeholder {
  color: var(--color-slate);
}

.input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(96, 205, 255, 0.15);
}
```

### 9.3 对话框

```css
/* 遮罩层 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 150ms ease-out;
}

/* 对话框主体 */
.dialog {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* 图标区域 */
.dialog-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--color-accent);
}

.dialog-icon svg {
  width: 48px;
  height: 48px;
  padding: 10px;
  background: rgba(96, 205, 255, 0.1);
  border-radius: 50%;
}

/* 标题 */
.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 16px 0;
  text-align: center;
}

/* 按钮区域 */
.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
```

### 9.4 下拉菜单

```css
.dropdown-menu {
  position: absolute;
  right: 4px;
  top: 100%;
  z-index: 1000;
  min-width: 130px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  padding: 4px;
  animation: dropdownIn 120ms ease-out;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--color-ink);
  border-radius: var(--radius-sm);
  transition: background 100ms ease;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--color-btn-bg-hover);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 3px 0;
}
```

### 9.5 Tooltip

```css
/* 深色模式 - 白色背景黑色文字 */
.tooltip-dark {
  color: #1e1e1e;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 浅色模式 - 黑色背景白色文字 */
.tooltip-light {
  color: #ffffff;
  background: rgba(30, 30, 30, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
```

---

## 10. 图标规范

### 10.1 尺寸

| 用途 | 尺寸 |
|------|------|
| 工具栏图标 | `14px` - `16px` |
| 菜单图标 | `12px` - `14px` |
| 对话框图标 | `24px` - `48px` |
| 状态图标 | `10px` - `12px` |

### 10.2 描边

- 默认描边宽度：`2px`
- 细描边：`1.5px`
- 粗描边：`2.5px`

---

## 11. 亚克力效果

### 11.1 启用亚克力

```css
:root.acrylic-on {
  --acrylic-bg: rgba(var(--color-bg-rgb), 0.55);
  --acrylic-sidebar-bg: rgba(var(--color-bg-rgb), 0.6);
  --acrylic-editor-bg: rgba(var(--color-bg-rgb), 0.5);
}
```

### 11.2 毛玻璃遮罩

```css
.glass-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
```

---

## 12. 响应式断点

| 断点 | 宽度 | 用途 |
|------|------|------|
| 小 | `< 640px` | 移动设备 |
| 中 | `640px - 1024px` | 平板 |
| 大 | `> 1024px` | 桌面 |

---

## 13. 无障碍规范

### 13.1 对比度
- 正文文字对比度至少 `4.5:1`
- 大文字对比度至少 `3:1`
- 交互元素对比度至少 `3:1`

### 13.2 焦点状态
```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

### 13.3 交互反馈
- 所有可点击元素必须有 `hover` 状态
- 按钮点击应有 `active` 状态（缩放或颜色变化）
- 禁用状态应有视觉提示（降低透明度）

---

## 14. 文件命名规范

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| 组件文件 | PascalCase | `ConfirmDialog.svelte` |
| 工具文件 | camelCase | `scrollSync.ts` |
| Store 文件 | camelCase | `ui.ts` |
| 样式文件 | kebab-case | `app.css` |

---

## 15. 代码示例

### 15.1 创建新对话框

```svelte
<script lang="ts">
  let {
    title = '标题',
    onConfirm,
    onCancel,
  }: {
    title?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onCancel?.();
    else if (e.key === 'Enter') onConfirm?.();
  }
</script>

<div class="dialog-overlay" onclick={onCancel} onkeydown={handleKeydown}>
  <div class="dialog" onclick={(e) => e.stopPropagation()}>
    <div class="dialog-icon">
      <!-- 图标 SVG -->
    </div>
    <h3 class="dialog-title">{title}</h3>
    <!-- 内容 -->
    <div class="dialog-actions">
      <button class="btn" onclick={onCancel}>取消</button>
      <button class="btn btn-primary" onclick={onConfirm}>确定</button>
    </div>
  </div>
</div>

<style>
  /* 参考第 9.3 节对话框样式 */
</style>
```

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-05-20 | 1.0.0 | 初始版本 |
