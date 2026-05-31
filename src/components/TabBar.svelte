<script lang="ts">
  import type { FileType, OpenFile } from '$lib/types';
  import { isMarkdown } from '$lib/utils/fileTypes';
  import { activeTab, scrollSyncEnabled, hoverPreviewEnabled, openConfirmDialog, closeConfirmDialog } from '$lib/stores/ui';
  import { openFiles, currentFileIndex, closeFile, switchToFile } from '$lib/stores/file';
  import { saveFile } from '$lib/api/file';

  let { fileType }: { fileType: FileType } = $props();

  let showPreview = $derived(isMarkdown(fileType));

  function setTab(tab: 'edit' | 'preview' | 'split') {
    activeTab.set(tab);
  }

  function toggleScrollSync() {
    scrollSyncEnabled.update(v => !v);
  }

  function toggleHoverPreview() {
    hoverPreviewEnabled.update(v => !v);
  }

  function handleFileTabClick(index: number) {
    switchToFile(index);
  }

  function handleCloseTab(index: number, e?: Event) {
    e?.stopPropagation();
    const files = $openFiles;
    const file = files[index];
    if (!file) return;

    if (file.isModified) {
      openConfirmDialog({
        title: '未保存的更改',
        message: `"${file.name}" 有未保存的更改，确定要关闭吗？`,
        danger: true,
        confirmText: '关闭',
        cancelText: '取消',
        onConfirm: async () => {
          closeFile(index);
          closeConfirmDialog();
        },
        onCancel: () => closeConfirmDialog(),
      });
    } else {
      closeFile(index);
    }
  }

  function getTabTitle(file: OpenFile): string {
    return file.isModified ? `● ${file.name}` : file.name;
  }
</script>

{#if $openFiles.length > 0}
<div class="file-tabs">
  {#each $openFiles as file, i (file.path || `new-${i}`)}
    <button
      class="file-tab"
      class:active={$currentFileIndex === i}
      class:modified={file.isModified}
      onclick={() => handleFileTabClick(i)}
      title={file.path || file.name}
    >
      <span class="file-tab-name">{file.name}</span>
      {#if file.isModified}
        <span class="modified-dot"></span>
      {/if}
      <span
        class="file-tab-close"
        onclick={(e) => handleCloseTab(i, e)}
        onkeydown={(e) => { if (e.key === 'Enter') handleCloseTab(i, e); }}
        role="button"
        tabindex="-1"
        title="关闭"
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="2" y1="2" x2="10" y2="10"/>
          <line x1="10" y1="2" x2="2" y2="10"/>
        </svg>
      </span>
    </button>
  {/each}
</div>
{/if}

<div class="tabbar">
  <div class="tabbar-tabs">
    <button
      class="tab"
      class:active={$activeTab === 'edit'}
      onclick={() => setTab('edit')}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      Editor
    </button>
    {#if showPreview}
      <button
        class="tab"
        class:active={$activeTab === 'preview'}
        onclick={() => setTab('preview')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Preview
      </button>
      <button
        class="tab"
        class:active={$activeTab === 'split'}
        onclick={() => setTab('split')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="18" rx="1"/>
          <rect x="14" y="3" width="7" height="18" rx="1"/>
        </svg>
        Split
      </button>
    {/if}
  </div>

  <div class="tabbar-spacer"></div>

  <div class="tabbar-actions">
    <button
      class="action-btn"
      class:active={$scrollSyncEnabled}
      onclick={toggleScrollSync}
      aria-label="滚动同步"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    </button>
    {#if showPreview && $activeTab === 'edit'}
      <button
        class="action-btn"
        class:active={$hoverPreviewEnabled}
        onclick={toggleHoverPreview}
        title="悬浮预览 (Ctrl+Shift+H)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="14" height="14" rx="1"/>
          <rect x="8" y="8" width="14" height="14" rx="1"/>
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .file-tabs {
    display: flex;
    align-items: center;
    height: 34px;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
    scrollbar-width: none;
  }

  .file-tabs::-webkit-scrollbar {
    display: none;
  }

  .file-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 100%;
    padding: 0 12px;
    font-size: 12px;
    color: var(--color-text-secondary);
    border-right: 1px solid var(--color-border);
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 120ms ease;
    position: relative;
    min-width: 0;
  }

  .file-tab:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-ink);
  }

  .file-tab.active {
    background: var(--acrylic-content-bg);
    color: var(--color-ink);
  }

  .file-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--color-accent);
  }

  .file-tab-name {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  .modified-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
  }

  .file-tab-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    color: var(--color-slate);
    opacity: 0;
    flex-shrink: 0;
    transition: all 100ms ease;
  }

  .file-tab:hover .file-tab-close {
    opacity: 1;
  }

  .file-tab-close:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-ink);
  }

  .tabbar {
    display: flex;
    align-items: center;
    height: var(--tabbar-height);
    background: var(--acrylic-content-bg);
    border-bottom: 1px solid var(--color-border);
    padding: 0 10px;
    gap: 2px;
    flex-shrink: 0;
  }

  .tabbar-tabs {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-btn-icon);
    transition: all 120ms ease;
    position: relative;
  }

  .tab:hover {
    color: var(--color-btn-icon-hover);
    background: var(--color-btn-bg-hover);
  }

  .tab.active {
    color: var(--color-ink);
    font-weight: 600;
    background: var(--color-bg-active);
  }

  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 8px;
    right: 8px;
    height: 2px;
    background: var(--color-accent);
  }

  .tabbar-spacer {
    flex: 1;
  }

  .tabbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: var(--color-btn-icon);
    transition: all 120ms ease;
  }

  .action-btn:hover {
    color: var(--color-btn-icon-hover);
    background: var(--color-btn-bg-hover);
  }

  .action-btn.active {
    color: var(--color-btn-icon-active);
    background: var(--color-btn-bg-hover);
  }
</style>
