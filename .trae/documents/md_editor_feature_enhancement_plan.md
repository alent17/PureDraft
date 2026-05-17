# PureDraft Markdown 编辑器功能完善计划

## 概述

本文档基于对市面上主流 Markdown 编辑器（Typora、Obsidian、VS Code、Mark Text、iA Writer、Zettlr、Notion 等）的功能分析，针对 PureDraft 当前 `v0.1.0` 版本的现状，制定分阶段功能完善计划。

---

## 对比分析：当前已有 vs 市场主流

| 功能分类 | 已有功能 | 缺失功能 |
|---------|---------|---------|
| **编辑核心** | CodeMirror 6 多语言编辑、行号、自动换行、撤销/重做、括号匹配、代码折叠 | Markdown 智能补全、snippets 模板、专注模式、打字机模式 |
| **预览** | Marked 实时渲染、代码高亮、DOMPurify XSS 防护、深浅主题 | 滚动同步、Mermaid 图表、KaTeX 数学公式、可交互任务列表、图片本地化管理 |
| **导航** | 扁平文件列表侧边栏 | 大纲/目录导航、文档内标题跳转、面包屑导航 |
| **搜索** | Ctrl+F 内联搜索（编辑器内） | 全局搜索、搜索替换、预览内搜索 |
| **统计** | 文件大小、光标行列、文件类型 | 字数统计、阅读时间、字符数、段落数 |
| **导出** | 无 | PDF、HTML、纯文本导出 |
| **视图** | Editor/Preview 标签切换 | 分屏视图（左右同步）、纯预览模式、专注模式 |
| **文件管理** | 单文件打开/保存、文件夹浏览 | 最近文件列表、标签页多文件管理、自动保存 |
| **内容增强** | Prettier 格式化 | 拼写检查、Emoji 选择器、YAML Front Matter 解析、链接验证、图片粘贴 |
| **辅助** | 快捷键提示、拖拽打开 | 行宽指示器、可配置字体大小、编辑器缩放 |

---

## 第一阶段：核心 MD 编辑器体验（高优先级）

### 1.1 大纲 / 目录导航面板

**参考**: Typora、VS Code、Obsidian  
**现有基础**: FileTree 侧边栏组件已有，可直接复用布局结构

**实现内容**:
- 从 Markdown 内容中提取所有标题（`#` ~ `######`），构建树形大纲
- 预览模式下点击大纲项跳转到对应标题位置（滚动到锚点）
- 编辑模式下点击大纲项定位编辑器光标到对应标题行
- 当前正在阅读/编辑的标题高亮显示
- 大纲与文件树之间添加 Tab 切换（文件 / 大纲）

**修改文件**:
- 新建 `src/lib/components/Outline.svelte` — 大纲面板组件
- 修改 `src/lib/stores/ui.ts` — 添加 `sidebarTab` 状态
- 修改 `src/lib/components/FileTree.svelte` — 集成大纲 Tab

**新增依赖**: 无（纯文本解析）

---

### 1.2 编辑器-预览滚动同步

**参考**: Typora、VS Code Markdown Preview  
**现有基础**: Editor.svelte 和 Preview.svelte 都已存在

**实现内容**:
- 编辑器滚动 → 预览同步滚动（基于行号比例映射）
- 预览滚动 → 编辑器同步滚动（基于标题锚点映射）
- 双向同步通过 CodeMirror `scrollIntoView` + DOM `scrollTop` 比例计算
- 在 TabBar 或 StateBar 添加同步开关按钮

**修改文件**:
- 修改 `src/App.svelte` — 添加滚动同步逻辑
- 修改 `src/components/Editor.svelte` — 暴露滚动事件
- 修改 `src/components/Preview.svelte` — 暴露滚动事件和标题锚点信息
- 修改 `src/lib/stores/ui.ts` — 添加 `scrollSyncEnabled` 状态

**新增依赖**: 无

---

### 1.3 字数统计与阅读时间

**参考**: iA Writer、Typora  
**现有基础**: StatusBar 已显示文件大小和行列，可扩展

**实现内容**:
- 统计当前文档的字数（中英文混合）、字符数（含/不含空格）、段落数
- 计算预估阅读时间（中文 ~300字/分钟，英文 ~200词/分钟）
- 选中文本时显示选中内容的字数
- 在 StatusBar 右侧区域显示 `字数: 1234 | 阅读: ~5min`

