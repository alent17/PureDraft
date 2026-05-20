<script lang="ts">
  let {
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    danger = false,
    onConfirm,
    onCancel,
  }: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  } = $props();

  function handleConfirm() {
    onConfirm?.();
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
</script>

<div class="confirm-overlay" onclick={handleCancel} role="dialog" aria-modal="true" tabindex="-1" onkeydown={handleKeydown}>
  <div class="confirm-dialog" onclick={(e) => e.stopPropagation()}>
    <div class="confirm-icon">
      {#if danger}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18"/>
          <path d="M6 6l12 12"/>
        </svg>
      {:else}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 16 12 10 16 14"/>
          <line x1="8" y1="14" x2="12" y2="18"/>
        </svg>
      {/if}
    </div>
    <h3 class="confirm-title">{title}</h3>
    <p class="confirm-message">{message}</p>
    <div class="confirm-actions">
      <button class="confirm-btn cancel-btn" onclick={handleCancel}>
        {cancelText}
      </button>
      <button class="confirm-btn confirm-btn-primary" class:danger={danger} onclick={handleConfirm}>
        {confirmText}
      </button>
    </div>
  </div>
</div>

<style>
  .confirm-overlay {
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

  .confirm-dialog {
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

  .confirm-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    color: var(--color-slate);
  }

  .confirm-icon svg {
    width: 48px;
    height: 48px;
    padding: 8px;
    background: var(--color-btn-bg-hover);
    border-radius: 50%;
  }

  .confirm-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-ink);
    margin: 0 0 8px 0;
    text-align: center;
  }

  .confirm-message {
    font-size: 13px;
    color: var(--color-slate);
    margin: 0 0 20px 0;
    text-align: center;
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .confirm-btn {
    padding: 8px 20px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    transition: all 120ms ease;
    border: 1px solid var(--color-border);
    background: var(--color-btn-bg);
    color: var(--color-btn-icon);
  }

  .confirm-btn:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .confirm-btn-primary {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
  }

  .confirm-btn-primary:hover {
    background: var(--color-accent-hover);
    border-color: var(--color-accent-hover);
    color: white;
  }

  .confirm-btn-primary.danger {
    background: #e5534b;
    border-color: #e5534b;
  }

  .confirm-btn-primary.danger:hover {
    background: #c4453c;
    border-color: #c4453c;
  }
</style>