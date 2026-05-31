# PureDraft

> 一款极简、丝滑的桌面 Markdown 编辑器，基于 Tauri 2 构建。

PureDraft 追求 **内容优先** 的编辑体验，以 Neo-Brutalism 与 Tech-wear 设计美学为视觉基调，配合 120Hz 丝滑动画与物理弹簧反馈，让写作本身成为一种享受。

---

## 功能特性

### 编辑与预览
- **实时 Markdown 预览** — 所见即所得的分屏编辑模式
- **多视图模式** — 纯编辑、纯预览、分屏三种模式自由切换
- **代码高亮** — 支持 20+ 编程语言的语法高亮
- **数学公式** — 基于 KaTeX 的 LaTeX 公式渲染
- **Mermaid 图表** — 内置 Mermaid 图表渲染支持
- **HTML 导出 / 打印** — 一键导出为 HTML 或调用系统打印

### 文件管理
- **内置文件树** — 侧边栏文件浏览器，支持文件/文件夹的创建、重命名、删除
- **多标签页** — 同时打开多个文件，支持标签拖拽与关闭确认
- **自动保存** — 实时保存编辑内容
- **存档管理** — 文件版本快照，支持多槽位存档与恢复
- **文件关联** — 支持将 PureDraft 设为 `.md` 文件的系统默认打开程序

### 个性化
- **深色 / 浅色主题** — 一键切换明暗主题
- **多主题色** — 6 种 Accent 色彩方案（蓝、紫、绿、橙、红、粉）
- **自定义字体** — 支持加载本地字体文件
- **编辑器缩略图** — Minimap 代码概览

### 工具栏
- **Markdown 快捷工具栏** — 一键插入标题、粗体、斜体、链接、代码块、表格等
- **多光标编辑** — 全选相同文本，批量编辑
- **全局搜索替换** — CodeMirror 6 内置搜索功能
- **字符统计** — 状态栏实时显示字符数、行数、字数

---

## 安装

### Windows

从 [GitHub Releases](../../releases) 下载最新的 `PureDraft_x.x.x_x64-setup.exe` 安装程序，双击运行即可。

安装完成后，`.md` 文件将自动关联 PureDraft 图标。你也可以在「设置 → 文件关联」中手动设为默认打开程序。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | [Tauri 2](https://v2.tauri.app/) |
| 后端语言 | Rust |
| 前端框架 | [Svelte 5](https://svelte.dev/) (Runes) |
| 编辑器 | [CodeMirror 6](https://codemirror.net/) |
| 构建工具 | [Vite](https://vitejs.dev/) |
| 包管理器 | pnpm |
| Markdown 解析 | [marked](https://marked.js.org/) |
| 代码高亮 | [highlight.js](https://highlightjs.org/) |
| 数学公式 | [KaTeX](https://katex.org/) |
| 图表 | [Mermaid](https://mermaid.js.org/) |

---

## 开发指南

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- [Rust](https://www.rust-lang.org/) >= 1.70
- [Tauri 2 环境依赖](https://v2.tauri.app/start/prerequisites/)

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/<your-username>/PureDraft.git
cd PureDraft

# 安装依赖
pnpm install

# 启动开发模式
pnpm tauri dev

# 构建生产版本
pnpm tauri build
```

### 代码检查

```bash
# 前端类型检查
pnpm check

# 前端格式检查
pnpm lint

# Rust 检查（在 src-tauri/ 目录下）
cargo check
cargo clippy -- -D warnings
```

---

## 项目结构

```
PureDraft/
├── src/                          # Svelte 前端
│   ├── components/               # 核心页面组件
│   │   ├── App.svelte            # 主应用入口
│   │   ├── Editor.svelte         # CodeMirror 编辑器
│   │   ├── Preview.svelte        # Markdown 预览
│   │   ├── FileTree.svelte       # 文件树
│   │   ├── TabBar.svelte         # 标签栏
│   │   ├── Toolbar.svelte        # 顶部工具栏
│   │   ├── StatusBar.svelte      # 状态栏
│   │   ├── TitleBar.svelte       # 自定义标题栏
│   │   ├── SettingsPanel.svelte  # 设置面板
│   │   └── Minimap.svelte        # 缩略图
│   └── lib/                      # 共享库
│       ├── api/                  # Tauri IPC 封装
│       ├── stores/               # Svelte Store
│       ├── components/           # 通用组件
│       ├── utils/                # 工具函数
│       └── types.ts              # 类型定义
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── commands/             # Tauri Commands
│   │   ├── services/             # 业务逻辑
│   │   ├── models/               # 数据模型
│   │   └── error.rs              # 错误定义
│   ├── capabilities/             # Tauri 权限声明
│   └── tauri.conf.json           # Tauri 配置
└── package.json
```

---

## 许可证

MIT License

---

<p align="center">
  <em>PureDraft — 纯粹的 Markdown 写作体验</em>
</p>
