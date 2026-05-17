# PureDraft Spotify 主题实现计划

## 任务概述
在 PureDraft 编辑器中添加 Spotify 风格主题，根据 SpotifyDesign.md 设计文档实现，并在设置面板中添加主题切换选项。

## 实施步骤

### 1. 更新 UI Store 支持新主题
- 修改 `src/lib/stores/ui.ts`
- 将 Theme 类型从 `'dark' | 'light'` 扩展为 `'dark' | 'light' | 'spotify'`
- 添加 Spotify 主题图标

### 2. 更新 CSS 变量 (app.css)
在 `src/app.css` 中添加 Spotify 主题的 CSS 变量：

#### Spotify 主题颜色系统
```css
[data-theme="spotify"] {
  /* Primary Brand */
  --color-green: #1ed760;        /* Spotify Green - 主品牌色 */
  --color-bg: #121212;           /* Near Black - 深黑背景 */
  --color-bg-secondary: #181818;  /* Dark Surface - 卡片表面 */
  --color-bg-hover: #282828;      /* 悬停状态 */
  
  /* Text */
  --color-ink: #ffffff;          /* White - 主要文本 */
  --color-text-primary: #ffffff;
  --color-text-secondary: #b3b3b3; /* Silver - 次要文本 */
  --color-slate: #9a9a9a;
  
  /* Surface */
  --color-border: #282828;
  --color-border-subtle: #181818;
  
  /* Editor */
  --color-editor-bg: #000000;
  --color-editor-text: #b3b3b3;
  --color-editor-gutter: #121212;
  --color-editor-active-line: rgba(30, 215, 96, 0.1);
  
  /* Preview */
  --color-preview-code-bg: #181818;
  --color-preview-code-text: #e1e4e8;
  
  /* Status bar */
  --color-statusbar-bg: #181818;
  --color-statusbar-border: #282828;
  
  /* Sidebar */
  --color-sidebar-bg: #000000;
  --color-sidebar-active: #181818;
  
  /* Toolbar */
  --color-toolbar-bg: #181818;
  --color-toolbar-border: #282828;
  
  /* Semantic Colors */
  --color-red: #f3727f;    /* Negative Red */
  --color-yellow: #ffa42b; /* Warning Orange */
  --color-focus-blue: #539df5; /* Announcement Blue */
  
  /* Shadows */
  --color-shadow: rgba(0, 0, 0, 0.5);
  --color-shadow-md: rgba(0, 0, 0, 0.3);
}
```

#### Spotify 组件样式
- 按钮使用 9999px 圆角（药丸形状）
- 加重阴影效果
- 输入框使用内嵌边框效果

### 3. 更新设置面板 (SettingsPanel.svelte)
在 `src/components/SettingsPanel.svelte` 中：

#### 修改 Theme 类型定义
```typescript
type Theme = 'dark' | 'light' | 'spotify';
```

#### 添加 Spotify 主题按钮
- 在现有 Light/Dark 按钮旁边添加 Spotify 主题按钮
- 使用 Spotify Green (#1ed760) 作为选中状态的边框色
- 按钮样式符合 Spotify 设计：药丸形状、绿色选中边框

### 4. 更新按钮全局样式
在 `src/app.css` 中添加：
```css
/* Spotify 主题按钮样式 */
[data-theme="spotify"] .theme-btn.active {
  border-color: var(--color-green);
  background: rgba(30, 215, 96, 0.1);
  color: var(--color-green);
}

[data-theme="spotify"] .theme-btn:hover {
  border-color: var(--color-green);
}
```

### 5. 验证实现
确保：
- 主题可以正确切换
- Spotify 主题颜色正确应用
- 所有组件在 Spotify 主题下正常显示
- 编辑器和预览功能正常

## 预期结果
- 设置面板包含三个主题选项：Light、Dark、Spotify
- Spotify 主题使用近黑色背景 (#121212)
- Spotify Green (#1ed760) 作为强调色
- 组件使用药丸形状和圆形几何
- 重阴影效果应用于提升元素

## 文件清单
需要修改的文件：
1. `src/lib/stores/ui.ts` - 添加主题类型
2. `src/app.css` - 添加 Spotify 主题 CSS 变量
3. `src/components/SettingsPanel.svelte` - 添加主题切换按钮
