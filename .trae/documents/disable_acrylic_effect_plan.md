# 完全关闭亚克力材质效果 — 实现计划

## 需求分析

1. 完全关闭界面中的亚克力（Acrylic）材质效果，确保界面整体不呈现透明/半透明
2. 当前仅有功能栏区域（TitleBar、Toolbar、MDToolbar）使用了亚克力变量，编辑区域等其他部分为不透明
3. 关闭后功能栏区域需与其他部分保持一致的完全不透明视觉表现
4. 所有界面元素显示正常，无异常或功能影响

## 代码库分析结论

当前亚克力效果由两层协同实现：
- **系统层（Rust/Tauri）**：通过 `window.set_effects(Some(effects))` 调用 DWM API 使窗口背景模糊桌面壁纸
- **前端CSS层**：titlebar/toolbar/md-toolbar 使用 `var(--acrylic-bg)` / `var(--acrylic-bg-fallback)` 半透明背景色，让系统模糊效果"透出"

### 涉及文件清单

| 文件 | 行号 | 内容 |
|------|------|------|
| `src/app.css` | L18-L21 | 四个亚克力CSS变量定义 |
| `src/app.css` | L166 | `body { background: transparent }` |
| `src/App.svelte` | L705 | `.app { background: var(--acrylic-bg) }` |
| `src/App.svelte` | L30, L35, L516 | acrylicEnabled 导入/调用 |
| `src/components/TitleBar.svelte` | L42, L64 | 使用 `--acrylic-bg-fallback` |
| `src/components/Toolbar.svelte` | L124, L135 | 使用 `--acrylic-bg` |
| `src/lib/components/MDToolbar.svelte` | L212 | 使用 `--acrylic-bg` |
| `src/components/SettingsPanel.svelte` | L2, L4, L6-L9, L126-L140 | 设置面板中亚克力开关 |
| `src/lib/stores/ui.ts` | L23-L27, L45, L88 | acrylicEnabled store |
| `src/lib/api/window.ts` | L19-L21 | setAcrylicEffect API |
| `src-tauri/src/lib.rs` | L19-L21, L38 | 启动时设置亚克力效果 + 注册命令 |
| `src-tauri/src/commands/window_ops.rs` | L33-L46 | set_acrylic_effect 命令 |

## 实现方案

### 步骤1：修改 CSS 变量 — 将半透明色替换为完全不透明色

文件：`src/app.css`

**方案**：保留变量名（避免改大量引用），将值改为完全不透明。

```css
/* 修改前 */
--acrylic-bg: rgba(var(--color-bg-rgb), 0.55);
--acrylic-bg-fallback: rgba(var(--color-bg-rgb), 0.88);

/* 修改后 */
--acrylic-bg: var(--color-toolbar-bg);
--acrylic-bg-fallback: var(--color-toolbar-bg);
```

同时移除 `body { background: transparent }` 中的透明背景，改为 `background: var(--color-bg)`。

可选择保留 `--acrylic-blur` 和 `--acrylic-noise`（不再被引用时无影响，或直接删除）。

### 步骤2：移除 Rust 后端亚克力初始化代码

文件：`src-tauri/src/lib.rs`

- 移除 `setup` 闭包中的 `set_effects(Effect::Acrylic)` 调用（L15-L23 整个 setup 块）
- 移除 `use tauri::Manager;`（如果 `get_webview_window` 不再使用）

### 步骤3：移除 set_acrylic_effect 命令注册

文件：`src-tauri/src/lib.rs` L38

- 从 `invoke_handler` 中移除 `commands::window_ops::set_acrylic_effect`

### 步骤4：移除或保留 Rust 命令文件中的函数

文件：`src-tauri/src/commands/window_ops.rs`

- 移除 `set_acrylic_effect` 函数（L33-L46），因为不再需要

### 步骤5：移除前端 API

文件：`src/lib/api/window.ts`

- 移除 `setAcrylicEffect` 函数（L19-L21）

### 步骤6：清理设置面板中的亚克力开关 UI

文件：`src/components/SettingsPanel.svelte`

- 移除亚克力开关的 `import` 引用和 UI 代码块
- 移除 `acrylicEnabled` store 的导入（L2）、`setAcrylicEffect` API 导入（L4）
- 移除 `handleAcrylicToggle` 函数（L6-L10）
- 移除亚克力开关 UI 块（L126-L140）

### 步骤7：清理 App.svelte 中的相关引用

文件：`src/App.svelte`

- 移除 `acrylicEnabled` 的 store 导入（L30）
- 移除 `setAcrylicEffect` 的 API 导入（L35）
- 移除 L516 的 `setAcrylicEffect($acrylicEnabled)` 调用

### 步骤8：清理 stores/ui.ts 中的 acrylicEnabled

文件：`src/lib/stores/ui.ts`

**方案A（推荐：保留但标记废弃）**：保留 store 定义以避免潜在引用错误，但移除 localStorage 持久化逻辑。

**方案B（彻底移除）**：完全移除 `acrylicEnabled` 相关的所有代码（L23-L27, L45, L88）。

选择**方案A**，因为其他组件可能仍引用了该 store 的导出。确认 SettingsPanel 和 App.svelte 清理完毕后，再彻底移除。

### 步骤9：最终验证

- 运行 `svelte-check` 确保无 TypeScript 错误
- 运行 `cargo check` 确保 Rust 编译通过
- 视觉验证 titlebar/toolbar 区域不再透明，与其他区域一致

## 修改影响范围总结

| 文件 | 操作 | 行数变化 |
|------|------|---------|
| `src/app.css` | 修改 4 行 CSS 变量 + 修改 body background | ~5 行 |
| `src/App.svelte` | 移除 3 处引用 | ~3 行 |
| `src/components/SettingsPanel.svelte` | 移除 2 个 import + 函数 + UI 块 | ~18 行 |
| `src/components/TitleBar.svelte` | 无需修改（使用变量，变量值已改） | 0 行 |
| `src/components/Toolbar.svelte` | 无需修改（使用变量，变量值已改） | 0 行 |
| `src/lib/components/MDToolbar.svelte` | 无需修改（使用变量，变量值已改） | 0 行 |
| `src/lib/stores/ui.ts` | 移除 acrylicEnabled 定义/导出 | ~7 行 |
| `src/lib/api/window.ts` | 移除 setAcrylicEffect 函数 | ~3 行 |
| `src-tauri/src/lib.rs` | 移除 setup 块 + 命令注册 | ~10 行 |
| `src-tauri/src/commands/window_ops.rs` | 移除 set_acrylic_effect 函数 | ~14 行 |

## 风险控制

1. **不修改 `tauri.conf.json` 中的 `transparent: true`**：该配置为自定义窗口装饰（decorations: false）所需，修改会导致原生标题栏出现。
2. **保留 CSS 变量名**：避免修改 TitleBar、Toolbar、MDToolbar 等组件的样式代码，降低引入 bug 风险。
3. **`color-bg-rgb` 变量**：浅色模式下该变量被覆盖为 `243,243,243`，不再需要可保留或移除。本次保留。
