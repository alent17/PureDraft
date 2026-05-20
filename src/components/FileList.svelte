<script lang="ts">
  import { openFiles, currentFileIndex, switchToFile, closeFile } from '$lib/stores/file';
  import { sidebarOpen } from '$lib/stores/ui';
  import { getFileType } from '$lib/utils/fileTypes';

  function getFileIcon(name: string): string {
    const ft = getFileType(name);
    const icons: Record<string, string> = {
      Markdown: 'md', JavaScript: 'js', TypeScript: 'ts', Jsx: 'jsx', Tsx: 'tsx',
      Css: 'css', Html: 'html', Json: 'json', Python: 'py', Rust: 'rs',
      Go: 'go', Java: 'java', C: 'c', Cpp: 'cpp', Shell: 'sh',
      Yaml: 'yml', Toml: 'toml', Xml: 'xml',
    };
    return icons[ft] || 'txt';
  }

  function getFileIconColor(name: string): string {
    const ft = getFileType(name);
    const colors: Record<string, string> = {
      Markdown: '#3a3a3a', JavaScript: '#3a3d28', TypeScript: '#1e3a4a',
      Jsx: '#1e3a4a', Tsx: '#1e3a4a', Css: '#2a3344', Html: '#3d2227',
      Json: '#1e3830', Python: '#1e3830', Rust: '#3d2227', Go: '#1e3a4a',
      Java: '#3d2227', C: '#36383b', Cpp: '#2a3344', Shell: '#1e3830',
      Yaml: '#3d2227', Toml: '#36383b', Xml: '#3d2227',
    };
    return colors[ft] || '#36383b';
  }

  function toggleSidebar() {
    sidebarOpen.update(v => !v);
  }

  function handleCloseClick(e: MouseEvent, index: number) {
    e.stopPropagation();
    const file = $openFiles[index];
    if (!file) return;
    if (!window.confirm(`确定要关闭 "${file.name}" 吗？未保存的更改将丢失。`)) return;
    closeFile(index);
  }
</script>

<div class="sidebar" class:collapsed={!$sidebarOpen}>
  <button class="collapse-btn" onclick={toggleSidebar} title={$sidebarOpen ? '收起侧边栏' : '展开侧边栏'}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      {#if $sidebarOpen}
        <polyline points="15 18 9 12 15 6"/>
      {:else}
        <polyline points="9 18 15 12 9 6"/>
      {/if}
    </svg>
  </button>

  {#if $sidebarOpen}
    <div class="file-list">
      {#each $openFiles as file, i (file.path || i)}
        <div
          class="file-item"
          class:active={$currentFileIndex === i}
          role="button"
          tabindex="0"
          title={file.path || file.name}
          onclick={() => switchToFile(i)}
          onkeydown={(e) => { if (e.key === 'Enter') switchToFile(i); }}
        >
          <span class="file-icon file-icon-colored" style="background: {getFileIconColor(file.name)}">{getFileIcon(file.name)}</span>
          {#if file.isModified}
            <span class="modified-dot"></span>
          {/if}
          <button class="file-close" onclick={(e) => handleCloseClick(e, i)} title="关闭文件">×</button>
        </div>
      {/each}
      {#if $openFiles.length === 0}
        <div class="empty-state">
          <p></p>
        </div>
      {/if}
    </div>
  {:else}
    <div class="collapsed-list">
      {#each $openFiles as file, i (file.path || i)}
        <button
          class="collapsed-item"
          class:active={$currentFileIndex === i}
          onclick={() => switchToFile(i)}
          title={file.path || file.name}
        >
          <span class="file-icon file-icon-colored" style="background: {getFileIconColor(file.name)}">{getFileIcon(file.name)}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sidebar {
    width: var(--sidebar-width);
    height: calc(100% - var(--sidebar-margin) * 2);
    margin: var(--sidebar-margin);
    border-radius: var(--radius-pill);
    background: rgba(30, 30, 30, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    gap: 4px;
    flex-shrink: 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .sidebar.collapsed {
    width: var(--sidebar-collapsed-width);
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    color: #a0a0a0;
    transition: all 150ms ease;
    flex-shrink: 0;
    margin-bottom: 4px;
  }

  .collapse-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .file-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 100%;
    overflow-y: auto;
    padding: 0 4px;
  }

  .file-item {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    width: var(--sidebar-item-size);
    height: var(--sidebar-item-size);
    border-radius: var(--sidebar-item-radius);
    transition: all 0.2s ease;
    flex-shrink: 0;
    color: #a0a0a0;
  }

  .file-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .file-item.active {
    background: rgba(255, 255, 255, 0.12);
    outline: 1px solid rgba(255, 255, 255, 0.15);
  }

  .file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    font-family: var(--font-mono);
    font-size: 8px;
    font-weight: 700;
    color: #ffffff;
    flex-shrink: 0;
    letter-spacing: -0.3px;
    border: 1px solid rgba(255, 255, 255, 0.07);
  }

  .file-icon-colored {
    font-size: 8px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
  }

  .modified-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 6px;
    height: 6px;
    background: var(--color-accent);
    border-radius: 50%;
    flex-shrink: 0;
    border: 1.5px solid rgba(30, 30, 30, 0.8);
  }

  .file-close {
    display: none;
    position: absolute;
    top: -2px;
    right: -2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    font-size: 11px;
    line-height: 1;
    color: #ffffff;
    background: rgba(229, 83, 75, 0.8);
    flex-shrink: 0;
    transition: all 120ms ease;
    align-items: center;
    justify-content: center;
  }

  .file-item:hover .file-close {
    display: flex;
  }

  .file-close:hover {
    background: #e5534b;
    transform: scale(1.1);
  }

  .empty-state {
    width: 100%;
    padding: 0;
  }

  .collapsed-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px;
    gap: 4px;
  }

  .collapsed-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    transition: background 120ms ease;
    flex-shrink: 0;
    color: #a0a0a0;
  }

  .collapsed-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .collapsed-item.active {
    background: rgba(255, 255, 255, 0.12);
    outline: 1px solid rgba(255, 255, 255, 0.15);
  }
</style>