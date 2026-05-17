# 双主题双模式实现计划

## 任务概述
根据 `BinanceUSDesign.md` 和 `SpotifyDesign.md` 设计文档，实现：
- **两种主题**：Binance.US（默认）| Spotify
- **两种模式**：暗色 | 亮色
- 共 4 种组合效果

## 设计规范对比

| 属性 | Binance.US | Spotify |
|------|------------|---------|
| 主色调 | `#F0B90B` (Binance Yellow) | `#1ed760` (Spotify Green) |
| 暗色背景 | `#222126` | `#121212` |
| 亮色背景 | `#FFFFFF` | `#FFFFFF` |
| 暗色卡片 | `#2B2F36` | `#181818` |
| 按钮圆角 | 50px (药丸) | 9999px (药丸) |
| 字体 | BinancePlex | SpotifyMixUI |

## 实施步骤

### 1. 更新 Theme Store
修改 `src/lib/stores/ui.ts`：
```typescript
// 主题类型：Binance.US | Spotify
export type Theme = 'binance' | 'spotify';

// 模式类型：暗色 | 亮色
export type Mode = 'dark' | 'light';

export const theme = writable<Theme>('binance');
export const mode = writable<Mode>('dark');
```

### 2. 更新设置面板
修改 `src/components/SettingsPanel.svelte`：

添加两个选择器：
1. **Theme 选择**：Binance.US | Spotify
2. **Mode 选择**：Dark | Light

### 3. 更新 CSS
修改 `src/app.css`：

#### 3.1 Binance.US 暗色变量
```css
[data-theme="binance"][data-mode="dark"] {
  --color-bg: #222126;
  --color-bg-secondary: #2B2F36;
  --color-ink: #FFFFFF;
  --color-accent: #F0B90B;
  /* ... */
}
```

#### 3.2 Binance.US 亮色变量
```css
[data-theme="binance"][data-mode="light"] {
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F5F5;
  --color-ink: #1E2026;
  --color-accent: #F0B90B;
  /* ... */
}
```

#### 3.3 Spotify 暗色变量
```css
[data-theme="spotify"][data-mode="dark"] {
  --color-bg: #121212;
  --color-bg-secondary: #181818;
  --color-ink: #FFFFFF;
  --color-accent: #1ed760;
  /* ... */
}
```

#### 3.4 Spotify 亮色变量
```css
[data-theme="spotify"][data-mode="light"] {
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F5F5;
  --color-ink: #121212;
  --color-accent: #1ed760;
  /* ... */
}
```

### 4. 更新 App.svelte
修改主题应用逻辑：
```svelte
data-theme={$theme}
data-mode={$mode}
```

### 5. 更新设置面板样式
根据不同主题调整按钮选中颜色：
- Binance.US 选中：`#F0B90B`
- Spotify 选中：`#1ed760`

## 预期 UI 布局
```
┌─────────────────────────────────┐
│  Theme                          │
│  [Binance.US] [Spotify]        │
│                                 │
│  Mode                          │
│  [Dark] [Light]               │
└─────────────────────────────────┘
```

## 预期结果
- 4 种组合可选
- 默认：Binance.US + Dark
- 主题决定品牌色和特殊样式
- 模式决定基础颜色（明暗）

## 文件清单
1. `src/lib/stores/ui.ts` - 添加 theme 和 mode store
2. `src/components/SettingsPanel.svelte` - 添加两个选择器
3. `src/app.css` - 添加 4 套 CSS 变量
4. `src/App.svelte` - 更新主题应用逻辑
