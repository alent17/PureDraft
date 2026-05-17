# 全局亚克力材质 + MD测试文档 — 实现计划

## 需求分析

### 需求1：生成MD测试文档
生成一个涵盖Markdown各项功能的测试文档（数学公式KaTeX、表格、代码块、任务列表、图片等），用于测试编辑器的渲染能力。

### 需求2：全局亚克力材质效果
- **开启时**：整个界面所有区域（顶部栏、功能栏、侧边栏、编辑栏、预览栏、状态栏等）均应用亚克力材质效果（非透明，而是系统级模糊效果）
- **关闭时**：所有界面恢复为完全不透明材质
- 开关放置在设置页面内
- 开关状态需要持久化保存

## 代码库分析结论

### 当前状态
- `tauri.conf.json` 中 `"transparent": true` 保留（自定义窗口装饰所需）
- Rust 后端：`set_acrylic_effect` 命令已被移除 → 需要重新添加
- 前端 API `window.ts`：`setAcrylicEffect` 已被移除 → 需要重新添加
- Store `ui.ts`：`acrylicEnabled` 已被移除 → 需要重新添加
- 设置面板：亚克力开关已被移除 → 需要重新添加
- CSS：`--acrylic-bg` 当前为 `var(--color-toolbar-bg)`（不透明色），需要改为支持切换

### 关键设计
全局亚克力的核心思路：当启用时，系统层（DWM API）模糊桌面壁纸，前端各区域使用半透明背景"透出"模糊效果。通过 CSS 类切换统一控制所有区域的透明度。

## 实现步骤

### 步骤1：生成 MD 测试文档

创建 `test_markdown_features.md` 文件在项目根目录，包含以下 Markdown 功能测试内容：
- 多级标题 (H1-H6)
- 数学公式 (KaTeX)：行内公式 `$E=mc^2$`、块级公式 `$$\int_0^\infty e^{-x^2}dx$$`
- 表格（含对齐）
- 代码块（多种语言语法高亮）
- 任务列表
- 引用块、嵌套引用
- 有序/无序列表及嵌套
- 图片引用
- 链接
- 加粗、斜体、删除线、行内代码
- 分割线
- HTML 标签
- 脚注
- Emoji

### 步骤2：恢复 Rust 后端亚克力切换命令

文件：`src-tauri/src/commands/window_ops.rs`

在文件末尾添加 `set_acrylic_effect` 命令：
```rust
#[tauri::command]
pub fn set_acrylic_effect(window: WebviewWindow, enabled: bool) -> Result<(), AppError> {
    #[cfg(target_os = "windows")]
    {
        use tauri::window::{Effect, EffectsBuilder};
        if enabled {
            let effects = EffectsBuilder::new().effects(vec![Effect::Acrylic]).build();
            window.set_effects(Some(effects))?;
        } else {
            window.set_effects(None)?;
        }
    }
    Ok(())
}
```

文件：`src-tauri/src/lib.rs`

在 `invoke_handler` 中注册新命令：
```rust
commands::window_ops::set_acrylic_effect,
```

### 步骤3：恢复前端 API

文件：`src/lib/api/window.ts`

在文件末尾添加：
```typescript
export function setAcrylicEffect(enabled: boolean): Promise<[AppError | null, null]> {
  return cmd<void>("set_acrylic_effect", { enabled }) as Promise<[AppError | null, null]>;
}
```

### 步骤4：恢复状态管理

文件：`src/lib/stores/ui.ts`

添加 `acrylicEnabled` store（支持 localStorage 持久化，默认值 `true`）：
```typescript
const savedAcrylic = typeof localStorage !== 'undefined' ? localStorage.getItem('puredraft_acrylic') : null;
const acrylicEnabled = writable<boolean>(savedAcrylic !== null ? savedAcrylic === 'true' : true);
acrylicEnabled.subscribe(v => {
  if (typeof localStorage !== 'undefined') localStorage.setItem('puredraft_acrylic', String(v));
});
```

在 return 对象和 export 中添加 `acrylicEnabled`。

### 步骤5：添加设置面板开关

文件：`src/components/SettingsPanel.svelte`

在脚本部分：
- 导入 `acrylicEnabled` store
- 导入 `setAcrylicEffect` API
- 添加 `handleAcrylicToggle` 异步函数

在模板部分（"快捷键"设置项之前）：
- 添加"亚克力材质"设置行，包含标签、描述和开关按钮

### 步骤6：修改 app.css — 实现全局亚克力 CSS 变量

**核心思路**：使用 `.acrylic-on` CSS 类控制全局颜色变量。

```css
/* ==================== 亚克力材质全局切换 ==================== */

/* 关闭亚克力（默认）：所有区域完全不透明 */
:root,
.app {
  --acrylic-bg: var(--color-toolbar-bg);
  --acrylic-bg-fallback: var(--color-toolbar-bg);
  --acrylic-sidebar-bg: var(--color-sidebar-bg);
  --acrylic-content-bg: var(--color-bg);
  --acrylic-editor-bg: var(--color-editor-bg);
  --acrylic-statusbar-bg: var(--color-statusbar-bg);
}

/* 开启亚克力：所有区域半透明 */
:root.acrylic-on,
.app.acrylic-on {
  --acrylic-bg: rgba(var(--color-bg-rgb), 0.55);
  --acrylic-bg-fallback: rgba(var(--color-bg-rgb), 0.65);
  --acrylic-sidebar-bg: rgba(var(--color-bg-rgb), 0.6);
  --acrylic-content-bg: transparent;
  --acrylic-editor-bg: rgba(var(--color-bg-rgb), 0.5);
  --acrylic-statusbar-bg: rgba(0, 120, 212, 0.7);
}
```

