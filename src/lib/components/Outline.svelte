<script lang="ts">
  import { activeTab, sidebarTab } from '$lib/stores/ui';
  import { isMarkdown } from '$lib/utils/fileTypes';
  import type { FileType } from '$lib/types';

  let {
    content,
    fileType,
    onNavigateToLine,
  }: {
    content: string;
    fileType: FileType;
    onNavigateToLine: (lineNumber: number) => void;
  } = $props();

  interface Heading {
    level: number;
    text: string;
    line: number;
    id: string;
  }

  let headings = $derived.by(() => {
    if (!content || !isMarkdown(fileType)) return [];

    const lines = content.split('\n');
    const result: Heading[] = [];
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        result.push({
          level: match[1].length,
          text,
          line: i + 1,
          id: id || `heading-${i}`,
        });
      }
    }
    return result;
  });

  let activeHeadingId = $state('');

  function isHeadingActive(heading: Heading, isInPreview: boolean): boolean {
    if (!isInPreview) return false;
    return activeHeadingId === heading.id;
  }
</script>

{#if headings.length > 0}
<div class="outline">
  <div class="outline-header">
    <span class="outline-title">大纲</span>
    <span class="outline-count">{headings.length}</span>
  </div>
  <div class="outline-content">
    {#each headings as heading}
      <button
        class="outline-item"
        class:active={isHeadingActive(heading, $activeTab === 'preview')}
        style="padding-left: {12 + (heading.level - 1) * 14}px"
        onclick={() => onNavigateToLine(heading.line)}
        title={heading.text}
      >
        <span class="outline-bullet" class:level-1={heading.level === 1} class:level-2={heading.level === 2}>
          {heading.level <= 2 ? '◆' : '◇'}
        </span>
        <span class="outline-text">{heading.text}</span>
        <span class="outline-line-num">L{heading.line}</span>
      </button>
    {/each}
  </div>
</div>
{:else}
<div class="outline">
  <div class="outline-header">
    <span class="outline-title">大纲</span>
    <span class="outline-count">0</span>
  </div>
  <div class="outline-empty">
    <p>暂无标题</p>
    <p class="hint">使用 # 创建标题以生成大纲</p>
  </div>
</div>
{/if}

<style>
  .outline {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .outline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border);
  }

  .outline-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-slate);
    letter-spacing: 0.5px;
  }

  .outline-count {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-slate);
    background: var(--color-bg-secondary);
    padding: 1px 6px;
    border-radius: 8px;
  }

  .outline-content {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .outline-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 5px 12px 5px 12px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    color: var(--color-btn-icon);
    transition: background 150ms ease, color 150ms ease;
  }

  .outline-item:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .outline-item.active {
    background: var(--color-bg-active);
    color: var(--color-accent);
  }

  .outline-bullet {
    font-size: 6px;
    flex-shrink: 0;
    opacity: 0.5;
  }

  .outline-bullet.level-1 {
    font-size: 7px;
    opacity: 0.8;
    color: var(--color-accent);
  }

  .outline-bullet.level-2 {
    font-size: 6px;
    opacity: 0.6;
  }

  .outline-text {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .outline-line-num {
    font-size: 10px;
    color: var(--color-border);
    flex-shrink: 0;
  }

  .outline-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
    text-align: center;
  }

  .outline-empty p {
    color: var(--color-slate);
    font-size: 13px;
    margin: 0;
  }

  .outline-empty .hint {
    font-size: 12px;
    margin-top: 8px;
    opacity: 0.7;
  }
</style>