**修改文件**:
- 新建 `src/lib/utils/statistics.ts` — 字数统计工具函数
- 修改 `src/components/StatusBar.svelte` — 添加统计信息展示

**新增依赖**: 无

---

### 1.4 专注模式 / 打字机模式

**参考**: iA Writer、Typora、Ulysses  
**现有基础**: 工具栏已有折叠功能

**实现内容**:
- **专注模式**: 隐藏工具栏、侧边栏、状态栏，仅显示编辑器，居中窄栏布局（~700px）
- **打字机模式**: 光标始终保持在屏幕垂直中央位置
- **段落聚焦**: 当前段落正常显示，其他段落淡化（半透明）
- 通过 `Ctrl+Shift+F` 快捷键切换专注模式
- 按 `Esc` 退出专注模式

**修改文件**:
- 新建 `src/lib/components/FocusMode.svelte` — 专注模式布局容器
- 修改 `src/App.svelte` — 集成专注模式切换
- 修改 `src/lib/stores/ui.ts` — 添加 `focusMode`、`typewriterMode`、`paragraphFocus` 状态

**新增依赖**: 无

---

### 1.5 自动保存

**参考**: VS Code、Obsidian  
**现有基础**: 已有 Ctrl+S 手动保存

**实现内容**:
- 可配置的自动保存间隔（默认 30 秒，可设为关闭/10s/30s/60s/120s）
- 仅保存已修改（isModified=true）且有保存路径的文件
- 自动保存前可选是否运行 Prettier 格式化
- 状态栏显示自动保存状态指示器
- 在设置面板中添加自动保存配置

**修改文件**:
- 修改 `src/App.svelte` — 添加自动保存定时器逻辑
- 修改 `src/components/SettingsPanel.svelte` — 添加自动保存配置项
- 修改 `src/lib/stores/ui.ts` — 添加 `autoSaveInterval` 状态
- 修改 `src/lib/utils/persistence.ts` — 持久化自动保存配置

**新增依赖**: 无

---

### 1.6 Markdown Snippets 快捷插入

**参考**: VS Code、Obsidian  
**现有基础**: CodeMirror 6 已有扩展生态

**实现内容**:
- 常用 Markdown 片段快捷插入工具栏按钮：
  - **加粗** `Ctrl+B` — 选中文本包裹 `**text**`
  - **斜体** `Ctrl+I` — 选中文本包裹 `*text*`
  - **删除线** — `~~text~~`
  - **行内代码** — `` `code` ``
  - **链接** `Ctrl+K` — `[text](url)`
  - **图片** — `![alt](url)`
  - **引用块** — `> quote`
  - **无序列表** — `- item`
  - **有序列表** — `1. item`
  - **任务列表** — `- [ ] task`
  - **表格模板** — 快速插入 3x3 表格
  - **分割线** — `---`
  - **代码块** — ` ```lang\n\n``` `
- 仅对 Markdown 文件显示这些按钮

**修改文件**:
- 新建 `src/lib/components/MDToolbar.svelte` — Markdown 专用快捷工具栏
- 修改 `src/components/Toolbar.svelte` — MD 文件时显示 MDToolbar

**新增依赖**: 无

---

## 第二阶段：增强预览与内容（中优先级）

### 2.1 Mermaid 图表渲染

**参考**: Typora、Obsidian、GitHub  
**现有基础**: Marked 已处理代码块，DOMPurify 已做安全过滤