同时将 `body { background: var(--color-bg); }` 改为在亚克力开启时也透明。

### 步骤7：修改组件使用全局亚克力 CSS 变量

以下组件/区域的 `background` 需要改用新的 `--acrylic-*` 变量：

| 位置 | 文件 | 选择器 | 当前值 | 改为 |
|------|------|--------|--------|------|
| 标题栏 | TitleBar.svelte L64 | `.titlebar` | `var(--acrylic-bg-fallback)` | 保持不变（变量值会随类切换） |
| 工具栏 | Toolbar.svelte L124 | `.toolbar` | `var(--acrylic-bg)` | 保持不变 |
| 工具栏(折叠) | Toolbar.svelte L135 | `.toolbar-collapsed` | `var(--acrylic-bg)` | 保持不变 |
| MD工具栏 | MDToolbar.svelte L212 | `.md-toolbar` | `var(--acrylic-bg)` | 保持不变 |
| 侧边栏 | App.svelte L722 | `.sidebar-panel` | `var(--color-sidebar-bg)` | `var(--acrylic-sidebar-bg)` |
| 欢迎页 | App.svelte L827 | `.welcome` | `var(--color-bg)` | `var(--acrylic-content-bg)` |
| 编辑预览区 | — | `.editor-preview-area` | 无背景 | 添加 `var(--acrylic-content-bg)` |
| 内容区 | App.svelte | `.content-area` | 无背景 | 添加 `background: var(--acrylic-content-bg)` |
| 状态栏 | StatusBar.svelte L86 | `.statusbar` | `var(--color-statusbar-bg)` | `var(--acrylic-statusbar-bg)` |
| Tab栏 | TabBar.svelte L99 | `.tabbar` | `var(--color-bg)` | `var(--acrylic-content-bg)` |
| 预览区 | Preview.svelte | `.preview` | 无明确背景 | 继承父级即可 |
| 编辑器区 | Editor.svelte | CodeMirror主题 | 动态设置 | 通过 `--acrylic-editor-bg` 变量 |

**不修改的组件**：
- SettingsPanel（模态对话框，保持不透明）
- NewFileModal（模态对话框，保持不透明）
- HoverPreview（浮动预览窗，保持不透明）

### 步骤8：修改 App.svelte

1. 导入 `acrylicEnabled` store 和 `setAcrylicEffect` API
2. 在 root `.app` div 上添加动态 class：`class:acrylic-on={$acrylicEnabled}`
3. 在 `<html>` 元素上也添加 class（用于 `:root` 选择器）
4. 在 `onMount` 中调用 `setAcrylicEffect($acrylicEnabled)` 应用持久化状态
5. 更新 `.sidebar-panel` 和 `.welcome` 的 CSS 为使用 `--acrylic-*` 变量
6. 添加 `.content-area` 和 `.editor-preview-area` 的背景设置

### 步骤9：更新 Preview.svelte 编辑器区背景

预览区和编辑区域在 CodeMirror 中有自己的主题设置。需要在 Editor 组件中根据 `acrylicEnabled` 状态调整编辑器背景色。由于 Editor 已通过 `$mode` 控制暗/亮主题，亚克力模式需要添加额外的透明背景。

### 步骤10：验证

- 运行 `svelte-check` 确保 0 错误
- 运行 `cargo check` 确保 Rust 编译通过
- 启动应用验证开关效果

## 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `test_markdown_features.md` (新建) | 创建 | 全面的MD功能测试文档 |
| `src-tauri/src/commands/window_ops.rs` | 修改 | 添加 `set_acrylic_effect` 命令 |
| `src-tauri/src/lib.rs` | 修改 | 注册新命令 |
| `src/lib/api/window.ts` | 修改 | 添加 `setAcrylicEffect` 函数 |
| `src/lib/stores/ui.ts` | 修改 | 添加 `acrylicEnabled` store |
| `src/app.css` | 修改 | 添加 `.acrylic-on` 全局样式 |
| `src/App.svelte` | 修改 | 引入 store/API、动态 class、组件背景变量 |
| `src/components/SettingsPanel.svelte` | 修改 | 添加亚克力开关 UI |
| `src/components/StatusBar.svelte` | 修改 | 使用 `--acrylic-statusbar-bg` |
| `src/components/TabBar.svelte` | 修改 | 使用 `--acrylic-content-bg` |

## 风险控制

1. **`tauri.conf.json` 中 `transparent: true` 不修改**：自定义窗口装饰（decorations: false）需要此配置
2. **模态对话框**（SettingsPanel、NewFileModal）保持不透明，确保可读性
3. **浅色模式兼容**：`--color-bg-rgb` 在浅色模式下被覆盖为 `243, 243, 243`，亚克力颜色会自动适配
4. **非 Windows 平台**：`set_acrylic_effect` 命令在非 Windows 平台静默返回 Ok，不影响功能

## 测试 MD 文档内容大纲

```
# Markdown 功能测试文档
## 1. 标题层级
## 2. 文本格式化
## 3. 列表
## 4. 数学公式 (KaTeX)
## 5. 代码块
## 6. 表格
## 7. 任务列表
## 8. 引用块
## 9. 链接与图片
## 10. HTML 元素
## 11. 分割线
## 12. Emoji & 特殊字符
```
