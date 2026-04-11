<script>
  import Layout from './lib/Layout.svelte';
  import MarkdownEditor from './lib/MarkdownEditor.svelte';
  import MarkdownPreview from './lib/MarkdownPreview.svelte';
  import * as api from './lib/api';
  
  // Tauri 窗口控制（仅在桌面环境中可用）
  let appWindow = null;
  
  async function initWindow() {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/webviewWindow');
      appWindow = getCurrentWindow();
    } catch (error) {
      console.log('Tauri API not available, running in web mode');
    }
  }
  
  // 在组件挂载时初始化
  initWindow();
  
  let markdownContent = $state(`# Welcome to PureDraft 🎵

A beautiful Markdown editor inspired by Spotify's design.

## Features

- **Real-time Preview**: See your changes instantly
- **Dark Theme**: Easy on the eyes
- **Clean Design**: Focused on your content

## Getting Started

Start editing in the left panel and see the preview on the right!

### Code Example

\`\`\`javascript
const greet = (name) => {
  console.log(\`Hello, \${name}!\`);
};

greet('World');
\`\`\`

### Quote

> "Design is not just what it looks like and feels like. Design is how it works."

Enjoy writing! ✨`);
  
  let splitPosition = $state(50);
  let isResizing = $state(false);
  
  function startResizing(event) {
    event.preventDefault();
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
  }
  
  function resize(event) {
    if (!isResizing) return;
    
    const container = document.querySelector('.editor-preview-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      const newPercentage = ((event.clientX - rect.left) / rect.width) * 100;
      splitPosition = Math.max(20, Math.min(80, newPercentage));
    }
  }
  
  function stopResizing() {
    isResizing = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResizing);
  }
  
  async function minimizeWindow() {
    try {
      if (appWindow) {
        await appWindow.minimize();
      }
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  }
  
  async function toggleMaximize() {
    try {
      if (appWindow) {
        await appWindow.toggleMaximize();
      }
    } catch (error) {
      console.error('Failed to toggle maximize:', error);
    }
  }
  
  async function closeWindow() {
    try {
      if (appWindow) {
        await appWindow.close();
      }
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  }
  
  // 文件操作功能
  async function handleNewFile() {
    markdownContent = '# New Document\n\nStart writing here...';
  }
  
  async function handleOpenFile() {
    try {
      // 尝试从后端加载文件列表
      const files = await api.listFiles();
      if (files.length > 0) {
        const fileData = await api.readFile(files[0].path);
        if (fileData) {
          markdownContent = fileData.content;
          return;
        }
      }
      // 如果后端不可用，从本地存储加载
      const savedContent = localStorage.getItem('puredraft-content');
      if (savedContent) {
        markdownContent = savedContent;
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      // 回退到本地存储
      const savedContent = localStorage.getItem('puredraft-content');
      if (savedContent) {
        markdownContent = savedContent;
      }
    }
  }
  
  async function handleSaveFile() {
    try {
      // 首先尝试保存到后端
      const filePath = 'document.md';
      const result = await api.writeFile(filePath, markdownContent);
      if (result) {
        console.log('File saved successfully to backend');
      } else {
        // 如果后端不可用，保存到本地存储
        localStorage.setItem('puredraft-content', markdownContent);
        console.log('File saved to local storage');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      // 回退到本地存储
      localStorage.setItem('puredraft-content', markdownContent);
      console.log('File saved to local storage (fallback)');
    }
  }
</script>

<Layout>
  <div class="app">
    <header class="toolbar">
      <div class="toolbar-left">
        <button class="toolbar-button" title="新建" onclick={handleNewFile}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <span>新建</span>
        </button>
        <button class="toolbar-button" title="打开" onclick={handleOpenFile}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          <span>打开</span>
        </button>
        <button class="toolbar-button" title="保存" onclick={handleSaveFile}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
          </svg>
          <span>保存</span>
        </button>
      </div>
      <div class="toolbar-center" role="banner">
        <span class="status-text">PureDraft</span>
      </div>
      <div class="toolbar-right">
        <button class="window-control-button" onclick={minimizeWindow} title="最小化">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M5 12h14v2H5z"/>
          </svg>
        </button>
        <button class="window-control-button" onclick={toggleMaximize} title="最大化">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H6V6h12v12z"/>
          </svg>
        </button>
        <button class="window-control-button close-button" onclick={closeWindow} title="关闭">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </header>
    
    <div class="editor-preview-container">
      <div class="editor-pane" style="width: {splitPosition}%">
        <div class="pane-header">
          <span>编辑器</span>
        </div>
        <MarkdownEditor bind:value={markdownContent} />
      </div>
      
      <div class="resizer" role="separator" aria-valuenow={splitPosition} onmousedown={startResizing} onmouseup={stopResizing}></div>
      
      <div class="preview-pane" style="width: {100 - splitPosition}%">
        <div class="pane-header">
          <span>预览</span>
        </div>
        <MarkdownPreview content={markdownContent} />
      </div>
    </div>
  </div>
</Layout>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-12) var(--space-16);
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--bg-surface-hover);
    user-select: none;
  }
  
  .toolbar-left, .toolbar-right {
    display: flex;
    gap: var(--space-8);
    align-items: center;
  }
  
  .toolbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: grab;
  }
  
  .toolbar-center:active {
    cursor: grabbing;
  }
  
  .toolbar-button {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-8) var(--space-12);
    background-color: var(--bg-button);
    color: var(--text-base);
    border: none;
    border-radius: var(--radius-full-pill);
    font-family: var(--font-ui);
    font-size: var(--text-caption);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-button);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .toolbar-button:hover {
    background-color: var(--bg-surface-hover);
    transform: scale(1.04);
  }
  
  .toolbar-button:active {
    transform: scale(0.98);
  }
  
  .window-control-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 32px;
    background-color: transparent;
    color: var(--text-base);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .window-control-button:hover {
    background-color: var(--bg-surface-hover);
  }
  
  .window-control-button.close-button:hover {
    background-color: #e81123;
    color: white;
  }
  
  .status-text {
    font-family: var(--font-ui);
    font-size: var(--text-caption);
    color: var(--text-secondary);
    font-weight: var(--weight-semibold);
  }
  
  .editor-preview-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  
  .editor-pane, .preview-pane {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .pane-header {
    padding: var(--space-12) var(--space-16);
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--bg-surface-hover);
    font-family: var(--font-ui);
    font-size: var(--text-caption);
    font-weight: var(--weight-bold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-button);
    color: var(--text-secondary);
  }
  
  .resizer {
    width: 4px;
    background-color: var(--bg-surface-hover);
    cursor: col-resize;
    transition: background-color var(--transition-fast);
  }
  
  .resizer:hover {
    background-color: var(--brand-green);
  }
</style>
