# Windows 11 材质窗口 + 增强语法高亮计划

***

## Part 1：Windows 11 材质窗口

### 现状

| 配置            | 当前值                                                        |
| ------------- | ---------------------------------------------------------- |
| `decorations` | `false`（无边框，完全自绘）                                          |
| 主题            | 自定义 VS Code Dark+ 配色                                       |
| 字体            | `-apple-system, BlinkMacSystemFont, "Segoe UI"...`         |
| Rust 依赖       | `tauri = { version = "2", features = [] }` — 无窗口特效 feature |

### 目标

1. 启用 Windows DWM 原生窗口阴影（`WindowBuilder::shadow(true)`）
2. CSS 层面模拟 WinUI 3 视觉语言，保持直角（已有 `--radius-*: 0px`）+ 外阴影
3. 采用 Windows 11 系统字体 Segoe UI Variable
4. 更新 WinUI 色彩令牌

### Rust 改动

**`src-tauri/Cargo.toml`** — 启用 tauri 的 window 相关 features：

```toml
tauri = { version = "2", features = ["unstable"] }
```

**`src-tauri/src/lib.rs`** — 在 `tauri::Builder` 链中添加窗口创建钩子，对每个窗口应用 shadow：

```rust
.setup(|app| {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_shadow(true);
    }
    Ok(())
})
```

`set_shadow(true)` 调用 Windows DWM `DwmExtendFrameIntoClientArea` API，实现原生窗口阴影。该方法在 Tauri 2 中可直接用，不需要额外 crate。

### CSS/主题改动

**`src/app.css`** — 替换为 WinUI 3 色彩系统：

| WinUI 令牌                          | CSS 变量                 | 值                     |
| --------------------------------- | ---------------------- | --------------------- |
| SolidBackgroundFillColorBase      | `--color-bg`           | `#202020`             |
| SolidBackgroundFillColorSecondary | `--color-bg-secondary` | `#2C2C2C`             |
| SolidBackgroundFillColorTertiary  | `--color-bg-hover`     | `#333333`             |
| TextFillColorPrimary              | `--color-ink`          | `#FFFFFF`             |
| TextFillColorSecondary            | `--color-slate`        | `#999999`             |
| SurfaceStrokeColorDefault         | `--color-border`       | `#3B3B3B`             |
| AccentFillColorDefault            | `--color-accent`       | `#60CDFF` (WinUI 系统蓝) |
| AccentFillColorSecondary          | `--color-accent-hover` | `#88D8FF`             |
| ControlFillColorDefault           | `--color-control-bg`   | `#FFFFFF0D` (半透明)     |

**字体**：`body { font-family: "Segoe UI Variable", "Segoe UI", ... }`

**窗口外阴影**（CSS 兜底 — 当 DWM shadow 不可用时）：

```css
.app {
  box-shadow: 0 0 0 1px rgba(255,255,255,0.08),  /* 外围描边 */
              0 8px 32px rgba(0,0,0,0.6);         /* 投影 */
}
```

**TitleBar 更新** — WinUI 标题栏标准高度 32px：

```css
--titlebar-height: 32px;
```

***

## Part 2：增强语法高亮

### 现状

