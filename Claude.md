# CLAUDE.md

## 项目概述

PureDraft — Tauri 2 桌面 Markdown 编辑器。Rust 后端 + Svelte 5 前端，通过 Tauri IPC 通信。包管理器 pnpm，构建工具 Vite。

视觉与交互基调：Neo-Brutalism 与 Tech-wear 风格，追求极致的 120Hz 丝滑动画体验与物理弹簧反馈。

## 核心设计理念

本项目的 UI/UX 设计遵循三大核心原则：

1. **内容优先 (Content-First)**：移除所有非必要的边框与强烈的视觉干扰，采用极简控件设计，使用户注意力始终聚焦在编辑与预览内容本身。
2. **动态响应 (Fluidity)**：从流式 Markdown 渲染到各组件的状态切换，全程保持平滑过渡动效，杜绝生硬的闪烁、突变或页面重排（Reflow）。动画使用 `svelte/motion` 的 spring 物理曲线和 CSS `transform`。
3. **层次分明 (Hierarchy)**：放弃传统的粗重分割线，转而依靠精细的留白（White space）和微妙的背景色差（Surface Tones）来区分不同的信息区块。

## 常用命令

```bash
# 开发
pnpm tauri dev

# 构建
pnpm tauri build

# 前端类型检查
pnpm check

# 前端 lint + 格式化
pnpm lint
pnpm format

# Rust 检查（在 src-tauri/ 目录下执行）
cargo check
cargo clippy -- -D warnings
cargo fmt --check
cargo test

# 全量检查（CI 等效）
pnpm check && cd src-tauri && cargo clippy -- -D warnings && cargo test
```

> **注意**：修改任何代码后，必须确保对应层级的检查命令通过。

## 项目结构

---

```text
src-tauri/
├── src/
│   ├── main.rs          # 入口：初始化 + plugin + window builder + handler 注册
│   ├── lib.rs           # 模块声明
│   ├── commands/        # Tauri command（薄层，只做转发）
│   ├── services/        # 业务逻辑
│   ├── models/          # 数据结构（Serialize + Deserialize）
│   ├── state/           # AppState（Arc<RwLock<T>>）
│   ├── error.rs         # AppError（thiserror + Serialize）
│   └── utils.rs
├── Cargo.toml
├── tauri.conf.json
└── capabilities/        # Tauri 权限声明（按模块分文件）

src/
├── lib/
│   ├── components/      # 通用 Svelte 组件
│   ├── stores/          # Svelte store
│   ├── api/             # Tauri invoke 封装（唯一允许调用 invoke 的地方）
│   ├── types/           # TypeScript 类型定义
│   └── utils/           # 工具函数
├── routes/              # 页面（SvelteKit 约定式路由，支持多窗口路由）
├── app.css              # 全局 CSS 变量
└── app.html
```

## 架构分层

Svelte 组件 → `$lib/api/*.ts` → Tauri invoke → Rust command → Rust service → Rust model

- **command 层**：接收参数、注入 State、调用 service、返回 Result。不写业务逻辑。
- **service 层**：所有实际业务逻辑。返回 `Result<T, AppError>`。
- **model 层**：纯数据结构，`#[derive(Serialize, Deserialize)]` + `#[serde(rename_all = "camelCase")]`。
- **api 层**：TypeScript 对 Rust command 的一一映射封装，统一使用类似 Rust Result 的错误处理范式。

## 视觉与排版规范

### 色彩系统变量

| CSS 变量                 | 设计作用                                     |
| :----------------------- | :------------------------------------------- |
| `--color-bg`             | 全局底层画布背景色                           |
| `--color-bg-secondary`   | Surface 层 — 消息背景、卡片区块              |
| `--color-ink`            | Text Primary — 主体文本、Markdown 正文、标题 |
| `--color-text-secondary` | Text Secondary — 次要信息、标签、占位符      |
| `--color-accent`         | 交互核心高亮、品牌色、链接、激活状态         |
| `--color-border`         | 微妙的装饰线、输入框边框、代码块边界         |
| `--color-slate`          | 置灰文本 — 时间戳、次级标签                  |
| `--color-muted`          | 最低层级文本 — 禁用态                        |

### 排版约束

