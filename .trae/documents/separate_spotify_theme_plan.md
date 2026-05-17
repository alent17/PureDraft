# 主题与模式分离计划

## 任务概述
将当前的主题系统拆分为两个独立的维度：
1. **主题选择**：Binance.US（默认）| Spotify
2. **模式选择**：暗色 | 亮色

这是一个二维选择，可以组合出 4 种效果：
- Binance.US + 暗色
- Binance.US + 亮色
- Spotify + 暗色
- Spotify + 亮色

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

#### 2.1 主题选择（Binance.US | Spotify）
```svelte
<div class="setting-row">
  <div class="setting-info">
    <span class="setting-label">Theme</span>
    <span class="setting-desc">Choose your theme style</span>
  </div>
  <div class="theme-toggle">
    <button class="theme-btn" class:active={$theme === 'binance'} onclick={() => theme.set('binance')}>
      Binance.US
    </button>
    <button class="theme-btn" class:active={$theme === 'spotify'} onclick={() => theme.set('spotify')}>
      Spotify
    </button>
  </div>
</div>
```

#### 2.2 模式选择（暗色 | 亮色）
```svelte
<div class="setting-row">
  <div class="setting-info">
    <span class="setting-label">Mode</span>
    <span class="setting-desc">Choose light or dark mode</span>
  </div>
  <div class="theme-toggle">
    <button class="theme-btn" class:active={$mode === 'light'} onclick={() => mode.set('light')}>
      Light
    </button>
    <button class="theme-btn" class:active={$mode === 'dark'} onclick={() => mode.set('dark')}>
      Dark
    </button>
  </div>
</div>
```

### 3. 更新 CSS
修改 `src/app.css`：

将现有主题拆分为两个维度：
- 基础模式变量（light/dark）：控制基础颜色
- 主题变量（binance/spotify）：控制品牌色和特殊样式

```css
/* Binance.US 主题变量 */
[data-theme="binance"] {
  --color-accent: #f0b90b;
  --color-accent-hover: #d0980b;
}

/* Spotify 主题变量 */
[data-theme="spotify"] {
  --color-accent: #1ed760;
  --color-accent-hover: #1db954;
}
```

### 4. 更新 App.svelte 中的主题应用
修改 `src/App.svelte`：

将 `data-theme` 属性同时应用主题和模式：
```svelte
data-theme="{$theme}-{$mode}"
```

或者使用 CSS 类：
```svelte
<div class="app" class:theme-{$theme} class:mode-{$mode}>
```

## 预期 UI 布局
```
┌─────────────────────────────────┐
│  Theme                          │
│  [Binance.US] [Spotify]        │
│                                 │
│  Mode                          │
│  [Light] [Dark]               │
└─────────────────────────────────┘
```

## 预期结果
- 4 种组合可选：Binance.US暗色、Binance.US亮色、Spotify暗色、Spotify亮色
- 默认：Binance.US + 暗色
- 主题选择决定品牌色和特殊样式
- 模式选择决定基础颜色（明暗）

## 文件清单
1. `src/lib/stores/ui.ts` - 添加 theme 和 mode store
2. `src/components/SettingsPanel.svelte` - 添加主题和模式两个选择器
3. `src/app.css` - 拆分主题和模式变量
4. `src/App.svelte` - 更新主题应用逻辑
