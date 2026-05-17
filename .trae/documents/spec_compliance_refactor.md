# Claude.md 规范修复与重构计划

## 概述

根据最新的 Claude.md 规范，修复 Rust 编译错误，并将前端 API 层改为 `[Error, Data]` 元组模式，同时模块化 Capabilities。

---

## Step 1: 修复 Rust 编译错误

### 1.1 移除未使用的 `tracing::error` 导入
- **文件**: `src-tauri/src/services/file.rs:9`
- **操作**: 将 `use tracing::{info, error, warn};` 改为 `use tracing::{info, warn};`
- **原因**: `error` 未被使用，只有 `info!` 和 `warn!` 被调用

### 1.2 修复 `UrlNotSupported` 类型不匹配
- **文件**: `src-tauri/src/services/file.rs:64`
- **操作**: `AppError::UrlNotSupported(u)` → `AppError::UrlNotSupported(u.to_string())`
- **原因**: `UrlNotSupported(String)` 接收 `String`，但 `u` 是 `Url` 类型

### 1.3 添加 `From<tauri::Error>` 实现
- **文件**: `src-tauri/src/error.rs`
- **操作**: 在 `From<mpsc::RecvError>` 实现之后添加：
  ```rust
  impl From<tauri::Error> for AppError {
      fn from(e: tauri::Error) -> Self {
          AppError::Business { code: 100, message: e.to_string() }
      }
  }
  ```
- **原因**: `window_ops.rs` 中的 `window.minimize()?`、`window.is_maximized()?` 等返回 `tauri::Error`，需要 `From<tauri::Error>` 以便 `?` 自动转换

---

## Step 2: API 层改为 Result 元组模式

Claude.md 规范要求所有 IPC 调用返回 `[AppError | null, T | null]` 元组，避免组件中充斥 try/catch。

### 2.1 修改 `src/lib/api/index.ts`
- **操作**: 将 `cmd<T>` 的返回类型从 `Promise<T>` 改为 `Promise<[AppError | null, T | null]>`
  ```typescript
  export async function cmd<T>(
    command: string,
    args?: Record<string, unknown>,
  ): Promise<[AppError | null, T | null]> {
    try {
      const data = await invoke<T>(command, args);
      return [null, data];
    } catch (err) {
      const e = err as { code: number; message: string };
      return [new AppError(e.code, e.message), null];
    }
  }
  ```

### 2.2 修改 `src/lib/api/file.ts`
- **操作**: 所有函数返回类型改为 `Promise<[AppError | null, T | null]>`
- **涉及函数**: `readFile`, `saveFile`, `saveFileAs`, `openFileDialog`, `openFolder`, `readFileContent`, `writeFile`

### 2.3 修改 `src/lib/api/window.ts`
- **操作**: 所有函数返回类型改为 `Promise<[AppError | null, T | null]>`
- **涉及函数**: `minimizeWindow`, `toggleMaximize`, `closeWindow`, `isMaximized`

### 2.4 修改 `src/lib/api/folder.ts`
- **操作**: 适配新的 `[Error, Data]` 返回模式
- **涉及函数**: `openFolderTree`, `readFileNode`, `writeFileSync`
  - 不再需要内部的 try/catch（API 层已统一处理）
  - 使用解构：`const [err, result] = await openFolder(folderPath);`

### 2.5 修改 `src/lib/utils/tauri.ts`
- **操作**: 
  - `openFileDialog()`: 适配 `fileApi.readFile` 的新返回类型，使用 `const [err, content] = await readFile(...)`
  - 导出的 `readFile`, `saveFile`, `saveFileAs`, `minimizeWindow` 等保持不变（仅重新导出）

### 2.6 修改 `src/App.svelte`
- **操作**: 
  - `handleSave()`: `await saveFile(...)` → `const [err] = await saveFile(...)`
  - `handleSaveAs()`: `await saveFileAs(...)` → `const [err, newPath] = await saveFileAs(...)`
  - `handleOpenFolder()`: 适配 `openFolderTree` 的返回（内部已处理）
  - `handleSelectFile()`: 适配 `readFileNode` 返回（内部已处理）

### 2.7 修改 `src/components/TitleBar.svelte`
- **操作**: `await toggleMaximize()` → `const [err, max] = await toggleMaximize()`
- `minimizeWindow()` 和 `closeWindow()` 可忽略错误

---

## Step 3: Capabilities 模块化

Claude.md 要求将 `src-tauri/capabilities/` 按功能拆分为独立文件。

### 3.1 创建 `src-tauri/capabilities/window-control.json`
```json
{
  "identifier": "window-control-capability",
  "description": "Window control operations",
  "windows": ["main"],
  "permissions": [
    "core:window:default",
    "core:window:allow-start-dragging",
    "core:window:allow-minimize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-close",
    "core:window:allow-is-maximized",
    "core:window:allow-set-title"
  ]
}
```

### 3.2 创建 `src-tauri/capabilities/file-system.json`
```json
{
  "identifier": "file-system-capability",
  "description": "File system access",
  "windows": ["main"],
  "permissions": [
    "core:path:default",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

### 3.3 创建 `src-tauri/capabilities/events.json`
```json
{
  "identifier": "events-capability",
  "description": "Event system",
  "windows": ["main"],
  "permissions": [
    "core:event:default",
    "core:app:default"
  ]
}
```

### 3.4 删除 `src-tauri/capabilities/default.json`
- 旧的单一权限文件不再需要

---

## Step 4: 验证

### 4.1 Rust 验证
```bash
cd src-tauri && cargo check && cargo clippy -- -D warnings && cargo fmt --check
```

### 4.2 前端验证
```bash
pnpm check
```

### 4.3 功能验证
- 启动 `pnpm tauri dev`，验证：
  - 窗口控制（最小化、最大化、关闭）
  - 文件操作（打开、保存、另存为）
  - 文件夹打开
  - 主题切换
  - 编辑器与预览

---

## 受影响文件汇总

| 层级 | 文件 | 操作 |
|:-----|:-----|:-----|
| Rust | `src-tauri/src/error.rs` | 添加 `From<tauri::Error>` |
| Rust | `src-tauri/src/services/file.rs` | 删除 unused import + 修复类型 |
| Rust | `src-tauri/capabilities/` | 模块化拆分 |
| TS API | `src/lib/api/index.ts` | 改为 `[Error, Data]` 元组 |
| TS API | `src/lib/api/file.ts` | 更新返回类型 |
| TS API | `src/lib/api/window.ts` | 更新返回类型 |
| TS API | `src/lib/api/folder.ts` | 适配新模式 |
| TS Util | `src/lib/utils/tauri.ts` | 适配新模式 |
| Svelte | `src/App.svelte` | 适配新模式 |
| Svelte | `src/components/TitleBar.svelte` | 适配新模式 |
