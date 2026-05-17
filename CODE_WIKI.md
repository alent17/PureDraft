# PureDraft Code Wiki

## 项目概述

**PureDraft** 是一个基于 Tauri + Svelte 构建的现代桌面应用程序，专注于 Markdown 编辑和多种编程语言代码编辑功能。它提供了丰富的特性如实时预览、滚动同步、主题切换、Acrylic 特效、自动保存等。

## 技术栈

### 前端
- **框架**: Svelte 5
- **构建工具**: Vite 6
- **编辑器**: CodeMirror 6
- **Markdown 解析**: Marked + Highlight.js
- **类型安全**: TypeScript 5
- **测试**: Vitest

### 后端
- **框架**: Tauri 2
- **语言**: Rust
- **依赖管理**: Cargo

## 目录结构

```
PureDraft/
├── src/                          # 前端源代码
│   ├── components/               # Svelte 组件
│   │   ├── Editor.svelte         # 代码编辑器组件
│   │   ├── Preview.svelte        # Markdown 预览组件
│   │   ├── FileTree.svelte       # 文件树侧边栏
│   │   ├── TitleBar.svelte       # 自定义标题栏
│   │   ├── Toolbar.svelte        # 工具栏
│   │   ├── TabBar.svelte         # 文件标签栏
│   │   ├── StatusBar.svelte      # 状态栏
│   │   ├── SettingsPanel.svelte  # 设置面板
│   │   └── ...                   # 其他组件
│   ├── lib/                      # 工具库
│   │   ├── api/                  # Tauri API 调用封装
│   │   ├── stores/               # Svelte 状态管理
│   │   ├── utils/                # 工具函数
│   │   ├── components/           # 内部组件
│   │   └── types.ts              # 类型定义
│   ├── App.svelte                # 主应用组件
│   ├── main.ts                   # 入口文件
│   └── app.css                   # 全局样式
├── src-tauri/                    # Tauri 后端源代码
│   ├── src/
│   │   ├── commands/             # Tauri 命令
│   │   │   ├── file_ops.rs       # 文件操作命令
│   │   │   ├── window_ops.rs     # 窗口操作命令
│   │   │   └── mod.rs
│   │   ├── services/             # 业务逻辑服务
│   │   │   ├── file.rs           # 文件服务
│   │   │   └── mod.rs
│   │   ├── models/               # 数据模型
│   │   ├── utils/                # 工具函数
│   │   ├── error.rs              # 错误处理
│   │   ├── lib.rs                # 库入口
│   │   └── main.rs               # 主程序入口
│   ├── Cargo.toml                # Rust 依赖配置
│   └── tauri.conf.json           # Tauri 配置
├── package.json                  # Node.js 依赖配置
├── vite.config.ts                # Vite 配置
└── tsconfig.json                 # TypeScript 配置
```

## 核心架构

### 整体架构

PureDraft 采用典型的 Tauri 应用架构，分为前端和后端两部分：

1. **前端**: 使用 Svelte 构建用户界面，负责交互和渲染
2. **后端**: 使用 Rust 实现，通过 Tauri 提供系统级功能（文件操作、窗口管理等）
3. **通信**: 通过 Tauri 的 IPC 机制实现前后端通信

### 前端架构

```
App.svelte (主组件)
├── 状态管理
│   ├── file store (文件状态)
│   └── ui store (UI 状态)
├── UI 组件
│   ├── TitleBar (标题栏)
│   ├── Toolbar (工具栏)
│   ├── FileTree (文件树)
│   ├── TabBar (标签栏)
│   ├── Editor/Preview (编辑器/预览)
│   └── StatusBar (状态栏)
└── 工具层
    ├── API 封装
    ├── Markdown 处理
    ├── 滚动同步
    └── 持久化
```

### 后端架构

```
Tauri App
├── Commands (命令层)
│   ├── file_ops.rs (文件操作)
│   └── window_ops.rs (窗口操作)
├── Services (服务层)
│   └── FileService (文件服务)
├── Models (数据模型)
└── Utils (工具函数)
```

## 核心模块详解

### 1. 文件状态管理 (file store)

**文件路径**: [`src/lib/stores/file.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/stores/file.ts)

**主要功能**:
- 管理所有打开的文件列表
- 跟踪当前活动文件
- 维护文件内容、修改状态、光标位置等
- 提供文件添加、关闭、切换等操作

**核心 API**:
- `addFile(file)`: 添加新文件
- `closeFile(index)`: 关闭指定文件
- `updateFileContent(index, content)`: 更新文件内容
- `markFileSaved(index)`: 标记文件为已保存
- `switchToFile(index)`: 切换到指定文件

### 2. UI 状态管理 (ui store)

**文件路径**: [`src/lib/stores/ui.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/stores/ui.ts)

