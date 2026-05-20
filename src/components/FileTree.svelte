<script lang="ts">
  import { currentFile } from '$lib/stores/file';
  import { sidebarTab, openConfirmDialog, closeConfirmDialog } from '$lib/stores/ui';
  import { getRecentFiles, removeRecentFile, clearRecentFiles, type RecentFileEntry } from '$lib/utils/recentFiles';
  import { clearAllSaveSlots } from '$lib/utils/saveSlots';
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
  let openMenuPath = $state<string | null>(null);

  const PINNED_KEY = 'puredraft_pinned_files';
  function getPinnedFiles(): string[] {
    try {
      const raw = localStorage.getItem(PINNED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function savePinnedFiles(paths: string[]) {
    localStorage.setItem(PINNED_KEY, JSON.stringify(paths));
  }

  let pinnedPaths = $state(getPinnedFiles());

  const sortedRecentFiles = $derived(
    [...recentFiles].sort((a, b) => {
      const aPinned = pinnedPaths.includes(a.path);
      const bPinned = pinnedPaths.includes(b.path);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    })
  );

  const pinnedFiles = $derived(sortedRecentFiles.filter(e => pinnedPaths.includes(e.path)));
  const unpinnedFiles = $derived(sortedRecentFiles.filter(e => !pinnedPaths.includes(e.path)));

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

  function toggleMenu(path: string, e: MouseEvent) {
    e.stopPropagation();
    openMenuPath = openMenuPath === path ? null : path;
  }

  function closeMenu() {
    openMenuPath = null;
  }

  function handlePinToggle(path: string) {
    const current = getPinnedFiles();
    const idx = current.indexOf(path);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(path);
    }
    savePinnedFiles(current);
    pinnedPaths = current;
    closeMenu();
  }

  function handleRenameRecent(entry: RecentFileEntry) {
    closeMenu();
    const newName = window.prompt('重命名文件', entry.name);
    if (!newName || newName === entry.name) return;
    entry.name = newName;
    recentFiles = getRecentFiles();
  }

  function handleDeleteRecent(entry: RecentFileEntry) {
    closeMenu();
    openConfirmDialog({
      title: '删除文件',
      message: `确定要移除 "${entry.name}" 吗？关联的存档也将被清除。`,
      danger: true,
      onConfirm: () => {
        removeRecentFile(entry.path);
        clearAllSaveSlots(entry.path);
        const current = getPinnedFiles();
        const idx = current.indexOf(entry.path);
        if (idx >= 0) {
          current.splice(idx, 1);
          savePinnedFiles(current);
          pinnedPaths = current;
        }
        recentFiles = getRecentFiles();
        closeConfirmDialog();
      },
      onCancel: () => {
        closeConfirmDialog();
      }
    });
  }

  function handleClearAllRecent() {
    openConfirmDialog({
      title: '清空记录',
      message: '确定要清空所有最近文件记录吗？关联的存档也将被清除。',
      danger: true,
      onConfirm: () => {
        const all = getRecentFiles();
        for (const entry of all) {
          clearAllSaveSlots(entry.path);
        }
        clearRecentFiles();
        savePinnedFiles([]);
        pinnedPaths = [];
        recentFiles = [];
        closeConfirmDialog();
      },
      onCancel: () => {
        closeConfirmDialog();
      }
    });
  }

  function handleDocumentClick() {
    if (openMenuPath) closeMenu();
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
      文件
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
        <span class="section-title">常用</span>
      </div>
      {#if pinnedFiles.length > 0}
        <div class="section-content" role="presentation" onclick={handleDocumentClick} onkeydown={(e) => { if (e.key === 'Escape') closeMenu(); }}>
          {#each pinnedFiles as entry (entry.path)}
            <div class="file-item" onclick={() => handleRecentClick(entry)} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter') handleRecentClick(entry); }}>
              <span class="file-icon file-icon-colored" style="background: {getFileIconColor(getFileType(entry.name))}">
                {getFileIcon(getFileType(entry.name))}
              </span>
              <span class="file-name" title={entry.path}>
                {entry.name}
                {#if pinnedPaths.includes(entry.path)}
                  <svg class="pin-indicator" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                  </svg>
                {/if}
              </span>
              <button
                class="file-item-menu"
                class:active={openMenuPath === entry.path}
                onclick={(e) => toggleMenu(entry.path, e)}
                title="更多操作"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>
              {#if openMenuPath === entry.path}
                <div class="dropdown-menu" role="presentation" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') closeMenu(); }}>
                  <button class="dropdown-item" onclick={() => handleRenameRecent(entry)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    重命名
                  </button>
                  <button class="dropdown-item" onclick={() => handlePinToggle(entry.path)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                    </svg>
                    {pinnedPaths.includes(entry.path) ? '取消固定' : '固定'}
                  </button>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item dropdown-item-danger" onclick={() => handleDeleteRecent(entry)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    删除
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
      {#if unpinnedFiles.length > 0}
        <div class="section-header">
          <span class="section-title">最近文件</span>
          <button class="clear-all-btn" onclick={handleClearAllRecent} title="清空所有最近文件">
            全部清空
          </button>
        </div>
        <div class="section-content" role="presentation" onclick={handleDocumentClick} onkeydown={(e) => { if (e.key === 'Escape') closeMenu(); }}>
          {#each unpinnedFiles as entry (entry.path)}
          <div class="file-item" onclick={() => handleRecentClick(entry)} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter') handleRecentClick(entry); }}>
            <span class="file-icon file-icon-colored" style="background: {getFileIconColor(getFileType(entry.name))}">
              {getFileIcon(getFileType(entry.name))}
            </span>
            <span class="file-name" title={entry.path}>
              {entry.name}
              {#if pinnedPaths.includes(entry.path)}
                <svg class="pin-indicator" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                </svg>
              {/if}
            </span>
            <button
              class="file-item-menu"
              class:active={openMenuPath === entry.path}
              onclick={(e) => toggleMenu(entry.path, e)}
              title="更多操作"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>
            {#if openMenuPath === entry.path}
              <div class="dropdown-menu" role="presentation" onclick={(e) => e.stopPropagation()} onkeydown={(e) => { if (e.key === 'Escape') closeMenu(); }}>
                <button class="dropdown-item" onclick={() => handleRenameRecent(entry)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  重命名
                </button>
                <button class="dropdown-item" onclick={() => handlePinToggle(entry.path)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                  </svg>
                  {pinnedPaths.includes(entry.path) ? '取消固定' : '固定'}
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item dropdown-item-danger" onclick={() => handleDeleteRecent(entry)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  删除
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
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

  .clear-all-btn {
    font-size: 10px;
    color: var(--color-slate);
    padding: 2px 6px;
    border-radius: 4px;
    transition: color 120ms ease, background 120ms ease;
  }

  .clear-all-btn:hover {
    color: #e5534b;
    background: rgba(229, 83, 75, 0.08);
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
    width: calc(100% - 20px);
    margin: 4px 10px;
    padding: 8px 12px;
    text-align: left;
    color: var(--color-ink);
    font-size: 15px;
    cursor: pointer;
    border-radius: 8px;
    background: transparent;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    animation: fileItemIn 180ms ease-out;
    position: relative;
    overflow: visible;
    border: 1px solid transparent;
  }

  @keyframes fileItemIn {
    from { opacity: 0; transform: translateX(-12px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .file-item:hover {
    background: var(--color-btn-bg-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .file-item:active {
    transform: scale(0.98);
  }

  .file-item.selected {
    background: var(--color-sidebar-active);
    color: var(--color-accent);
    border-color: rgba(96, 205, 255, 0.15);
  }

  .file-item-menu {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    margin-left: auto;
    flex-shrink: 0;
    opacity: 0;
    color: var(--color-slate);
    transition: opacity 120ms ease, color 120ms ease, background 120ms ease;
    position: relative;
  }

  .file-item:hover .file-item-menu,
  .file-item-menu.active {
    opacity: 1;
  }

  .file-item-menu:hover,
  .file-item-menu.active {
    color: var(--color-btn-icon-hover);
    background: var(--color-btn-bg-hover);
  }

  .pin-indicator {
    display: inline-block;
    vertical-align: middle;
    margin-left: 4px;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .dropdown-menu {
    position: absolute;
    right: 4px;
    top: 100%;
    z-index: 100;
    min-width: 130px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 4px;
    animation: dropdownIn 120ms ease-out;
  }

  @keyframes dropdownIn {
    from { opacity: 0; transform: scale(0.95) translateY(-4px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    font-size: 12px;
    color: var(--color-ink);
    border-radius: 4px;
    transition: background 100ms ease;
    text-align: left;
  }

  .dropdown-item:hover {
    background: var(--color-btn-bg-hover);
  }

  .dropdown-item-danger {
    color: #e5534b;
  }

  .dropdown-item-danger:hover {
    background: rgba(229, 83, 75, 0.1);
  }

  .dropdown-divider {
    height: 1px;
    background: var(--color-border);
    margin: 3px 0;
  }

  .file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    font-family: "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    flex-shrink: 0;
    letter-spacing: -0.3px;
    border: 1px solid rgba(255, 255, 255, 0.07);
  }

  .file-icon-colored {
    font-size: 12px;
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
