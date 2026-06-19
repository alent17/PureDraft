<script lang="ts">
  import AnimatedNumber from '$lib/components/AnimatedNumber.svelte';
  import { getDocumentStats } from '$lib/utils/statistics';

  let { content, selectedText, cursor }: {
    content: string;
    selectedText: string;
    cursor: { line: number; col: number };
  } = $props();

  let stats = $derived(getDocumentStats(content, selectedText));
  let hasSelection = $derived(selectedText.length > 0);
</script>

<div class="dynamic-island">
  <span class="stat">
    <AnimatedNumber value={stats.wordCount} /> 字
  </span>
  <span class="divider">·</span>
  <span class="stat">
    <AnimatedNumber value={stats.charCount} /> 字符
  </span>
  {#if hasSelection}
    <span class="divider">·</span>
    <span class="stat selection">
      选中 <AnimatedNumber value={stats.selectedWordCount} /> 字
    </span>
  {/if}
  <span class="divider">·</span>
  <span class="stat">
    Ln {cursor.line}, Col {cursor.col}
  </span>
</div>

<style>
  .dynamic-island {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-elevated);
    font-size: 12px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    user-select: none;
    pointer-events: none;
  }

  .stat {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .stat.selection {
    color: var(--color-accent);
  }

  .divider {
    color: var(--color-slate);
    font-size: 10px;
  }
</style>