- **字体栈**：优先采用系统无衬线字体（Inter, system-ui, -apple-system, "Segoe UI", sans-serif）。代码块必须使用等宽字体（如 "Fira Code", "JetBrains Mono", monospace）。
- **行高 (Line Height)**：正文及 Markdown 区域必须保持在 **1.6 到 1.75** 之间，确保大段文本具有极佳的易读性。
- **黄金视口宽度**：核心内容区域最大宽度应限制在 **800px** 左右。过宽的文本行会导致人眼横向扫视距离过长，产生视觉疲劳。

## Rust 规范

### 命名

| 类型          | 风格                 | 示例            |
| :------------ | :------------------- | :-------------- |
| 文件 / 模块   | snake_case           | `file_ops.rs`   |
| 结构体 / 枚举 | PascalCase           | `FileEntry`     |
| 函数 / 方法   | snake_case           | `list_files`    |
| 常量          | SCREAMING_SNAKE      | `MAX_PATH_LEN`  |
| Tauri command | snake_case, 动词开头 | `get_file_list` |

### Tauri Command

```rust
#[tauri::command]
async fn get_file_list(
    state: tauri::State<'_, AppState>,
    path: String,
) -> Result<Vec<FileEntry>, AppError> {
    let svc = FileService::new(&state);
    svc.list_files(&path).await
}
```

- 返回类型固定 `Result<T, AppError>`
- State 注入标注生命周期 `State<'_, AppState>`
- 注册时按模块分组：

```rust
.invoke_handler(tauri::generate_handler![
    // file
    commands::file_ops::get_file_list,
    commands::file_ops::create_directory,
    // settings
    commands::settings::get_settings,
    commands::settings::update_settings,
])
```

### 错误处理

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("序列化错误: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("{message}")]
    Business { code: u32, message: String },
}

impl serde::Serialize for AppError { /* 产出 { code, message } */ }
```

- 前端收到的错误结构固定 `{ code: number, message: string }`
- 禁止 `.unwrap()` / `.expect()` 出现在 command 和 service 层
- 使用 `?` 传播，最终统一为 `AppError`

### 数据模型

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified_at: String,
}
```

- 跨 IPC 的结构体必须 `#[serde(rename_all = "camelCase")]`
- 有默认值的字段加 `#[serde(default)]`
- 枚举用 `#[serde(rename_all = "lowercase")]`

### 状态管理与同步

```rust
pub struct AppState {
    pub config: Arc<RwLock<AppConfig>>,
    pub db: Arc<Database>,
}
```

- 读多写少用 `RwLock`，写频繁用 `Mutex`。通过 `.manage(state)` 注册。
- **状态主动下发**：当后端数据（如文件监控、后台下载）发生变更时，严禁让前端轮询。必须在 Rust Service 层使用 `app_handle.emit("event-name", payload)` 广播事件，由前端 Store 负责监听更新。

### 日志

使用 `tracing` + `tracing-subscriber`。禁止 `println!` / `eprintln!`。

### Cargo 依赖

最小化依赖，不加不需要的 feature。Release profile：

```toml
[profile.release]
strip = true
lto = true
codegen-units = 1
opt-level = "s"
panic = "abort"
```

## Svelte / TypeScript 规范

### 命名

| 类型        | 风格              | 示例              |
| :---------- | :---------------- | :---------------- |
| 组件文件    | PascalCase.svelte | `FileList.svelte` |
| TS 文件     | camelCase.ts      | `fileStore.ts`    |
| 接口        | PascalCase        | `FileEntry`       |
| 变量 / 函数 | camelCase         | `getFileList`     |
| 常量        | SCREAMING_SNAKE   | `DEFAULT_THEME`   |
| CSS 类名    | kebab-case        | `file-list__item` |
| CSS 变量    | kebab-case        | `--color-primary` |

### Svelte 5 Runes（强制使用）

```svelte
<script lang="ts">
  // 组件间通信：使用回调 Prop 替代事件派发
  let { path = '/', onFileSelect }: { path?: string, onFileSelect?: (file: FileEntry) => void } = $props();
  let files = $state<FileEntry[]>([]);
  let loading = $state(false);
  let sorted = $derived([...files].sort((a, b) => a.name.localeCompare(b.name)));
  $effect(() => { loadFiles(path); });
</script>
```

- 禁止 `export let`、`$:`、`createEventDispatcher`（Svelte 4 遗留语法）。
- 组件间通信**强制使用回调函数（Callback Props）**。
- `{#each}` 必须带 key：`{#each items as item (item.id)}`。
- 条件渲染顺序：loading → error → empty → content。

