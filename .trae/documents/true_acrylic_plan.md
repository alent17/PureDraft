# 真正桌面亚克力模糊效果计划

## 问题诊断

当前实现用的是 **CSS `backdrop-filter: blur(20px)`** — 这只在 WebView 内部模糊其他 DOM 元素。它无法触及桌面壁纸或 WebView 后面的窗口，因为 CSS 不感知原生操作系统合成层。

要实现 Windows 11 那种"透过窗口看到模糊桌面壁纸"的效果，必须调用 **DWM (Desktop Window Manager) 原生 API**。

---

## 正确方案：Tauri `set_effects(Effect::Acrylic)`

Tauri 2 的 `Window::set_effects()` 方法通过 Windows `SetWindowCompositionAttribute` API 创建**操作系统级**的亚克力背景幕。这个效果由 DWM 在合成器层渲染 — 窗口下方的桌面/窗口被真正模糊。

### 架构

```
桌面壁纸
  ↓ DWM 亚克力合成器 (原生模糊 + 色调混合)
  ↓ 透明窗口 (transparent: true)
  ↓ CSS rgba() 半透明背景 (提供色调/可读性, 无 backdrop-filter)
  ↓ 应用内容 (按钮、文本等)
```

---

## 实施步骤

### Step 1：Rust — 添加 `set_effects` 调用

[`src-tauri/src/lib.rs`](file:///e:/Desktop/Projects/PureDraft/src-tauri/src/lib.rs) 在 `.run()` 之前添加 `.setup()` 钩子：

```rust
use tauri::Manager;

pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if let Ok(window) = app.get_webview_window("main") {
                #[cfg(target_os = "windows")]
                {
                    use tauri::window::Effect;
                    let _ = window.set_effects(Effect::Acrylic);
                }
                // macOS 和 Linux 不使用 Effect::Acrylic，保持透明即可
            }
            Ok(())
        })
        .invoke_handler(...)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 2：权限 — 添加 `allow-set-effects`

[`src-tauri/capabilities/window-control.json`](file:///e:/Desktop/Projects/PureDraft/src-tauri/capabilities/window-control.json) 权限列表追加：

```json
"core:window:allow-set-effects"
```

### Step 3：CSS — 移除 `backdrop-filter`，保留半透明背景

DWM 处理模糊，CSS 只需提供半透明色调层。

| 文件 | 改动 |
|------|------|
| [`src/app.css`](file:///e:/Desktop/Projects/PureDraft/src/app.css) | `:root` 中移除 `--acrylic-blur` 变量（或保留给非 Windows 平台 fallback） |
| [`src/App.svelte`](file:///e:/Desktop/Projects/PureDraft/src/App.svelte) | `.app` 移除 `backdrop-filter` 和 `-webkit-backdrop-filter`，保留 `background: var(--acrylic-bg)` |
| [`src/components/TitleBar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/TitleBar.svelte) | `.titlebar` 移除 `backdrop-filter`，保留 `background: var(--acrylic-bg-fallback)` |
| [`src/components/Toolbar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte) | `.toolbar` / `.toolbar-collapsed` 移除 `backdrop-filter`，保留 `background: var(--acrylic-bg)` |
| [`src/lib/components/MDToolbar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/lib/components/MDToolbar.svelte) | `.md-toolbar` 移除 `backdrop-filter`，保留 `background: var(--acrylic-bg)` |

### Step 4：平台兼容

| 平台 | 效果 |
|------|------|
| Windows 10/11 (build 1803+) | DWM 原生亚克力 ✓ |
| macOS | 窗口透明 + CSS `backdrop-filter` fallback |
| Linux | 窗口透明 + CSS `backdrop-filter` fallback |

CSS fallback 保留 `--acrylic-blur` 变量，在非 Windows 平台使用 `backdrop-filter: var(--acrylic-blur)`。通过 JS 检测平台或保留 `@supports` 降级。

---

## 修改文件汇总

| 文件 | 操作 |
|------|------|
| `src-tauri/src/lib.rs` | 新增 `use tauri::Manager` + `.setup()` 钩子调用 `set_effects(Effect::Acrylic)` |
| `src-tauri/capabilities/window-control.json` | 权限追加 `"core:window:allow-set-effects"` |
| `src/App.svelte` | `.app` 移除 backdrop-filter 行 |
| `src/components/TitleBar.svelte` | `.titlebar` 移除 backdrop-filter 行 |
| `src/components/Toolbar.svelte` | `.toolbar` / `.toolbar-collapsed` 移除 backdrop-filter 行 |
| `src/lib/components/MDToolbar.svelte` | `.md-toolbar` 移除 backdrop-filter 行 |

---

## 验收标准

- [ ] 窗口呈现真正的桌面模糊效果（能看到模糊的桌面壁纸/下方窗口）
- [ ] TitleBar 区域在模糊上叠加半透明暗色调
- [ ] 按钮和文字清晰可读
- [ ] `cargo check` 通过
- [ ] `pnpm check` 通过
