<script lang="ts">
  import { minimizeWindow, toggleMaximize, closeWindow } from '$lib/utils/tauri';
  import { currentFile } from '$lib/stores/file';
  import { isMaximized } from '$lib/stores/ui';

  let max = $state(false);

  async function handleMaximize() {
    const [, result] = await toggleMaximize();
    if (result !== null) {
      max = result;
      isMaximized.set(max);
    }
  }

  function handleDoubleClick() {
    handleMaximize();
  }

  let fileName = $derived(
    $currentFile
      ? ($currentFile.isModified ? '● ' : '') + $currentFile.name
      : 'PureDraft'
  );
</script>

<div class="titlebar" data-tauri-drag-region>
  <div class="titlebar-left">
    <span class="logo">PD</span>
  </div>
  <div class="titlebar-center" data-tauri-drag-region role="presentation" ondblclick={handleDoubleClick}>
    <span class="titlebar-filename" title={$currentFile?.path || ''}>{fileName}</span>
  </div>
  <div class="titlebar-right">
    <button class="window-btn" onclick={() => minimizeWindow()} title="最小化">
      <svg width="12" height="12" viewBox="0 0 12 12"><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="1.2"/></svg>
    </button>
    <button class="window-btn" onclick={handleMaximize} title={max ? '还原' : '最大化'}>
      {#if max}
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <rect x="1.5" y="1.5" width="7" height="7" fill="var(--acrylic-bg-fallback)" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      {:else}
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/>
        </svg>
      {/if}
    </button>
    <button class="window-btn close-btn" onclick={() => closeWindow()} title="关闭">
      <svg width="12" height="12" viewBox="0 0 12 12">
        <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.2"/>
        <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.2"/>
      </svg>
    </button>
  </div>
</div>

<style>
  .titlebar {
    display: flex;
    align-items: center;
    height: var(--titlebar-height);
    background: var(--acrylic-bg-fallback);
    border-bottom: 1px solid var(--color-border);
    box-shadow: var(--shadow-titlebar);
    padding: 0 10px;
    flex-shrink: 0;
    -webkit-app-region: drag;
    z-index: 10;
    position: relative;
  }

  .titlebar-left {
    display: flex;
    align-items: center;
    min-width: 60px;
    -webkit-app-region: no-drag;
  }

  .logo {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-ink);
    background: var(--color-accent);
    padding: 3px 7px;
    letter-spacing: -0.5px;
  }

  .titlebar-center {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-app-region: no-drag;
  }

  .titlebar-filename {
    font-size: 12px;
    color: var(--color-slate);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400px;
  }

  .titlebar-right {
    display: flex;
    align-items: center;
    gap: 0;
    -webkit-app-region: no-drag;
  }

  .window-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 32px;
    color: var(--color-btn-icon);
    transition: background 120ms ease, color 120ms ease;
  }

  .window-btn:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .close-btn:hover {
    background: #E81123;
    color: white;
  }
</style>
