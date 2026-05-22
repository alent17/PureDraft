<script lang="ts">
  let {
    title = '重命名',
    defaultValue = '',
    placeholder = '请输入名称',
    confirmText = '确定',
    cancelText = '取消',
    onConfirm,
    onCancel,
  }: {
    title?: string;
    defaultValue?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: (value: string) => void;
    onCancel?: () => void;
  } = $props();

  let inputValue = $state(defaultValue);
  let inputElement: HTMLInputElement | undefined = $state();

  function handleConfirm() {
    const trimmedValue = inputValue?.trim();
    if (trimmedValue) {
      onConfirm?.(trimmedValue);
    }
  }

  function handleCancel() {
    onCancel?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  }

  function handleOverlayClick() {
    handleCancel();
  }

  $effect(() => {
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  });
</script>

<div class="rename-overlay" onclick={handleOverlayClick} role="dialog" aria-modal="true" tabindex="-1" onkeydown={handleKeydown}>
  <div class="rename-dialog" onclick={(e) => e.stopPropagation()}>
    <div class="rename-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </div>
    <h3 class="rename-title">{title}</h3>
    <div class="rename-input-wrapper">
      <input
        type="text"
        class="rename-input"
        bind:value={inputValue}
        bind:this={inputElement}
        {placeholder}
        onkeydown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
      />
    </div>
    <div class="rename-actions">
      <button class="rename-btn cancel-btn" onclick={handleCancel}>
        {cancelText}
      </button>
      <button class="rename-btn confirm-btn" onclick={handleConfirm} disabled={!inputValue?.trim()}>
        {confirmText}
      </button>
    </div>
  </div>
</div>

<style>
  .rename-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 150ms ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .rename-dialog {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 24px;
    min-width: 320px;
    max-width: 400px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    animation: slideUp 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .rename-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    color: var(--color-accent);
  }

  .rename-icon svg {
    width: 48px;
    height: 48px;
    padding: 10px;
    background: rgba(96, 205, 255, 0.1);
    border-radius: 50%;
  }

  .rename-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-ink);
    margin: 0 0 16px 0;
    text-align: center;
  }

  .rename-input-wrapper {
    margin-bottom: 20px;
  }

  .rename-input {
    width: 100%;
    padding: 10px 14px;
    font-size: 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-input-bg, var(--color-bg));
    color: var(--color-ink);
    transition: border-color 120ms ease, box-shadow 120ms ease;
    outline: none;
  }

  .rename-input::placeholder {
    color: var(--color-slate);
  }

  .rename-input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px rgba(96, 205, 255, 0.15);
  }

  .rename-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .rename-btn {
    padding: 8px 20px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    transition: all 120ms ease;
    border: 1px solid var(--color-border);
    background: var(--color-btn-bg);
    color: var(--color-btn-icon);
  }

  .rename-btn:hover:not(:disabled) {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .cancel-btn:hover {
    background: var(--color-btn-bg-hover);
  }

  .confirm-btn {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
  }

  .confirm-btn:hover:not(:disabled) {
    background: var(--color-accent-hover);
    border-color: var(--color-accent-hover);
    color: white;
  }

  .confirm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
