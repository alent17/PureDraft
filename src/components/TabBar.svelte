<script lang="ts">
  import type { FileType } from '$lib/types';
  import { isMarkdown } from '$lib/utils/fileTypes';
  import { activeTab, scrollSyncEnabled, hoverPreviewEnabled } from '$lib/stores/ui';

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
</script>

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
