<script lang="ts">
  import { currentFile } from '$lib/stores/file';
  import { formatFileSize } from '$lib/utils/fileTypes';
  import { mode, autoSaveInterval, syncStatus } from '$lib/stores/ui';
  import { getDocumentStats } from '$lib/utils/statistics';
  import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';

  let { selectedText = '' }: { selectedText?: string } = $props();

  let fileType = $derived($currentFile?.fileType || 'No file');
  let lineInfo = $derived(
    $currentFile
      ? `Ln ${$currentFile.cursor.line}, Col ${$currentFile.cursor.col}`
      : ''
  );
  let fileSize = $derived(
    $currentFile
      ? formatFileSize(new Blob([$currentFile.content]).size)
      : ''
  );

  let stats = $derived(
    $currentFile ? getDocumentStats($currentFile.content, selectedText) : null
  );

  let wordCountDisplay = $derived(
    stats
      ? (stats.selectedWordCount > 0
        ? `选中 ${stats.selectedWordCount} 字 · 总 ${stats.wordCount} 字`
        : `字数 ${stats.wordCount}`)
      : ''
  );

  let readingTimeDisplay = $derived(
    stats && stats.readingTimeMinutes > 0
      ? `约 ${stats.readingTimeMinutes}min`
      : ''
  );

  let syncDot = $derived($syncStatus === 'error' ? '⨯' : $syncStatus === 'syncing' ? '◉' : '○');
  let syncLabel = $derived($syncStatus === 'error' ? '同步异常' : $syncStatus === 'syncing' ? '同步中' : '同步就绪');

  let autoSaveDisplay = $derived.by(() => {
    if ($autoSaveInterval === 'off') return '';
    const sec = parseInt($autoSaveInterval);
    if (sec < 60) return `自动保存 ${sec}s`;
    return `自动保存 ${sec / 60}min`;
  });
</script>

<div class="statusbar">
  <div class="statusbar-left">
    <span class="status-item">{fileType}</span>
    <span class="divider">|</span>
    <span class="status-item sync-indicator" class:error={$syncStatus === 'error'} class:syncing={$syncStatus === 'syncing'}>
      {syncDot} {syncLabel}
    </span>
    {#if $autoSaveInterval !== 'off'}
      <span class="divider">|</span>
      <span class="status-item auto-save">{autoSaveDisplay}</span>
    {/if}
  </div>
  <div class="statusbar-center">
    {#if stats}
      {#if stats.selectedWordCount > 0}
        <span class="status-item">选中 <AnimatedNumber value={stats.selectedWordCount} /> 字 · 总 <AnimatedNumber value={stats.wordCount} /> 字</span>
      {:else}
        <span class="status-item">字数 <AnimatedNumber value={stats.wordCount} /></span>
      {/if}
    {/if}
    {#if readingTimeDisplay}
      <span class="divider">|</span>
      <span class="status-item">{readingTimeDisplay}</span>
    {/if}
  </div>
  <div class="statusbar-right">
    <span class="status-item mode-badge">{$mode === 'dark' ? '🌙' : '☀️'} {$mode === 'dark' ? 'Dark' : 'Light'}</span>
    <span class="divider">|</span>
    <span class="status-item">UTF-8</span>
    {#if lineInfo}
      <span class="divider">|</span>
      <span class="status-item">{lineInfo}</span>
    {/if}
    {#if fileSize}
      <span class="divider">|</span>
      <span class="status-item">{fileSize}</span>
    {/if}
  </div>
</div>

<style>
  .statusbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--statusbar-height);
    background: var(--acrylic-statusbar-bg);
    padding: 0 12px;
    flex-shrink: 0;
    box-shadow: var(--shadow-statusbar);
    position: relative;
    z-index: 10;
  }

  .statusbar-left,
  .statusbar-center,
  .statusbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .statusbar-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .status-item {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 400;
  }

  .sync-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sync-indicator.syncing {
    color: var(--color-btn-icon-active);
  }

  .sync-indicator.syncing :global(*) {
    animation: sync-pulse 1.2s ease-in-out infinite;
  }

  .sync-indicator.error {
    color: var(--color-error-text);
  }

  .auto-save {
    opacity: 0.7;
  }

  .mode-badge {
    font-size: 10px;
    opacity: 0.8;
  }

  .divider {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.35);
  }

  @keyframes sync-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
