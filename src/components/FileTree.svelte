<script lang="ts">
  import { currentFile } from '$lib/stores/file';
  import { sidebarTab } from '$lib/stores/ui';
  import { getRecentFiles, type RecentFileEntry } from '$lib/utils/recentFiles';
  import { getFileType } from '$lib/utils/fileTypes';
  import Outcome from '$lib/components/Outline.svelte';
  import type { FileType } from '$lib/types';

  let {
    onNavigateToLine,
    onOpenRecentFile,
    editorView,
  }: {
    onNavigateToLine?: (lineNumber: number) => void;
    onOpenRecentFile?: (path: string, name: string) => void;
    editorView?: any;
  } = $props();

  let recentFiles = $state(getRecentFiles());

  function handleNavigateToLine(line: number) {
    if (onNavigateToLine) {
      onNavigateToLine(line);
    } else if (editorView) {
      const doc = editorView.state.doc;
      const targetLine = Math.min(line, doc.lines);
      const pos = doc.line(targetLine).from;
      editorView.dispatch({
        selection: { anchor: pos, head: pos },
        scrollIntoView: true,
      });
      editorView.focus();
    }
  }

  async function handleRecentClick(entry: RecentFileEntry) {
    if (onOpenRecentFile) {
      await onOpenRecentFile(entry.path, entry.name);
    }
    recentFiles = getRecentFiles();
  }

  function getFileIconColor(ft: string): string {
    const colors: Record<string, string> = {
      Markdown: '#3a3a3a', JavaScript: '#3a3d28', TypeScript: '#1e3a4a',
      Jsx: '#1e3a4a', Tsx: '#1e3a4a', Css: '#2a3344', Html: '#3d2227',
      Json: '#1e3830', Python: '#1e3830', Rust: '#3d2227', Go: '#1e3a4a',
      Java: '#3d2227', C: '#36383b', Cpp: '#2a3344', Shell: '#1e3830',
      Yaml: '#3d2227', Toml: '#36383b', Xml: '#3d2227',
    };
    return colors[ft] || '#36383b';
  }

  function getFileIcon(ft: string): string {
    const icons: Record<string, string> = {
      Markdown: 'md', JavaScript: 'js', TypeScript: 'ts', Jsx: 'jsx', Tsx: 'tsx',
      Css: 'css', Html: 'html', Json: 'json', Python: 'py', Rust: 'rs',
      Go: 'go', Java: 'java', C: 'c', Cpp: 'cpp', Shell: 'sh',
      Yaml: 'yml', Toml: 'toml', Xml: 'xml',
    };
    return icons[ft] || 'txt';
  }
</script>

<div class="panel">
  <div class="sidebar-tabs">
    <button
      class="sidebar-tab"
      class:active={$sidebarTab === 'outline'}
      onclick={() => sidebarTab.set('outline')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
      大纲
    </button>
    <button
      class="sidebar-tab"
      class:active={$sidebarTab === 'recent'}
      onclick={() => { sidebarTab.set('recent'); recentFiles = getRecentFiles(); }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      最近
    </button>
  </div>

  {#if $sidebarTab === 'outline'}
    <Outcome
      content={$currentFile?.content || ''}
      fileType={($currentFile?.fileType || 'Markdown') as FileType}
      onNavigateToLine={handleNavigateToLine}
    />
  {:else}
    {#if recentFiles.length > 0}
      <div class="section-header">
        <span class="section-title">最近打开</span>
      </div>
      <div class="section-content">
        {#each recentFiles as entry}
          <button class="file-item" onclick={() => handleRecentClick(entry)}>
            <span class="file-icon file-icon-colored" style="background: {getFileIconColor(getFileType(entry.name))}">
              {getFileIcon(getFileType(entry.name))}
            </span>
            <span class="file-name" title={entry.path}>{entry.name}</span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>暂无最近文件</p>
        <p class="hint">打开文件后将显示在这里</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .sidebar-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .sidebar-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    justify-content: center;
    padding: 7px 6px;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-btn-icon);
    transition: all 120ms ease;
    position: relative;
  }

  .sidebar-tab:hover {
    color: var(--color-btn-icon-hover);
    background: var(--color-btn-bg-hover);
  }

  .sidebar-tab.active {
    color: var(--color-accent);
    font-weight: 600;
  }

  .sidebar-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%;
    right: 20%;
    height: 2px;
    background: var(--color-accent);
    border-radius: 1px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .section-title {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-slate);
    letter-spacing: 0.5px;
  }

  .section-content {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 12px;
    text-align: left;
    color: var(--color-ink);
    font-size: 12px;
    transition: background 100ms ease;
    animation: fileItemIn 180ms ease-out;
  }

  @keyframes fileItemIn {
    from { opacity: 0; transform: translateX(-12px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .file-item:hover {
    background: var(--color-btn-bg-hover);
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
    text-align: center;
  }

  .empty-state p {
    color: var(--color-slate);
    font-size: 12px;
    margin: 0;
  }

  .empty-state .hint {
    font-size: 11px;
    margin-top: 6px;
    opacity: 0.6;
  }
</style>
