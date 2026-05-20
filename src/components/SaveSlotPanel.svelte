<script lang="ts">
  import { saveSlotsOpen } from '$lib/stores/ui';
  import { currentFile, currentFileIndex, updateFileContent } from '$lib/stores/file';
  import { get } from 'svelte/store';
  import {
    getSaveSlots,
    deleteSaveSlot,
    loadSaveSlot,
    type SaveSlotMeta,
  } from '$lib/utils/saveSlots';

  let manualSlots = $state<SaveSlotMeta[]>([]);
  let autoSlots = $state<SaveSlotMeta[]>([]);

  $effect(() => {
    if ($saveSlotsOpen && $currentFile?.path) {
      const all = getSaveSlots($currentFile.path);
      manualSlots = all
        .filter((s) => s.type === 'manual')
        .sort((a, b) => b.timestamp - a.timestamp);
      autoSlots = all
        .filter((s) => s.type === 'auto')
        .sort((a, b) => b.timestamp - a.timestamp);
    }
  });

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      saveSlotsOpen.set(false);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      saveSlotsOpen.set(false);
    }
  }

  async function handleRestore(slotId: number) {
    const file = $currentFile;
    if (!file?.path) return;
    const { content } = await loadSaveSlot(file.path, slotId);
    if (content !== null) {
      const idx = get(currentFileIndex);
      if (idx >= 0) {
        updateFileContent(idx, content);
      }
      saveSlotsOpen.set(false);
    }
  }

  async function handleDelete(slotId: number) {
    if (!window.confirm('确定要删除此存档吗？此操作不可撤销。')) return;
    const file = $currentFile;
    if (!file?.path) return;
    await deleteSaveSlot(file.path, slotId);
    const all = getSaveSlots(file.path);
    manualSlots = all.filter((s) => s.type === 'manual').sort((a, b) => b.timestamp - a.timestamp);
    autoSlots = all.filter((s) => s.type === 'auto').sort((a, b) => b.timestamp - a.timestamp);
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
</script>

{#if $saveSlotsOpen}
<div class="modal-overlay" onclick={handleOverlayClick} role="dialog" aria-modal="true" tabindex="-1" onkeydown={handleKeydown}>
  <div class="save-slots-panel">
    <div class="panel-header">
      <h3>存档管理</h3>
      <span class="panel-subtitle">{$currentFile?.name || ''}</span>
      <button class="close-btn" onclick={() => saveSlotsOpen.set(false)} title="关闭">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="panel-body">
      <div class="slot-section">
        <div class="section-header">
          <span class="section-label">手动存档</span>
          <span class="section-count">{manualSlots.length}/5</span>
        </div>
        <div class="slot-list">
          {#each Array(5) as _, i}
            {@const slot = manualSlots[i]}
            <div class="slot-row" class:slot-empty={!slot}>
              <span class="slot-index">#{i + 1}</span>
              {#if slot}
                <div class="slot-info">
                  <span class="slot-time">{formatTime(slot.timestamp)}</span>
                  <span class="slot-meta">{slot.contentLength} 字符</span>
                </div>
                <span class="slot-actions">
                  <button class="slot-btn" onclick={() => handleRestore(slot.slotId)}>恢复</button>
                  <button class="slot-btn slot-btn-del" onclick={() => handleDelete(slot.slotId)}>删除</button>
                </span>
              {:else}
                <span class="slot-desc">空槽位</span>
                <span class="slot-actions"></span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="slot-section">
        <div class="section-header">
          <span class="section-label">自动存档</span>
          <span class="section-count">{autoSlots.length}/5</span>
        </div>
        <div class="slot-list">
          {#each Array(5) as _, i}
            {@const slot = autoSlots[i]}
            <div class="slot-row" class:slot-empty={!slot}>
              <span class="slot-index">#{i + 1}</span>
              {#if slot}
                <div class="slot-info">
                  <span class="slot-time">{formatTime(slot.timestamp)}</span>
                  <span class="slot-meta">{slot.contentLength} 字符</span>
                </div>
                <span class="slot-actions">
                  <button class="slot-btn" onclick={() => handleRestore(slot.slotId)}>恢复</button>
                </span>
              {:else}
                <span class="slot-desc">空槽位</span>
                <span class="slot-actions"></span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .save-slots-panel {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-elevated);
    width: 480px;
    max-width: 90vw;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .panel-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-ink);
  }

  .panel-subtitle {
    font-size: 12px;
    color: var(--color-slate);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    color: var(--color-btn-icon);
    transition: all 120ms ease;
  }

  .close-btn:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .panel-body {
    overflow-y: auto;
    padding: 0;
  }

  .slot-section {
    border-bottom: 1px solid var(--color-border-subtle);
    padding: 16px 20px;
  }

  .slot-section:last-child {
    border-bottom: none;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .section-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-ink);
  }

  .section-count {
    font-size: 11px;
    color: var(--color-slate);
  }

  .slot-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .slot-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    transition: background 100ms ease;
  }

  .slot-row:hover {
    background: var(--color-bg-hover);
  }

  .slot-row.slot-empty {
    opacity: 0.35;
  }

  .slot-index {
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-slate);
    min-width: 28px;
  }

  .slot-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .slot-time {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-ink);
  }

  .slot-meta {
    font-size: 10px;
    color: var(--color-slate);
  }

  .slot-desc {
    flex: 1;
    font-size: 12px;
    color: var(--color-slate);
  }

  .slot-actions {
    display: flex;
    gap: 4px;
  }

  .slot-btn {
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-btn-icon);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition: all 120ms ease;
  }

  .slot-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .slot-btn-del:hover {
    border-color: #E81123;
    color: #E81123;
  }
</style>