**实现内容**:
- 检测 ` ```mermaid` 代码块，使用 Mermaid.js 渲染为 SVG 图表
- 支持暗色/亮色主题自适应
- 渲染失败时回退显示原始代码块
- 配置 DOMPurify 白名单允许 mermaid 生成的 SVG 标签

**修改文件**:
- 修改 `src/lib/utils/markdown.ts` — 添加 Mermaid 渲染钩子
- 修改 `src/components/Preview.svelte` — 在 DOM 挂载后初始化 Mermaid

**新增依赖**: `mermaid` (^10.x)

---

### 2.2 KaTeX 数学公式渲染

**参考**: Typora、Obsidian、Notion  
**现有基础**: 无

**实现内容**:
- 支持行内公式 `$E=mc^2$` 和块级公式 `$$\int_a^b f(x)dx$$`
- 使用 KaTeX 渲染为 HTML+CSS（比 MathJax 更快，更适合桌面端）
- 在 DOMPurify 白名单中允许 KaTeX 标签
- 同时支持 Marked 自定义渲染器处理 LaTeX

**修改文件**:
- 修改 `src/lib/utils/markdown.ts` — 添加 KaTeX 渲染扩展

**新增依赖**: `katex` (^0.16.x)

---

### 2.3 交互式任务列表

**参考**: Typora、Obsidian、Notion  
**现有基础**: Preview 已渲染 Markdown 列表

**实现内容**:
- 预览模式下 `- [ ]` 和 `- [x]` 渲染为可点击的复选框
- 点击复选框切换完成状态，并**回写到编辑器源文本**
- 仅在预览模式下可交互（编辑模式下显示为文本）

**修改文件**:
- 修改 `src/components/Preview.svelte` — 添加复选框交互逻辑
- 修改 `src/App.svelte` — 添加任务状态回写函数

**新增依赖**: 无

---

### 2.4 图片粘贴与本地化管理

**参考**: Typora、VS Code  
**现有基础**: 已有拖拽打开文件功能

**实现内容**:
- 剪贴板图片粘贴（`Ctrl+V` 粘贴图片到文档）
- 自动将图片保存到文档同目录下的 `assets/` 或 `images/` 文件夹
- 自动插入相对路径的图片 Markdown 语法 `![](images/xxx.png)`
- 可配置图片存储路径策略（相对路径 / 绝对路径 / 同目录）

**修改文件**:
- 新建 `src/lib/utils/image.ts` — 图片处理工具（读取剪贴板、保存文件）
- 修改 `src/App.svelte` — 添加粘贴事件处理
- 修改 `src/components/SettingsPanel.svelte` — 添加图片路径配置

**新增依赖**: 无（Tauri 原生能力处理文件写入）

---

### 2.5 预览内搜索

**参考**: VS Code、Chrome DevTools  
**现有基础**: SearchBar 已在编辑器实现

**实现内容**:
- 在预览模式下也支持 Ctrl+F 搜索
- 高亮匹配文本（通过 DOM 遍历 + Range API）
- 支持上/下一个导航，显示匹配计数

**修改文件**:
- 修改 `src/components/Preview.svelte` — 集成 SearchBar，实现 DOM 搜索高亮

**新增依赖**: 无

---

## 第三阶段：编辑器体验提升（中优先级）

### 3.1 分屏视图（Split View）

**参考**: VS Code、Obsidian  
**现有基础**: 已有 Editor/Preview Tab 切换

**实现内容**:
- 在 TabBar 添加第三种视图模式：「分屏」
- 左侧显示编辑器，右侧显示预览，中间可拖拽调整分割比例
- 分屏时滚动同步自动启用
- 支持 `Ctrl+Shift+P` 切换分屏

**修改文件**:
- 新建 `src/lib/components/SplitView.svelte` — 分屏容器组件
- 修改 `src/components/TabBar.svelte` — 添加分屏模式按钮
- 修改 `src/App.svelte` — 集成分屏视图
- 修改 `src/lib/stores/ui.ts` — 添加 `viewMode` 状态

**新增依赖**: 无

---

### 3.2 YAML Front Matter 解析

**参考**: Obsidian、Zettlr、Hugo  
**现有基础**: 无

**实现内容**:
- 解析文档开头的 `---` YAML Front Matter
- 在预览顶部渲染为格式化的元数据卡片（标题、日期、标签、作者等）
- 编辑模式下 Front Matter 语法高亮
- 支持常见字段：title, date, author, tags, description, slug

**修改文件**:
- 新建 `src/lib/utils/frontmatter.ts` — Front Matter 解析工具
- 修改 `src/components/Preview.svelte` — 添加 Front Matter 渲染卡片
- 修改 `src/components/Editor.svelte` — 启用 YAML 语法高亮（已有 @codemirror/lang-yaml）

**新增依赖**: `yaml` (已安装，Prettier 的依赖)

---

### 3.3 拼写检查

**参考**: VS Code、Typora  
**现有基础**: 无

**实现内容**:
- 使用浏览器内置 `spellcheck` 或集成 typo.js 字典
- 对 Markdown 正文内容进行拼写检查（跳过代码块、URL 等）
- 红色波浪下划线标记拼写错误
- 右键菜单提供修正建议

**修改文件**:
- 修改 `src/components/Editor.svelte` — 启用拼写检查配置

**新增依赖**: 可选 `typo-js` 用于离线字典

---

### 3.4 Emoji 选择器

**参考**: Notion、GitHub  
**现有基础**: 无

**实现内容**:
- `:` 触发 Emoji 自动补全（类似 GitHub `:smile:` → 😄）
- 工具栏 Emoji 按钮打开 Emoji 面板
- 支持搜索、分类浏览
- 同时支持 Unicode emoji 和 shortcode 两种模式

**修改文件**:
- 新建 `src/lib/components/EmojiPicker.svelte` — Emoji 选择器面板
- 修改 `src/components/Editor.svelte` — 添加 `:` 触发的自动补全

**新增依赖**: 无（可自建 emoji 数据）

---

### 3.5 最近文件列表

**参考**: VS Code、Sublime Text  
**现有基础**: localStorage 已有 session 持久化

**实现内容**:
- 维护最近打开的文件列表（最多 20 个）
- 欢迎页显示「最近打开」区域，点击快速打开
- 工具栏或 FileTree 提供最近文件入口
- 文件路径无效时（被删除/移动）自动从列表移除

**修改文件**:
- 修改 `src/lib/utils/persistence.ts` — 添加最近文件存储逻辑
- 修改 `src/App.svelte` — 欢迎页集成最近文件列表

**新增依赖**: 无

---

## 第四阶段：导出与分享（低优先级）

### 4.1 导出为 PDF

**参考**: Typora、VS Code Markdown PDF  
**现有基础**: 已有完整的 Markdown → HTML 渲染管线

**实现内容**:
- 通过打印 API 实现 PDF 导出（`window.print()` + CSS `@media print`）
- 自定义打印样式（页面边距、页眉页脚、字体大小）
- 或通过 Rust 后端使用 `printpdf` crate 直接生成 PDF
- 工具栏添加「导出 PDF」按钮

**修改文件**:
- 新建 `src/lib/utils/export.ts` — 导出工具函数
- 修改 `src/components/Toolbar.svelte` — 添加导出按钮
- 新增 Rust command `export_pdf` (可选)

**新增依赖（前端）**: 无  
**新增依赖（Rust）**: `printpdf` (可选方案)

---

### 4.2 导出为 HTML

**参考**: Typora、Markdown Preview Enhanced  
**现有基础**: Preview 已经渲染 HTML

**实现内容**:
- 导出完整的独立 HTML 文件（内嵌 CSS 样式）
- 包含 highlight.js 代码高亮样式
- 支持嵌入/不嵌入图片选择
- 工具栏添加「导出 HTML」按钮

**修改文件**:
- 修改 `src/lib/utils/export.ts` — 添加 HTML 导出函数
- 修改 `src/components/Toolbar.svelte` — 添加导出按钮

**新增依赖**: 无

---

### 4.3 复制为格式化内容

**参考**: Notion、Typora  
**现有基础**: 无

**实现内容**:
- 预览中选择内容后 `Ctrl+C` 复制为富文本（HTML）格式
- 支持粘贴到 Word、邮件等富文本编辑器
- 编辑模式下复制纯 Markdown 源码

**修改文件**:
- 修改 `src/components/Preview.svelte` — 添加富文本复制逻辑

**新增依赖**: 无

---

## 第五阶段：高级能力（低优先级）

### 5.1 全局搜索与替换

**参考**: VS Code  
**现有基础**: 已有编辑器内搜索

**实现内容**:
- `Ctrl+Shift+F` 打开全局搜索面板
- 在当前打开的所有文件中搜索
- 搜索结果列表，点击跳转到对应文件/位置
- 支持全局替换

**修改文件**:
- 新建 `src/lib/components/GlobalSearch.svelte` — 全局搜索面板
- 修改 `src/App.svelte` — 集成全局搜索

**新增依赖**: 无

---

### 5.2 多标签页文件管理

**参考**: VS Code、Sublime Text  
**现有基础**: 已有 `openFiles` 数组和 `currentFileIndex`

**实现内容**:
- 编辑器顶部显示文件标签页栏
- 支持拖拽排序、关闭标签页（`Ctrl+W`）
- 关闭已修改文件时弹出保存提示
- 标签页右键菜单（关闭、关闭其他、关闭右侧、复制路径）

**修改文件**:
- 新建 `src/lib/components/EditorTabs.svelte` — 编辑器标签页组件
- 修改 `src/App.svelte` — 集成标签页栏
- 修改 `src/lib/stores/file.ts` — 添加 `closeFile()` 方法

**新增依赖**: 无

---

### 5.3 字号与编辑器缩放

**参考**: VS Code, Typora  
**现有基础**: CSS 变量定义字体大小

**实现内容**:
- `Ctrl+=` / `Ctrl+-` 调整编辑器字体大小
- `Ctrl+0` 恢复默认大小
- 设置面板添加字体大小滑块
- 缩放比例持久化到 localStorage

**修改文件**:
- 修改 `src/App.svelte` — 添加缩放快捷键
- 修改 `src/components/SettingsPanel.svelte` — 添加字号设置
- 修改 `src/lib/stores/ui.ts` — 添加 `fontSize` 状态

**新增依赖**: 无

---

### 5.4 Markdown 快捷键增强

**参考**: Typora、iA Writer  
**现有基础**: 已有基础文件操作快捷键

**实现内容**:

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+K` | 删除当前行 |
| `Ctrl+Shift+↑/↓` | 移动行上下 |
| `Ctrl+D` | 复制当前行 |
| `Ctrl+Enter` | 在下方插入空行 |
| `Ctrl+Shift+Enter` | 在上方插入空行 |
| `Ctrl+Shift+[` | 折叠当前区块 |
| `Ctrl+Shift+]` | 展开当前区块 |
| `Tab` / `Shift+Tab` | 缩进/反缩进 |

