<script lang="ts">
  import DOMPurify from 'dompurify';
  import { markedInstance, processLatex, processMermaid } from '$lib/utils/markdown';

  let {
    content,
    visible = $bindable(false),
    onScroll,
    hoverEl = $bindable(null as HTMLDivElement | null),
  }: {
    content: string;
    visible?: boolean;
    onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
    hoverEl?: HTMLDivElement | null;
  } = $props();

  let rawHtml = $derived(markedInstance.parse(content) as string);
  let processedHtml = $derived(processMermaid(processLatex(rawHtml)));
  let safeHtml = $derived(DOMPurify.sanitize(processedHtml, {
    ADD_TAGS: ['svg', 'path', 'circle', 'line', 'rect', 'polyline', 'polygon', 'ellipse', 'g', 'defs', 'marker', 'text', 'tspan', 'foreignObject', 'div'],
    ADD_ATTR: ['d', 'viewBox', 'stroke', 'stroke-width', 'fill', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'marker-end', 'marker-start', 'text-anchor', 'dominant-baseline', 'font-size', 'font-family', 'font-weight', 'text-align', 'id', 'class', 'style'],
  }));

  let offsetX = $state(16);
  let offsetY = $state(16);
  let isDragging = $state(false);
  let dragStartX = $state(0);
  let dragStartY = $state(0);
  let initialOffsetX = $state(0);
  let initialOffsetY = $state(0);
  let hoverSavedRatio = 0;

  $effect.pre(() => {
    if (hoverEl) {
      const max = hoverEl.scrollHeight - hoverEl.clientHeight;
      if (max > 0) hoverSavedRatio = hoverEl.scrollTop / max;
    }
  });

  $effect(() => {
    const _ = safeHtml;
    const el = hoverEl;
    if (!el) return;
    requestAnimationFrame(() => {
      if (!el || !el.isConnected) return;
      const pres = el.querySelectorAll<HTMLElement>('pre:not(.mermaid)');
      pres.forEach((pre) => {
        if (pre.querySelector('.hover-lang-label')) return;
        const code = pre.querySelector('code');
        if (!code) return;
        const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
        if (!langClass) return;
        const lang = langClass.replace('language-', '');
        if (!lang) return;
        const label = document.createElement('span');
        label.className = 'hover-lang-label';
        label.textContent = lang;
        if (getComputedStyle(pre).position === 'static') {
          pre.style.position = 'relative';
        }
        pre.appendChild(label);
      });

      if (hoverSavedRatio <= 0) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max > 0 && hoverSavedRatio > 0) {
        el.scrollTop = hoverSavedRatio * max;
      }
    });
  });

  function startDrag(e: MouseEvent) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialOffsetX = offsetX;
    initialOffsetY = offsetY;
    e.preventDefault();
  }

  function onDrag(e: MouseEvent) {
    if (!isDragging) return;
    offsetX = initialOffsetX + (dragStartX - e.clientX);
    offsetY = initialOffsetY + (dragStartY - e.clientY);
    offsetX = Math.max(0, Math.min(offsetX, window.innerWidth - 360));
    offsetY = Math.max(0, Math.min(offsetY, window.innerHeight - 320));
  }

  function stopDrag() {
    isDragging = false;
  }
</script>

<svelte:window onmousemove={onDrag} onmouseup={stopDrag} />

{#if visible}
<div class="hover-overlay" style="right: {offsetX}px; bottom: {offsetY}px;" class:active={isDragging}>
  <div class="hover-header" onmousedown={startDrag} role="toolbar" tabindex="0">
    <span class="hover-title">实时预览</span>
    <button class="hover-close" onclick={() => visible = false} title="关闭悬浮预览">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
  <div class="hover-body markdown-body" onscroll={() => {
    if (hoverEl) {
      const max = hoverEl.scrollHeight - hoverEl.clientHeight;
      if (max > 0) hoverSavedRatio = hoverEl.scrollTop / max;
    }
    if (onScroll && hoverEl) {
      onScroll(hoverEl.scrollTop, hoverEl.scrollHeight, hoverEl.clientHeight);
    }
  }} bind:this={hoverEl}>
    {@html safeHtml}
  </div>
</div>
{/if}

<style>
  .hover-overlay {
    position: fixed;
    width: 360px;
    height: 300px;
    z-index: 100;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0.65;
    transition: opacity 150ms ease;
  }

  .hover-overlay:hover,
  .hover-overlay.active {
    opacity: 1;
  }

  .hover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    cursor: move;
    flex-shrink: 0;
    user-select: none;
  }

  .hover-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-slate);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .hover-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--color-btn-icon);
    transition: color 120ms ease, background 120ms ease;
  }

  .hover-close:hover {
    color: var(--color-btn-icon-hover);
    background: var(--color-btn-bg-hover);
  }

  .hover-body {
    flex: 1;
    overflow-y: auto;
    padding: 10px 14px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-text-secondary);
  }

  .hover-body :global(h1) { font-size: 1.4em; margin: 0.8em 0 0.3em; color: var(--color-ink); }
  .hover-body :global(h2) { font-size: 1.15em; margin: 0.7em 0 0.3em; color: var(--color-ink); }
  .hover-body :global(h3) { font-size: 1em; margin: 0.6em 0 0.3em; color: var(--color-ink); }
  .hover-body :global(p) { margin: 0 0 0.6em; }
  .hover-body :global(pre) { background: var(--color-preview-code-bg); padding: 8px; overflow-x: auto; margin: 0 0 0.6em; font-size: 11px; }
  .hover-body :global(code) { font-family: var(--font-mono); font-size: 0.85em; }
  .hover-body :global(a) { color: var(--color-accent); }
  .hover-body :global(blockquote) { border-left: 3px solid var(--color-accent); margin: 0 0 0.6em; padding: 0.3em 0.8em; color: var(--color-slate); background: var(--color-bg); }
  .hover-body :global(ul), .hover-body :global(ol) { padding-left: 1.5em; margin: 0 0 0.6em; }
  .hover-body :global(table) { font-size: 11px; }
  .hover-body :global(th), .hover-body :global(td) { border: 1px solid var(--color-border); padding: 3px 6px; }
  .hover-body :global(hr) { border: none; border-top: 1px solid var(--color-border); margin: 0.6em 0; }
  .hover-body :global(img) { max-width: 100%; }
  .hover-body :global(.mermaid-container) { margin: 0.4em 0; text-align: center; }
  .hover-body :global(.mermaid-container svg) { max-width: 100%; height: auto; }
  .hover-body :global(.katex-block) { margin: 0.4em 0; text-align: center; }
  .hover-body :global(.hover-lang-label) {
    position: absolute;
    top: 0;
    left: 0;
    padding: 1px 6px;
    font-size: 9px;
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-slate);
    background: var(--color-border);
    border-bottom-right-radius: 3px;
    text-transform: lowercase;
    letter-spacing: 0.2px;
    line-height: 1.6;
    pointer-events: none;
    user-select: none;
  }
</style>