### IPC 封装（Result 模式）

为了避免在前端组件中充斥 `try...catch`，API 调用采用元组返回模式 `[Error, Data]`。

```typescript
// $lib/api/index.ts
import { invoke } from "@tauri-apps/api/core";

export class AppError extends Error {
  constructor(public readonly code: number, message: string) {
    super(message);
  }
}

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

```typescript
// $lib/api/file.ts
import { cmd } from "$lib/api";
import type { FileEntry } from "$lib/types";

// 使用示例： const [err, files] = await getFileList("/usr");
export const getFileList = (path: string) =>
  cmd<FileEntry[]>("get_file_list", { path });
```

- 禁止在 `.svelte` 中直接 `import { invoke }`。
- 所有调用走 `$lib/api/*.ts`，按 Rust commands 模块一一对应封装。

### Store 与全局状态

```typescript
function createSettingsStore() {
  const { subscribe, set, update } = writable<AppSettings | null>(null);
  return {
    subscribe,
    async load() {
      const [err, data] = await getSettings();
      if (!err && data) set(data);
    },
  };
}
export const settings = createSettingsStore();
```

- 工厂函数 `createXxxStore()` 模式。
- 隐藏原始 `set`/`update`，通过语义化方法暴露操作。
- 全局 Tauri Event 监听必须在此处（Store 初始化或相关 service 文件）进行注册。

### 类型与样式

- 与 Rust model 对应的接口字段名必须一致（camelCase），统一从 `$lib/types/index.ts` 导出。
- 颜色 / 间距 / 圆角全部使用 `app.css` 中的 CSS 变量，禁止硬编码。
- 组件样式 scoped，全局样式只放 `app.css`。
- BEM-like 命名：`block__element--modifier`。

## 多窗口设计与 UI/UX 细节约束

- **控制层分离**：诸如"关闭按钮"等操作性交互，必须放置在独立的浮动窗口 (Floating Window) 中，**严禁**将其整合进 Dynamic Island 面板。
- **高保真动画优先**：重构或优化代码时，120Hz 动画的流畅度优先级高于代码精简。禁止提交会让动画变得跳跃、卡顿的布局或逻辑变更。优先使用 `svelte/motion` 的弹簧 (spring) 物理曲线和 CSS transform。
- **避免滚动动画叠加**：在动态内容高频更新期间，滚动方法**绝对禁止**使用 CSS `behavior: 'smooth'`。因为平滑滚动约 200ms 动画周期在高频触发时会导致浏览器将数百个动画堆叠，CPU 阻塞、画面掉帧。应使用 `behavior: 'auto'` 瞬间跳转，在 120Hz 高刷屏上自然形成丝滑的"推挤"效果。
- **新元素进入动效**：当新节点被推入 DOM 时，必须使用 CSS `transform: translateY` 实现进入动画。`transform` 不改变布局占位（Layout），可以在 DOM 生成瞬间精准计算高度，视觉层在 GPU 加速下平滑上浮。
- **圆角规范**：UI 组件统一使用标准的圆角 (Standard Rounded Corner)，**严禁**在任何未明确说明的地方使用内凹（倒角/Inverted）圆角。
- **音频频谱可视化**：实现音频频谱组件时，必须保持 6 根柱子，上下对称，且严格放置在歌曲信息的右侧。
- **删除操作需确认**：所有不可逆的删除操作（文件移除、存档槽删除、自定义字体移除等）必须弹出确认提示，防止用户误操作。

## 全局事件机制 (Rust 到 UI)

- 事件名 kebab-case：`file-changed`、`settings-updated`。
- 监听必须在 `onDestroy` 中调用 `unlisten()` 取消（如果是在组件生命周期内注册）。

| Rust command (snake_case) | TS 函数 (camelCase) | Rust Emit 事件 (kebab-case) |
| :------------------------ | :------------------ | :-------------------------- |
| `get_file_list`           | `getFileList()`     | `file-system-changed`       |
| `update_settings`         | `updateSettings()`  | `settings-updated`          |

## 高性能渲染最佳实践

### Markdown 解析与增量高亮

- **局部增量解析**：仅对当前处于编辑/生成状态的最后一条内容进行动态解析，已完成的内容应缓存 HTML 结果，锁定 DOM，后续不再重复处理。
- **轻量级工具链选用**：使用 `marked` 作为极速解析器，配合 `highlight.js` 按需引入常用语言包进行代码高亮。严禁引入体积庞大的 Shiki 等高级预渲染器。
- **异步线程计算**：对于长文本或大量代码块的内容，将 Markdown 解析器放入 Web Worker 执行。主线程仅负责通过 `postMessage` 传递文本片段，Worker 在后台计算出干净的 HTML 后抛回主线程，确保主 UI 渲染线程绝对纯净。

### 滚动性能

- 滚动同步使用 `requestAnimationFrame` 接管节奏，配合 `throttleMs: 0` 完全交由浏览器原生重绘周期驱动，频率可达到 120Hz。
- 移除所有 `Math.round` 取整，保留亚像素精度使滚动更丝滑。
- 使用基于时间的"源锁定"（Active Source Locking）机制防止双向滚动中的乒乓效应。

## 安全

- **Capabilities 模块化**：`src-tauri/capabilities/` 下的文件必须按功能拆分（如 `file-system.json`, `window-control.json`），禁止堆砌单一文件。
- 文件系统访问必须配置严格的 scope 限制，禁止全局开放。
- 用户输入路径必须做遍历检查（拒绝 `..` 注入）。
- 敏感数据仅在 Rust 端处理，不在前端持久化。
- 修改 capabilities 必须在 commit message 中说明原因。

## Git 规范

### 提交格式

`<type>(<scope>): <简短描述>`

| type     | 含义        | scope  | 含义        |
| :------- | :---------- | :----- | :---------- |
| feat     | 新功能      | rust   | Rust 后端   |
| fix      | 修复        | ui     | Svelte 前端 |
| refactor | 重构        | ipc    | IPC 接口    |
| style    | 样式 / 格式 | build  | 构建配置    |
| docs     | 文档        | deps   | 依赖        |
| test     | 测试        | <br /> | <br />      |
| chore    | 构建 / 依赖 | <br /> | <br />      |
| perf     | 性能        | <br /> | <br />      |

_示例：`feat(rust): 添加文件监听 service`_

### 分支管理

```text
main ← 发布
└── develop ← 集成
    ├── feat/xxx
    ├── fix/xxx
    └── refactor/xxx
```

## 测试与 Lint 配置

- **测试**：Rust 使用 `#[cfg(test)] mod tests {}`，文件系统测试用 `tempfile`；Svelte 使用 Vitest + Testing Library。命名约定：`test_<函数>_<场景>_<预期>`。核心 service 层覆盖率目标 > 80%。
- **Rust Lint**：

```toml
# rustfmt.toml
edition = "2021"
max_width = 100
tab_spaces = 4

# Cargo.toml
[lints.clippy]
unwrap_used = "warn"
expect_used = "warn"
panic = "deny"
```

- **TS/Svelte Lint**：

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

## AI 开发约束

### 必须做

1. 修改 Rust 后确保 `cargo check` + `cargo clippy` 通过。
2. 修改 Svelte 后确保 `pnpm check` 通过。
3. 新增 Tauri command 时同步完成四步：
   - `commands/` 添加 command 函数
   - `main.rs` 注册到 `generate_handler!`
   - `$lib/api/` 添加封装函数
   - `$lib/types/` 更新类型
4. 修改数据模型时 Rust 和 TypeScript 同步修改，字段名保持一致。
5. 保持最小改动，只改与任务相关的代码。
6. 前后端联调时，优先使用 Result 元组模式 `[err, data]` 处理 IPC 响应。

### 禁止做

1. 在 `.svelte` 中直接 `import { invoke }`。
2. 在 command / service 层使用 `.unwrap()` / `.expect()`。
3. 使用 Svelte 4 语法（`export let`、`$:`、`createEventDispatcher`）。
4. 硬编码颜色 / 间距 / 圆角。
5. 擅自使用内凹/倒角圆角。
6. 将控制类按钮（如关闭）塞入 Dynamic Island 中。
7. 为了精简代码而牺牲 UI 动画渲染性能（导致卡顿/掉帧）。
8. 未说明理由就修改 `tauri.conf.json` 权限或 `Cargo.toml` 依赖。
9. 做超出任务范围的架构变更。
10. 使用 `println!` 代替 `tracing`。

### 不确定时

- 先提出方案和取舍理由，确认后再实现。
- IPC 接口变更时同时列出 Rust 和 TypeScript 两侧改动。
- 权限变更时说明安全影响。
