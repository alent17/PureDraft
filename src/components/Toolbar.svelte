<script lang="ts">
  import { sidebarOpen, mode, toolbarOpen, settingsOpen, saveSlotsOpen } from '$lib/stores/ui';
  import { currentFileIndex } from '$lib/stores/file';

  let { onOpen, onSave, onSaveAs, onNew }: {
    onOpen: () => void;
    onSave: () => void;
    onSaveAs: () => void;
    onNew: () => void;
  } = $props();

  let hasFile = $derived($currentFileIndex >= 0);

  function toggleMode() {
    mode.update(m => m === 'dark' ? 'light' : 'dark');
  }

  function toggleSidebar() {
    sidebarOpen.update(v => !v);
  }

  function toggleSettings() {
    settingsOpen.update(v => !v);
  }

  function collapseToolbar() {
    toolbarOpen.set(false);
  }
</script>

{#if $toolbarOpen}
<div class="toolbar">
  <div class="toolbar-group">
    <button class="toolbar-btn" onclick={onOpen} title="打开文件 (Ctrl+O)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
    <button class="toolbar-btn" onclick={onNew} title="新建文件 (Ctrl+N)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    </button>
    <button class="toolbar-btn" onclick={onSave} disabled={!hasFile} title="保存 (Ctrl+S)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
    </button>
    <button class="toolbar-btn" onclick={onSaveAs} disabled={!hasFile} title="另存为 (Ctrl+Shift+S)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
        <line x1="15" y1="18" x2="15" y2="14"/>
        <line x1="13" y1="16" x2="17" y2="16"/>
      </svg>
    </button>
  </div>

  <div class="toolbar-separator"></div>

  <div class="toolbar-group">
    <button class="toolbar-btn" onclick={toggleSidebar} title="切换侧边栏 (Ctrl+B)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
      </svg>
    </button>
    <button class="toolbar-btn" onclick={toggleMode} title="切换深浅模式">
      {#if $mode === 'dark'}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      {:else}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      {/if}
    </button>
    <button class="toolbar-btn" onclick={() => saveSlotsOpen.set(true)} disabled={!hasFile} title="存档管理">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
    <button class="toolbar-btn" onclick={toggleSettings} title="设置">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
  </div>

  <div class="toolbar-spacer"></div>

  <button class="toolbar-btn collapse-btn" onclick={collapseToolbar} title="折叠工具栏">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  </button>
</div>
{:else}
<div class="toolbar-collapsed">
  <button class="toolbar-btn expand-btn" onclick={() => toolbarOpen.set(true)} title="展开工具栏">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  </button>
</div>
{/if}

<style>
  .toolbar {
    display: flex;
    align-items: center;
    height: var(--toolbar-height);
    background: var(--acrylic-bg);
    border-bottom: 1px solid var(--color-toolbar-border);
    padding: 0 8px;
    gap: 2px;
    flex-shrink: 0;
  }

  .toolbar-collapsed {
    display: flex;
    align-items: center;
    height: 24px;
    background: var(--acrylic-bg);
    border-bottom: 1px solid var(--color-toolbar-border);
    padding: 0 8px;
    flex-shrink: 0;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .toolbar-separator {
    width: 1px;
    height: 18px;
    background: var(--color-border);
    margin: 0 6px;
  }

  .toolbar-spacer {
    flex: 1;
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    color: var(--color-btn-icon);
    transition: all 120ms ease;
  }

  .toolbar-btn:hover {
    color: var(--color-btn-icon-hover);
    background: var(--color-btn-bg-hover);
  }

  .toolbar-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .toolbar-btn:disabled:hover {
    background: none;
    color: var(--color-btn-icon);
  }
</style>
