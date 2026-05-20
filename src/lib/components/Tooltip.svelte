<script lang="ts">
  import { mode } from '$lib/stores/ui';

  let { text = '', shortcut = '', position = 'top', children }: {
    text?: string;
    shortcut?: string;
    position?: 'top' | 'bottom';
    children: any;
  } = $props();

  let visible = $state(false);
  let delayTimer: ReturnType<typeof setTimeout> | null = null;

  function activate() {
    if (delayTimer) clearTimeout(delayTimer);
    delayTimer = setTimeout(() => {
      visible = true;
    }, 240);
  }

  function deactivate() {
    if (delayTimer) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    visible = false;
  }

  $effect(() => {
    return () => {
      if (delayTimer) clearTimeout(delayTimer);
    };
  });
</script>

<span
  class="tooltip-trigger"
  role="presentation"
  onmouseenter={activate}
  onmouseleave={deactivate}
  onfocusin={activate}
  onfocusout={deactivate}
>
  {@render children()}
  {#if visible}
    <span 
      class="tooltip-content" 
      class:tooltip-bottom={position === 'bottom'}
      class:tooltip-dark={$mode === 'dark'}
      class:tooltip-light={$mode === 'light'}
    >
      <span class="tooltip-text">{text}</span>
      {#if shortcut}
        <span class="tooltip-shortcut">{shortcut}</span>
      {/if}
    </span>
  {/if}
</span>

<style>
  .tooltip-trigger {
    position: relative;
    display: inline-flex;
  }

  .tooltip-content {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 6px);
    transform: translateX(-50%) translateY(0);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 400;
    line-height: 1.5;
    white-space: nowrap;
    border-radius: 6px;
    pointer-events: none;
    z-index: 999;
    animation: tooltipIn 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .tooltip-bottom {
    top: calc(100% + 6px);
    bottom: auto;
  }

  /* 暗色模式样式 - 白色背景，黑色文字 */
  .tooltip-dark {
    color: #1e1e1e;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .tooltip-dark .tooltip-text {
    color: #1e1e1e;
  }

  .tooltip-dark .tooltip-shortcut {
    color: #666;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  /* 浅色模式样式 - 黑色背景，白色文字 */
  .tooltip-light {
    color: #ffffff;
    background: rgba(30, 30, 30, 0.94);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .tooltip-light .tooltip-text {
    color: #f0f0f0;
  }

  .tooltip-light .tooltip-shortcut {
    color: #999;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tooltip-shortcut {
    padding: 1px 5px;
    font-size: 10px;
    font-family: var(--font-mono);
    border-radius: 3px;
  }

  @keyframes tooltipIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
</style>