[Editor.svelte:L92-L108](file:///e:/Desktop/Projects/PureDraft/src/components/Editor.svelte#L92-L108) 的 `darkHighlight` 覆盖了 17 个 Lezer tag，基本覆盖 VS Code Dark+ 调色板。用户反馈需要"不同语言间有明显区分"。

### 分析

CodeMirror 6 的语法高亮由两部分决定：

1. **语言扩展**（`@codemirror/lang-*`）→ 决定每个 token 对应哪个 Lezer tag
2. **HighlightStyle** → 决定每个 Lezer tag 映射到什么颜色

不同语言自然会得到不同的视觉结果（因为语言定义不同），但当前问题在于：

* 所有语言的关键字都是同一蓝色 `#569CD6`

* 所有语言的字符串都是同一橙色 `#CE9178`

* 缺乏某些语言的专属 tag 覆盖

### 增强方案

在不改变架构的前提下，大幅扩展 `darkHighlight` / `lightHighlight` 的 tag → color 映射表：

#### Dark 主题完整调色板

```
┌─────────────────────┬──────────────────────────────┐
│ 语义类别             │ 颜色                         │
├─────────────────────┼──────────────────────────────┤
│ 关键字 (keyword)     │ #569CD6 (蓝) — 所有语言      │
│ 控制流 (control)     │ #C586C0 (紫) — if/for/while  │
│ 类型/类名            │ #4EC9B0 (青) — class/interface│
│ 函数定义             │ #DCDCAA (黄)                  │
│ 函数调用             │ #C8C8C8 (白) — 区别于定义     │
│ 字符串               │ #CE9178 (橙)                  │
│ 模板字符串表达式      │ #569CD6 (蓝) — JS ${expr}    │
│ 数字                 │ #B5CEA8 (浅绿)                │
│ 正则表达式           │ #D16969 (暗红)                │
│ 注释                 │ #6A9955 (绿)                  │
│ 文档注释             │ #608B4E (深绿)                │
│ 变量                 │ #9CDCFE (浅蓝)                │
│ 属性名               │ #9CDCFE (浅蓝)                │
│ 运算符               │ #D4D4D4 (白)                  │
│ 标签/JSX 标签名      │ #569CD6 (蓝)                  │
│ HTML 属性名          │ #9CDCFE (浅蓝)                │
│ HTML 属性值          │ #CE9178 (橙)                  │
│ CSS 属性             │ #9CDCFE (浅蓝)                │
│ CSS 值               │ #CE9178 (橙)                  │
│ Markdown 标题        │ #569CD6 (蓝) bold             │
│ Markdown 加粗        │ #DCDCAA (黄) bold             │
│ Markdown 斜体        │ #C586C0 (紫) italic           │
│ Markdown 代码         │ #CE9178 (橙) bg #1E1E1E      │
│ Markdown 链接文字     │ #4FC1FF (蓝) underline        │
│ Markdown 链接 URL     │ #6A9955 (绿)                 │
│ 分隔符/括号           │ #808080 (灰)                  │
│ 特殊符号             │ #D4D4D4 (白)                  │
│ 错误标记             │ #F44747 (红) underline         │
│ 废弃/删除线          │ #F44747 (红) line-through     │
│ 插入/新增            │ #4EC9B0 (青)                  │
│ 修改                 │ #DCDCAA (黄)                  │
└─────────────────────┴──────────────────────────────┘
```

#### Light 主题对应调色板

使用 VS Code Light+ 调色板（与 Dark 对应但适配白色背景）：

```
keyword: #0000FF, type: #267F99, function: #795E26,
string: #A31515, number: #098658, comment: #008000,
variable: #001080, operator: #000000, etc.
```

### 修改文件

| 文件                               | 改动                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `src-tauri/Cargo.toml`           | 添加 `tauri` 的 `unstable` feature                                                                      |
| `src-tauri/src/lib.rs`           | 添加 `.setup()` 钩子，调用 `set_shadow(true)`                                                               |
| `src/app.css`                    | 重写暗色/浅色主题为 WinUI 3 色彩令牌；更新字体为 Segoe UI Variable；窗口级 box-shadow                                       |
| `src/components/Editor.svelte`   | 扩展 `darkHighlight` 从 17 个 tag → \~30 个 tag；扩展 `lightHighlight` 对应；CodeMirror tooltip 去掉 borderRadius |
| `src/components/TitleBar.svelte` | 高度调整适配新 `--titlebar-height: 32px`                                                                    |

***

## 实施步骤

1. **Rust 窗口 shadow** — 修改 `Cargo.toml` + `lib.rs`，添加 `.setup()` 启用 DWM shadow
2. **app.css WinUI 3 主题** — 色彩令牌全量替换、Segoe UI Variable 字体、窗口投影
3. **Editor.svelte 语法高亮增强** — 扩展 darkHighlight/lightHighlight 到 \~30 个 color tags
4. **TitleBar 高度适配** — 更新为 WinUI 标准 32px
5. **运行** **`pnpm check`** **+** **`cargo check`** — 前后端验证