**主要功能**:
- 管理编辑器/预览/分屏模式
- 管理深色/浅色主题
- 管理侧边栏、工具栏显示状态
- 管理滚动同步、Acrylic 特效等设置
- 管理自动保存间隔、字体大小等

**核心状态**:
- `activeTab`: 当前活动标签 ("edit" | "preview" | "split")
- `mode`: 主题模式 ("dark" | "light")
- `sidebarOpen`: 侧边栏是否打开
- `acrylicEnabled`: Acrylic 特效是否启用
- `focusMode`: 专注模式是否启用

### 3. Markdown 处理

**文件路径**: [`src/lib/utils/markdown.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/markdown.ts)

**主要功能**:
- Markdown 解析和 HTML 渲染
- 代码语法高亮（使用 Highlight.js）
- LaTeX 公式支持
- Mermaid 图表支持
- 深色/浅色主题切换

**核心函数**:
- `createMarkedInstance(mode)`: 创建 Markdown 解析器实例
- `processLatex(html)`: 处理 LaTeX 公式
- `processMermaid(html)`: 处理 Mermaid 图表

### 4. 滚动同步

**文件路径**: [`src/lib/utils/scrollSync.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/scrollSync.ts)

**主要功能**:
- 实现编辑器和预览区域的滚动位置同步
- 支持节流以提升性能
- 处理编程式滚动和用户滚动的区分

### 5. 后端文件服务

