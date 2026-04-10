# PureDraft 🎵

一个基于 Spotify 设计风格的 Markdown 编辑器和阅读器，使用 Svelte + Tauri + Rust 构建。

## ✨ 特性

- 🎨 **Spotify 风格深色主题** - 沉浸式深色界面，Spotify Green 强调色
- 📝 **实时编辑与预览** - 左侧编辑，右侧实时预览
- ↔️ **可调节分栏** - 拖动分隔线自由调整编辑器/预览区域大小
- 🚀 **高性能** - 基于 Svelte 5 和 Rust
- 🖥️ **跨平台** - 支持 Windows、macOS 和 Linux

## 🛠️ 技术栈

- **前端**: Svelte 5 (Runes 模式) + Vite
- **桌面框架**: Tauri v2
- **后端**: Rust
- **Markdown 解析**: marked

## 📦 安装

### 前置要求

- Node.js 18+ 
- Rust 1.77.2+
- Tauri CLI

### 开发环境

```bash
# 克隆仓库
git clone <your-repo-url>
cd puredraft

# 安装依赖
npm install

# 运行开发模式
npm run tauri dev

# 构建生产版本
npm run tauri build
```

## 🎯 项目结构

```
puredraft/
├── src/
│   ├── lib/
│   │   ├── Layout.svelte         # 布局组件
│   │   ├── MarkdownEditor.svelte # Markdown 编辑器
│   │   └── MarkdownPreview.svelte # Markdown 预览
│   ├── App.svelte                # 主应用
│   └── app.css                   # Spotify 风格设计系统
├── src-tauri/
│   ├── src/
│   │   └── lib.rs                # Rust 后端
│   └── tauri.conf.json           # Tauri 配置
└── package.json
```

## 🎨 设计系统

PureDraft 采用 Spotify 的设计语言：

- **颜色**: 深色主题 (`#121212`, `#181818`, `#1f1f1f`)
- **强调色**: Spotify Green (`#1ed760`)
- **字体**: Helvetica Neue, Arial
- **形状**: Pill 形状按钮 (500px-9999px radius)
- **阴影**: 深度阴影效果

## 📸 截图

![PureDraft Screenshot](./screenshot.png)

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- 设计灵感来自 [Spotify](https://spotify.com)
- 使用 [Svelte](https://svelte.dev)
- 使用 [Tauri](https://tauri.app)
- 使用 [marked](https://marked.js.org)

---

**PureDraft** - 让写作像音乐一样流畅 🎶