**修改文件**:
- 修改 `src/components/Editor.svelte` — 添加扩展快捷键

**新增依赖**: 需在 package.json 中确保 `@codemirror/commands` keymap 已引入

---

### 5.5 链接验证

**参考**: Zettlr  
**现有基础**: 无

**实现内容**:
- 预览模式下可扫描文档内所有链接
- 标注无效（404/无法访问）的外部链接
- 标注断开的内部链接（指向不存在的本地文件）

**修改文件**:
- 新建 `src/lib/utils/linkChecker.ts` — 链接验证工具

**新增依赖**: 无

---

## 实施路线图总结

```
Phase 1 (核心体验)            Phase 2 (增强预览)             Phase 3 (体验提升)
─────────────────            ─────────────────             ─────────────────
1.1 大纲导航                 2.1 Mermaid 图表              3.1 分屏视图
1.2 滚动同步                 2.2 KaTeX 数学公式            3.2 YAML Front Matter
1.3 字数统计/阅读时间         2.3 交互式任务列表            3.3 拼写检查
1.4 专注模式/打字机模式       2.4 图片粘贴管理              3.4 Emoji 选择器
1.5 自动保存                 2.5 预览内搜索                3.5 最近文件列表
1.6 Snippets 快捷插入       

      ↓                            ↓                            ↓

Phase 4 (导出分享)            Phase 5 (高级能力)
─────────────────            ─────────────────
4.1 导出 PDF                 5.1 全局搜索替换
4.2 导出 HTML                5.2 多标签页管理
4.3 复制为格式化内容         5.3 字号缩放
                              5.4 Markdown 快捷键增强
                              5.5 链接验证
```

## 技术注意事项

1. **遵循项目规范**: 所有新增代码严格遵循 `Claude.md` 中的架构规范：
   - 前端 API 调用使用 `$lib/api/` 封装，禁止组件直接 `invoke`
   - 使用 Svelte 5 Runes 语法（`$state`, `$derived`, `$effect`, `$props()`）
   - IPC 通信使用 Result 元组模式 `[AppError | null, T | null]`
2. **保持 Neo-Brutalism 设计风格**: 新 UI 组件继承现有 CSS 变量体系和粗野主义设计语言
3. **桌面端优先**: 所有功能针对桌面端（Tauri）体验优化，不考虑移动端
4. **性能考量**: 大文档（>10000行）时需注意解析性能，使用 Web Worker 或节流处理
