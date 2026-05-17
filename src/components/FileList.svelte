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

  function handleItemKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Enter') switchToFile(index);
  }

  function handleCloseClick(e: MouseEvent, index: number) {
    e.stopPropagation();
    closeFile(index);
  }
</script>

<div class="sidebar" class:collapsed={!$sidebarOpen}>
  <div class="sidebar-header">
    {#if $sidebarOpen}
      <span class="sidebar-title">Files</span>
      <span class="file-count">{$openFiles.length}</span>
      <button class="collapse-btn" onclick={toggleSidebar} title="Collapse sidebar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
    {:else}
      <button class="collapse-btn" onclick={toggleSidebar} title="Expand sidebar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    {/if}
  </div>
  
  {#if $sidebarOpen}
    <div class="file-list">
      {#each $openFiles as file, i (file.path || i)}
        <div
          class="file-item"
          class:active={$currentFileIndex === i}
          role="button"
          tabindex="0"
          onclick={() => switchToFile(i)}
          onkeydown={(e) => handleItemKeydown(e, i)}
        >
          <span class="file-icon file-icon-colored" style="background: {getFileIconColor(file.name)}">{getFileIcon(file.name)}</span>
          <span class="file-name" title={file.path || file.name}>
            {file.name}
            {#if file.isModified}
              <span class="modified-dot"></span>
            {/if}
          </span>
          <button class="file-close" onclick={(e) => handleCloseClick(e, i)} title="Close file">×</button>
        </div>
      {/each}
      {#if $openFiles.length === 0}
        <div class="empty-state">
          <p>No files</p>
          <p class="hint">Ctrl+O to open</p>
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
    height: 100%;
    background: var(--acrylic-sidebar-bg);
    border-right: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    transition: width 200ms ease;
  }

  .sidebar.collapsed {
    width: var(--sidebar-collapsed-width);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--color-border);
    min-height: 41px;
  }

  .sidebar-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-slate);
  }

  .file-count {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-slate);
    background: var(--color-bg);
    padding: 1px 7px;
    border-radius: 10px;
    border: 1px solid var(--color-border);
    margin-left: auto;
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--radius-sm);
    color: var(--color-btn-icon);
    transition: all 150ms ease;
    flex-shrink: 0;
  }

  .collapse-btn:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .file-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    transition: background 120ms ease;
    text-align: left;
  }

  .file-item:hover {
    background: var(--color-sidebar-active);
  }

  .file-item.active {
    background: var(--color-sidebar-active);
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

  .file-name {
    font-size: 13px;
    color: var(--color-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .modified-dot {
    width: 6px;
    height: 6px;
    background: var(--color-accent);
    border-radius: 50%;
    flex-shrink: 0;
  }

  .file-close {
    display: none;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    font-size: 14px;
    color: var(--color-btn-icon);
    flex-shrink: 0;
    transition: all 120ms ease;
  }

  .file-item:hover .file-close {
    display: flex;
  }

  .file-close:hover {
    background: var(--color-border);
    color: var(--color-btn-icon-hover);
  }

  .empty-state {
    padding: 24px 16px;
    text-align: center;
    color: var(--color-slate);
    font-size: 13px;
  }

  .empty-state .hint {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-steel);
  }

  .collapsed-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 4px;
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
  }

  .collapsed-item:hover {
    background: var(--color-sidebar-active);
  }

  .collapsed-item.active {
    background: var(--color-sidebar-active);
  }
</style>