<script lang="ts">
  import { EXTENSION_OPTIONS } from '$lib/utils/fileTypes';
  import type { FileType } from '$lib/types';

  let { onConfirm, onCancel }: {
    onConfirm: (filename: string, ext: string, fileType: FileType, initialContent?: string) => void;
    onCancel: () => void;
  } = $props();

  let fileName = $state('');
  let selectedExt = $state('.md');
  let customExt = $state('');
  let showCustom = $state(false);
  let customInputEl: HTMLInputElement | null = $state(null);
  let inputEl: HTMLInputElement;

  const templates: { label: string; ext: string; icon: string; content: string }[] = [
    { label: 'Markdown', ext: '.md', icon: '📝', content: '# \n\n' },
    { label: 'JavaScript', ext: '.js', icon: '📜', content: '' },
    { label: 'TypeScript', ext: '.ts', icon: '📘', content: '' },
    { label: 'HTML', ext: '.html', icon: '🌐', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>\n' },
    { label: 'CSS', ext: '.css', icon: '🎨', content: '' },
    { label: 'JSON', ext: '.json', icon: '📋', content: '{\n  \n}\n' },
  ];

  function handleConfirm() {
    const name = fileName.trim() || 'untitled';
    if (showCustom && customExt) {
      const ext = customExt.startsWith('.') ? customExt : '.' + customExt;
      const baseName = name.includes('.') ? name : name + ext;
      onConfirm(baseName, ext, getFileType(ext));
    } else {
      const template = templates.find(t => t.ext === selectedExt);
      const baseName = name.includes('.') ? name : name + selectedExt;
      onConfirm(baseName, selectedExt, getFileType(selectedExt), template?.content);
    }
  }

  function getFileType(ext: string): FileType {
    const option = EXTENSION_OPTIONS.find(o => o.ext === ext);
    return option?.fileType || 'PlainText';
  }

  function selectTemplate(ext: string) {
    selectedExt = ext;
    showCustom = false;
    customExt = '';
    if (!fileName.trim()) {
      const names: Record<string, string> = { '.md': 'document', '.js': 'script', '.ts': 'types', '.html': 'index', '.css': 'style', '.json': 'data' };
      fileName = names[ext] || 'untitled';
    }
    inputEl?.focus();
  }

  function selectCustom() {
    showCustom = true;
    selectedExt = '';
    if (!fileName.trim()) {
      fileName = 'untitled';
    }
    setTimeout(() => customInputEl?.focus(), 50);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { handleConfirm(); }
    else if (e.key === 'Escape') { onCancel(); }
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) { onCancel(); }
  }

  let displayExt = $derived(showCustom && customExt ? (customExt.startsWith('.') ? customExt : '.' + customExt) : selectedExt);
</script>

<div class="modal-overlay" onclick={handleOverlayClick} role="dialog" aria-modal="true" tabindex="-1" onkeydown={handleKeydown}>
  <div class="modal">
    <div class="modal-header">
      <h3>新建文件</h3>
      <button class="close-btn" onclick={onCancel} title="关闭">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label for="filename">文件名称</label>
        <div class="input-row">
          <input
            id="filename"
            type="text"
            bind:this={inputEl}
            bind:value={fileName}
            placeholder="untitled"
            class="name-input"
          />
          <span class="ext-preview">{displayExt}</span>
        </div>
      </div>
      <div class="field">
        <span class="field-label">快捷模板</span>
        <div class="template-grid">
          {#each templates as t}
            <button
              class="template-btn"
              class:active={!showCustom && selectedExt === t.ext}
              onclick={() => selectTemplate(t.ext)}
            >
              <span class="template-icon">{t.icon}</span>
              <span class="template-label">{t.label}</span>
            </button>
          {/each}
          <button
            class="template-btn custom-btn"
            class:active={showCustom}
            onclick={selectCustom}
          >
            <span class="template-icon">📄</span>
            <span class="template-label">自定义</span>
          </button>
        </div>
      </div>

      {#if showCustom}
        <div class="field">
          <label for="customext">自定义后缀</label>
          <div class="input-row">
            <input
              id="customext"
              type="text"
              bind:this={customInputEl}
              bind:value={customExt}
              placeholder=".rs / .vue / .py ..."
              class="name-input ext-input"
            />
          </div>
        </div>
      {/if}

      <div class="preview-name">
        将创建 <strong>{fileName || 'untitled'}<span class="ext">{displayExt}</span></strong>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-cancel" onclick={onCancel}>取消</button>
      <button class="btn-create" onclick={handleConfirm}>创建</button>
    </div>
  </div>
</div>

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

  .modal {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-elevated);
    width: 420px;
    max-width: 90vw;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-ink);
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

  .modal-body {
    padding: 20px;
  }

  .field { margin-bottom: 16px; }
  .field:last-of-type { margin-bottom: 0; }

  .field label, .field-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-slate);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .name-input {
    flex: 1;
    padding: 9px 12px;
    font-size: 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-ink);
    transition: border-color 120ms ease;
  }

  .name-input:focus {
    border-color: var(--color-accent);
  }

  .ext-input {
    border-radius: var(--radius-sm) !important;
  }

  .ext-preview {
    padding: 9px 14px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-accent);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-left: none;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    font-family: var(--font-mono);
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .template-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 6px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-btn-icon);
    transition: all 120ms ease;
    font-size: 11px;
  }

  .template-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-btn-icon-hover);
  }

  .template-btn.active {
    border-color: var(--color-accent);
    background: rgba(79, 193, 255, 0.08);
    color: var(--color-accent);
  }

  .custom-btn.active {
    border-color: var(--color-accent);
    background: rgba(79, 193, 255, 0.08);
    color: var(--color-accent);
  }

  .template-icon { font-size: 18px; }
  .template-label { font-weight: 500; }

  .preview-name {
    margin-top: 16px;
    padding: 10px 14px;
    background: var(--color-bg);
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--color-slate);
    text-align: center;
  }

  .preview-name strong {
    color: var(--color-ink);
    font-weight: 500;
  }

  .preview-name .ext {
    color: var(--color-accent);
    font-family: var(--font-mono);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--color-border);
  }

  .btn-cancel {
    padding: 7px 18px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-btn-icon);
    border-radius: var(--radius-sm);
    transition: all 120ms ease;
  }

  .btn-cancel:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .btn-create {
    padding: 7px 22px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-ink);
    background: var(--color-accent);
    border-radius: var(--radius-sm);
    transition: background 120ms ease;
  }

  .btn-create:hover {
    background: var(--color-accent-hover);
  }
</style>