**文件路径**: [`src-tauri/src/services/file.rs`](file:///e:/Desktop/Projects/PureDraft/src-tauri/src/services/file.rs)

**主要功能**:
- 文件读取和写入
- 文件对话框打开/保存
- 文件夹浏览和文件树构建
- 文件类型识别

**核心方法**:
- `read_file(path)`: 读取文件内容
- `save_file(path, content)`: 保存文件
- `open_file_dialog(app)`: 打开文件选择对话框
- `save_file_as(app, content, default_name)`: 另存为对话框
- `open_folder(folder_path)`: 打开文件夹并构建文件树

### 6. 后端命令层

**文件路径**: [`src-tauri/src/commands/file_ops.rs`](file:///e:/Desktop/Projects/PureDraft/src-tauri/src/commands/file_ops.rs)

**主要功能**:
- 暴露文件操作命令给前端调用
- 使用 `#[tauri::command]` 宏标记可调用函数
- 处理错误并返回结果

## 关键类与函数

### 前端核心类

#### ScrollSyncEngine

**文件**: [`src/lib/utils/scrollSync.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/scrollSync.ts)

**功能**: 管理编辑器、预览和悬浮预览之间的滚动同步

**主要方法**:
- `onEditorScroll(state)`: 处理编辑器滚动事件
- `onPreviewScroll(state)`: 处理预览滚动事件
- `onHoverScroll(state)`: 处理悬浮预览滚动事件
- `applyRatioToTarget(ratio, state)`: 根据滚动比例计算目标位置

### 后端核心类

#### FileService

**文件**: [`src-tauri/src/services/file.rs`](file:///e:/Desktop/Projects/PureDraft/src-tauri/src/services/file.rs)

**功能**: 提供所有文件相关的业务逻辑

**主要方法**:
- `read_file(&self, path: &str)`: 读取文件内容并识别文件类型
- `save_file(&self, path: &str, content: &str)`: 保存文件到磁盘
- `open_file_dialog(&self, app: &AppHandle)`: 显示文件选择对话框
- `build_file_tree(&self, path: &Path)`: 递归构建目录树结构

## 依赖关系

### 前端主要依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| @tauri-apps/api | ^2 | Tauri 前端 API |
| @tauri-apps/plugin-dialog | ^2 | 对话框插件 |
| codemirror | ^6 | 代码编辑器 |
| marked | ^12 | Markdown 解析 |
| highlight.js | ^11 | 代码语法高亮 |
| dompurify | ^3 | HTML 清理 |
| katex | ^0.16.46 | LaTeX 公式渲染 |
| mermaid | ^11.15.0 | 图表生成 |
| prettier | ^3.8.2 | 代码格式化 |

### 后端主要依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| tauri | ^2 | Tauri 框架 |
| tauri-plugin-dialog | 2 | 对话框插件 |
| serde | ^1 | 序列化/反序列化 |
| serde_json | 1 | JSON 处理 |
| tracing | 0.1 | 日志记录 |
| chrono | 0.4 | 时间处理 |
| thiserror | 1 | 错误处理宏 |

## 项目运行方式

### 开发环境

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run tauri:dev
   ```
   这将同时启动 Vite 开发服务器和 Tauri 应用窗口。

3. **仅启动前端开发服务器**
   ```bash
   npm run dev
   ```

### 生产构建

1. **构建应用**
   ```bash
   npm run tauri:build
   ```
   这将构建前端资源并打包成可执行文件。

2. **仅构建前端**
   ```bash
   npm run build
   ```

### 其他命令

| 命令 | 功能 |
|------|------|
| `npm run check` | 运行 Svelte 类型检查 |
| `npm run lint` | 运行 Prettier 代码格式检查 |
| `npm run format` | 运行 Prettier 格式化代码 |

## 主要特性

### 1. 多语言编辑支持
- 支持 Markdown、JavaScript、TypeScript、Python、Rust、Go、Java、C/C++、HTML、CSS、JSON、YAML 等多种语言
- 基于 CodeMirror 6 的语法高亮

### 2. Markdown 实时预览
- 分屏编辑/预览模式
- 滚动位置同步
- 代码语法高亮
- LaTeX 公式支持
- Mermaid 图表支持

### 3. 用户界面特性
- 自定义标题栏（无边框窗口）
- 深色/浅色主题切换
- Acrylic 毛玻璃特效（Windows）
- 专注模式
- 悬浮预览
- 可拖拽调整的分屏比例

### 4. 文件管理
- 多文件标签页
- 最近文件记录
- 保存槽功能
- 自动保存
- 拖拽文件打开

### 5. 编辑功能
- 搜索和替换
- 代码格式化（使用 Prettier）
- Markdown 工具栏
- 任务列表切换
- 图片粘贴

## 数据流

### 打开文件流程
1. 用户点击"打开文件"或使用快捷键 `Ctrl+O`
2. 前端调用 `openFileDialog()` 函数
3. 触发 Tauri 命令 `open_file_dialog`
4. 后端显示文件选择对话框
5. 用户选择文件后，后端读取文件内容
6. 文件信息返回前端，添加到 `openFiles` store
7. 更新 `currentFileIndex`，显示文件内容

### 保存文件流程
1. 用户点击"保存"或使用快捷键 `Ctrl+S`
2. 前端检查文件是否有路径
3. 如果需要，格式化文件内容
4. 调用 Tauri 命令 `save_file` 或 `save_file_as`
5. 后端将内容写入磁盘
6. 前端标记文件为已保存

### 滚动同步流程
1. 编辑器或预览区域发生滚动
2. 触发相应的滚动事件处理函数
3. `ScrollSyncEngine` 计算滚动比例
4. 同步应用滚动到其他区域
5. 使用节流控制更新频率

## 配置说明

### Tauri 配置 (tauri.conf.json)

**主要配置项**:
- `productName`: 应用名称
- `identifier`: 应用标识符
- `windows`: 窗口配置（大小、标题、无边框等）
- `security`: 安全配置（CSP、资产协议等）
- `build`: 构建配置（前端资源路径、开发服务器等）

### 前端持久化配置

部分 UI 状态通过 `localStorage` 持久化：
- 侧边栏打开状态
- Acrylic 特效启用状态

## 开发指南

### 添加新的文件类型支持

1. 在 [`src/lib/types.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/types.ts) 中的 `FileType` 类型添加新类型
2. 在 [`src/lib/utils/fileTypes.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/fileTypes.ts) 中添加类型识别逻辑
3. 如需要语法高亮，在 [`src/components/Editor.svelte`](file:///e:/Desktop/Projects/PureDraft/src/components/Editor.svelte) 中添加 CodeMirror 语言扩展
4. 在 [`src/lib/utils/markdown.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/markdown.ts) 中注册 Highlight.js 语言

### 添加新的 Tauri 命令

1. 在 [`src-tauri/src/commands/`](file:///e:/Desktop/Projects/PureDraft/src-tauri/src/commands/) 目录下创建或修改命令文件
2. 使用 `#[tauri::command]` 宏标记函数
3. 在 [`src-tauri/src/lib.rs`](file:///e:/Desktop/Projects/PureDraft/src-tauri/src/lib.rs) 的 `invoke_handler` 中注册命令
4. 在 [`src/lib/api/`](file:///e:/Desktop/Projects/PureDraft/src/lib/api/) 目录下创建前端 API 封装
5. 在前端组件中调用 API

## 测试

项目使用 Vitest 进行测试，测试文件以 `.test.ts` 结尾。

**运行测试**:
```bash
npm test
```

当前已有测试:
- [`src/lib/utils/scrollSync.test.ts`](file:///e:/Desktop/Projects/PureDraft/src/lib/utils/scrollSync.test.ts): 滚动同步功能测试

## 注意事项

1. **跨平台兼容性**: 项目主要针对 Windows 平台优化（特别是 Acrylic 特效），但 Tauri 支持跨平台构建
2. **文件编码**: 默认使用 UTF-8 编码处理文件
3. **大文件**: 对于非常大的文件，可能需要考虑性能优化
4. **自动保存**: 自动保存会在指定间隔触发，会先格式化可格式化的文件

## 相关文档

- [Tauri 官方文档](https://tauri.app/)
- [Svelte 官方文档](https://svelte.dev/)
- [CodeMirror 6 文档](https://codemirror.net/)
- [Marked 文档](https://marked.js.org/)
