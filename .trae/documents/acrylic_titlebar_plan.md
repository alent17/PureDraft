# TitleBar + Toolbar 亚克力材质效果实现计划

---

## 原理

Windows 11 亚克力材质 = 半透明背景 + 背景模糊 + 噪点纹理。在 Tauri WebView2 中通过 CSS `backdrop-filter: blur()` + 半透明 `rgba()` 背景 + Tauri `transparent` 窗口实现。

---

## 实施步骤

### Step 1：Tauri Rust 端 — 启用透明窗口

[`src-tauri/Cargo.toml`](file:///e:/Desktop/Projects/PureDraft/src-tauri/Cargo.toml)：
```diff
- tauri = { version = "2", features = [] }
+ tauri = { version = "2", features = ["unstable"] }
```

[`src-tauri/tauri.conf.json`](file:///e:/Desktop/Projects/PureDraft/src-tauri/tauri.conf.json)：
```diff
  "decorations": false,
  "shadow": true,
+ "transparent": true,
  "resizable": true,
```

**注意事项**：
- 上次添加 `transparent: true` 时 Cargo 构建脚本 panic（Windows RC 编译器问题）。这次需先 `cargo clean` 再 `cargo check`。
- 如仍失败，回退到 Step 2 的 CSS-only 方案（见备用方案）。

---

### Step 2：CSS 亚克力效果

#### 2.1 新增全局亚克力变量

[`src/app.css`](file:///e:/Desktop/Projects/PureDraft/src/app.css) `:root` 新增：

```css
--acrylic-bg: rgba(var(--color-bg-rgb), 0.55);
--acrylic-bg-fallback: rgba(var(--color-bg-rgb), 0.88);
--acrylic-blur: blur(20px);
--acrylic-noise: url("data:image/svg+xml,...");  /* 可选噪点纹理 */
```

#### 2.2 TitleBar 亚克力

[`src/components/TitleBar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/TitleBar.svelte) — `.titlebar` 样式：

```css
.titlebar {
    background: var(--acrylic-bg-fallback);
    backdrop-filter: var(--acrylic-blur);
    -webkit-backdrop-filter: var(--acrylic-blur);
}
@supports not (backdrop-filter: blur(1px)) {
    .titlebar { background: var(--acrylic-bg-fallback); }
}
```

#### 2.3 Toolbar 亚克力

[`src/components/Toolbar.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/Toolbar.svelte) — `.toolbar` 同上。

#### 2.4 亚克力层级透出

亚克力需要「看到」下方内容。布局中 TitleBar 和 Toolbar 是 `flex-shrink: 0`，下方 Editor/Preview 区域通过 `overflow: hidden` 裁剪。

**关键技巧**：TitleBar + Toolbar 的亚克力能「看到」的是 **下方内容区透过来的颜色**。因为 `body { background: transparent }` + Tauri `transparent: true` 时，窗口下方是桌面壁纸。亚克力的模糊是作用在**窗口下方桌面**而非 app 内部内容的。

在纯 WebView（非 transparent 窗口）下，`backdrop-filter` 作用于 TitleBar 下方紧邻的内容区域边缘 — 即 Toolbar/Editor 上部。

无论哪种场景，追加以下保护：
- `.app` 不设置 background（当前已设置 `background`，需移除）
- `.titlebar` / `.toolbar` 使用半透明背景让下方内容可见

---

### Step 3：按钮/交互保护

亚克力背景不能影响按钮可点击性。确保：
- `.titlebar` 的 `z-index: 10` 保持
- `.titlebar-right` / `.titlebar-center` 的 `-webkit-app-region: no-drag` 保持
- `.window-btn` 的交互样式不变
- 所有 SVG 图标颜色使用 `--color-btn-icon` 语义变量（已完成）

---

### Step 4：Maximize 时 SVG 背景适配

[TitleBar.svelte:L42](file:///e:/Desktop/Projects/PureDraft/src/components/TitleBar.svelte#L42) 中最大化还原图标使用 `fill="var(--color-bg)"` — 亚克力透底时此硬编码失效。改为 `fill="currentColor"` 并设置 `opacity`，或使用 `var(--acrylic-bg-fallback)`。

---

### 备用方案（Tauri transparent 不可用时）

如 Rust 构建失败，回退到纯 CSS 方案：
1. 不做 `transparent: true`
2. TitleBar/Toolbar 使用 `background: rgba(var(--color-bg-rgb), 0.85)` 半透明 + `backdrop-filter: blur(16px)` (此时模糊的是 window 内 content-area 上边缘)
3. 效果降级但仍有磨砂感

---

## 修改文件汇总

| 文件 | 操作 |
|------|------|
| `src-tauri/Cargo.toml` | `features = ["unstable"]` |
| `src-tauri/tauri.conf.json` | 新增 `"transparent": true` |
| `src/app.css` | `--acrylic-*` 变量 + `.app` 移除 solid background |
| `src/components/TitleBar.svelte` | 背景改为 acrylic + 模糊 + `@supports` fallback；修复 maximize SVG fill |
| `src/components/Toolbar.svelte` | 背景改为 acrylic + 模糊 + fallback |

---

## 验收标准

- [ ] TitleBar 呈现半透明磨砂质感，可模糊看到桌面壁纸
- [ ] Toolbar 同样呈现亚克力效果
- [ ] 按钮可正常点击，窗口拖拽正常
- [ ] 深浅模式切换时亚克力颜色跟随变化
- [ ] `cargo check` 通过
- [ ] `pnpm check` 通过
