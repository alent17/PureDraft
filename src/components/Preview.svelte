<script lang="ts">
  import DOMPurify from 'dompurify';
  import { markedInstance, processLatex, processMermaid } from '$lib/utils/markdown';
  import { mode } from '$lib/stores/ui';
  import SearchBar from './SearchBar.svelte';
  import mermaid from 'mermaid';
  import katex from 'katex';

  $effect(() => {
    if (typeof document !== 'undefined') {
      let link = document.getElementById('katex-css') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.id = 'katex-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
        document.head.appendChild(link);
      }
    }
  });

  let {
    content,
    onSearch,
    onScroll,
    onTaskToggle,
    previewEl = $bindable(null as HTMLDivElement | null),
  }: {
    content: string;
    onSearch?: () => void;
    onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
    onTaskToggle?: (lineIndex: number, checked: boolean) => void;
    previewEl?: HTMLDivElement | null;
  } = $props();

  let searchVisible = $state(false);
  let savedRatio = 0;
  function injectTaskLineNumbers(html: string, source: string): string {
    const taskLines: number[] = [];
    const sourceLines = source.split('\n');
    for (let i = 0; i < sourceLines.length; i++) {
      if (/^[\s>]*- \[[ x]\] /.test(sourceLines[i])) {
        taskLines.push(i);
      }
    }
    if (taskLines.length === 0) return html;
    let idx = 0;
    return html.replace(
      /<input type="checkbox" class="task-list-item-checkbox"/g,
      () => {
        const line = idx < taskLines.length ? taskLines[idx] : -1;
        idx++;
        return `<input data-line="${line}" type="checkbox" class="task-list-item-checkbox"`;
      }
    );
  }

  let rawHtml = $derived(markedInstance.parse(content) as string);
  let htmlWithLines = $derived(injectTaskLineNumbers(rawHtml, content));
  let processedHtml = $derived(processMermaid(processLatex(htmlWithLines)));
  let safeHtml = $derived(DOMPurify.sanitize(processedHtml, {
    ADD_TAGS: ['svg', 'path', 'circle', 'line', 'rect', 'polyline', 'polygon', 'ellipse', 'g', 'defs', 'marker', 'text', 'tspan', 'foreignObject', 'div'],
    ADD_ATTR: ['d', 'viewBox', 'stroke', 'stroke-width', 'fill', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'marker-end', 'marker-start', 'text-anchor', 'dominant-baseline', 'font-size', 'font-family', 'font-weight', 'text-align', 'id', 'class', 'style', 'src', 'alt', 'width', 'height', 'data-line'],
  }));

  let searchHighlights = $state<Range[]>([]);
  let currentHighlightIndex = $state(0);
  let searchQuery = $state('');

  function handleCtrlF() {
    if (onSearch) {
      onSearch();
    }
    searchVisible = !searchVisible;
  }

  function initMermaid() {
    if (!previewEl) return;
    const mermaidEls = previewEl.querySelectorAll<HTMLElement>('pre.mermaid');
    if (mermaidEls.length === 0) return;

    try {
      const isDark = $mode === 'dark';
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });

      mermaidEls.forEach(async (el) => {
        try {
          const code = el.textContent || '';
          const { svg } = await mermaid.render(el.id + '-svg', code);
          const container = el.parentElement;
          if (container) {
            container.innerHTML = svg;
          }
        } catch {
          el.classList.add('mermaid-error');
        }
      });
    } catch {
      // Mermaid rendering failed
    }
  }

  function initKaTeX() {
    if (!previewEl) return;

    const katexContainers = previewEl.querySelectorAll('.katex-block, .katex-inline');
    if (katexContainers.length === 0) return;

    for (const container of katexContainers) {
      const code = container.querySelector('code');
      if (!code) continue;

      try {
        const formula = code.textContent || '';
        const isBlock = container.classList.contains('katex-block');
        const rendered = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: isBlock,
          trust: true,
        });
        container.innerHTML = rendered;
      } catch {
        // Keep fallback display
      }
    }
  }

  function attachTaskHandlers() {
    if (!previewEl) return;
    const checkboxes = previewEl.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"].task-list-item-checkbox'
    );
    checkboxes.forEach((cb) => {
      if (cb.dataset.lineBound) return;
      cb.dataset.lineBound = '1';

      cb.addEventListener('change', () => {
        const lineStr = cb.getAttribute('data-line');
        if (lineStr !== null && onTaskToggle) {
          onTaskToggle(parseInt(lineStr), cb.checked);
        }
      });
    });
  }

  function attachCopyButtons() {
    if (!previewEl) return;
    const pres = previewEl.querySelectorAll<HTMLElement>('pre:not(.mermaid)');
    pres.forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
      btn.title = '复制代码';

      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.textContent || pre.textContent || '';
        try {
          await navigator.clipboard.writeText(code);
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4FC1FF" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
          btn.classList.add('copied');
          setTimeout(() => {
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
            btn.classList.remove('copied');
          }, 2000);
        } catch {
          // clipboard failed
        }
      });

      const parent = pre.parentElement || pre;
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      pre.style.position = 'relative';
      pre.appendChild(btn);
    });
  }

  function attachLanguageLabels() {
    if (!previewEl) return;
    const pres = previewEl.querySelectorAll<HTMLElement>('pre:not(.mermaid)');
    pres.forEach((pre) => {
      if (pre.querySelector('.lang-label')) return;

      const code = pre.querySelector('code');
      if (!code) return;

      const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
      if (!langClass) return;

      const lang = langClass.replace('language-', '');
      if (!lang) return;

      const label = document.createElement('span');
      label.className = 'lang-label';
      label.textContent = lang;

      if (getComputedStyle(pre).position === 'static') {
        pre.style.position = 'relative';
      }
      pre.appendChild(label);
    });
  }

  $effect.pre(() => {
    if (previewEl) {
      const max = previewEl.scrollHeight - previewEl.clientHeight;
      if (max > 0) savedRatio = previewEl.scrollTop / max;
    }
  });

  $effect(() => {
    if (previewEl && safeHtml) {
      requestAnimationFrame(() => {
        initMermaid();
        initKaTeX();
        attachTaskHandlers();
        attachCopyButtons();
        attachLanguageLabels();
      });
    }
  });

  $effect(() => {
    const _ = safeHtml;
    const el = previewEl;
    if (!el || savedRatio <= 0) return;
    queueMicrotask(() => {
      if (!el || !el.isConnected) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max > 0 && savedRatio > 0) {
        el.scrollTop = savedRatio * max;
      }
    });
  });

  function handlePreviewScroll() {
    if (!previewEl) return;
    const max = previewEl.scrollHeight - previewEl.clientHeight;
    if (max > 0) savedRatio = previewEl.scrollTop / max;
    if (onScroll) {
      onScroll(previewEl.scrollTop, previewEl.scrollHeight, previewEl.clientHeight);
    }
  }

  function doPreviewSearch(query: string) {
    if (!previewEl || !query) {
      clearHighlights();
      return;
    }

    clearHighlights();
    searchQuery = query;

    const ranges: Range[] = [];
    const walker = document.createTreeWalker(previewEl, NodeFilter.SHOW_TEXT, null);

    const regex = new RegExp(escapeRegex(query), 'gi');
    let node: Text | null;

    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent || '';
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;

      while ((match = regex.exec(text)) !== null) {
        try {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          ranges.push(range);
        } catch {
          // Skip invalid ranges
        }
      }
    }

    searchHighlights = ranges;
    if (ranges.length > 0) {
      currentHighlightIndex = 0;
      highlightRange(ranges[0]);
    }
  }

  function clearHighlights() {
    searchHighlights.forEach(r => {
      const parent = r.startContainer.parentElement;
      if (parent) {
        parent.normalize();
      }
    });
    searchHighlights = [];
    currentHighlightIndex = 0;
    searchQuery = '';
  }

  function highlightRange(range: Range) {
    if (!previewEl) return;
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
      range.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function nextHighlight() {
    if (searchHighlights.length === 0) return;
    currentHighlightIndex = (currentHighlightIndex + 1) % searchHighlights.length;
    highlightRange(searchHighlights[currentHighlightIndex]);
  }

  function prevHighlight() {
    if (searchHighlights.length === 0) return;
    currentHighlightIndex = currentHighlightIndex <= 0 ? searchHighlights.length - 1 : currentHighlightIndex - 1;
    highlightRange(searchHighlights[currentHighlightIndex]);
  }

  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
</script>

<svelte:window onkeydown={(e) => { if (e.ctrlKey && e.key === 'f') { e.preventDefault(); handleCtrlF(); }}} />

<div class="preview-wrapper" bind:this={previewEl} onscroll={handlePreviewScroll}>
  <SearchBar bind:visible={searchVisible} onCtrlF={handleCtrlF} />
  {#if searchVisible}
    <div class="preview-search-bar">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          class="search-input"
          placeholder="搜索预览内容..."
          oninput={(e) => doPreviewSearch((e.target as HTMLInputElement).value)}
          onkeydown={(e) => {
            if (e.key === 'Enter') { e.shiftKey ? prevHighlight() : nextHighlight(); }
            else if (e.key === 'Escape') { searchVisible = false; clearHighlights(); }
          }}
        />
        {#if searchHighlights.length > 0}
          <span class="match-count">{currentHighlightIndex + 1}/{searchHighlights.length}</span>
        {/if}
      </div>
      <div class="search-nav">
        <button class="nav-btn" onclick={prevHighlight} title="上一个">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
        <button class="nav-btn" onclick={nextHighlight} title="下一个">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <button class="close-btn" onclick={() => { searchVisible = false; clearHighlights(); }} title="关闭">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  {/if}
  <div class="preview markdown-body">
    {@html safeHtml}
  </div>
</div>

<style>
  .preview-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-anchor: none;
    background: var(--acrylic-content-bg);
  }

  .preview {
    padding: 24px 32px;
    max-width: 800px;
    margin: 0 auto;
    min-height: 100%;
  }

  .preview-search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 6px;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0 8px;
  }

  .search-input-wrapper:focus-within {
    border-color: var(--color-accent);
  }

  .search-icon {
    color: var(--color-btn-icon);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 13px;
    color: var(--color-ink);
    padding: 6px 0;
    outline: none;
  }

  .match-count {
    font-size: 12px;
    color: var(--color-slate);
    white-space: nowrap;
  }

  .search-nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nav-btn, .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--radius-sm);
    color: var(--color-btn-icon);
    transition: all 150ms ease;
  }

  .nav-btn:hover, .close-btn:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .preview :global(*) {
    user-select: text;
  }

  .preview :global(h1) {
    font-size: 2em;
    font-weight: 700;
    margin: 1.5em 0 0.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-ink);
  }

  .preview :global(h2) {
    font-size: 1.5em;
    font-weight: 700;
    margin: 1.3em 0 0.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--color-border);
    color: var(--color-ink);
  }

  .preview :global(h3) {
    font-size: 1.25em;
    font-weight: 600;
    margin: 1.2em 0 0.4em;
    color: var(--color-ink);
  }

  .preview :global(h4),
  .preview :global(h5),
  .preview :global(h6) {
    font-size: 1em;
    font-weight: 600;
    margin: 1em 0 0.4em;
    color: var(--color-ink);
  }

  .preview :global(p) {
    margin: 0 0 1em;
    line-height: 1.6;
    color: var(--color-text-secondary);
  }

  .preview :global(a) {
    color: var(--color-accent);
    text-decoration: none;
  }

  .preview :global(a:hover) {
    text-decoration: underline;
  }

  .preview :global(pre) {
    background: var(--color-preview-code-bg);
    color: var(--color-preview-code-text);
    border-radius: var(--radius-md);
    padding: 16px;
    overflow-x: auto;
    margin: 0 0 1em;
    font-size: 14px;
    line-height: 1.45;
  }

  .preview :global(code) {
    font-family: var(--font-mono);
    font-size: 0.9em;
  }

  .preview :global(p code),
  .preview :global(li code),
  .preview :global(td code) {
    background: var(--color-bg-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 85%;
    color: var(--color-ink);
  }

  .preview :global(blockquote) {
    border-left: 4px solid var(--color-accent);
    margin: 0 0 1em;
    padding: 0.5em 1em;
    color: var(--color-slate);
    background: var(--color-bg-secondary);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
  }

  .preview :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
  }

  .preview :global(th) {
    background: var(--color-bg-secondary);
    font-weight: 600;
    text-align: left;
  }

  .preview :global(th),
  .preview :global(td) {
    border: 1px solid var(--color-border);
    padding: 8px 12px;
  }

  .preview :global(tr:hover) {
    background: rgba(240, 185, 11, 0.03);
  }

  .preview :global(ul),
  .preview :global(ol) {
    padding-left: 2em;
    margin: 0 0 1em;
    color: var(--color-text-secondary);
  }

  .preview :global(li) {
    margin: 0.25em 0;
    line-height: 1.6;
  }

  .preview :global(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 2em 0;
  }

  .preview :global(img) {
    max-width: 100%;
    border-radius: var(--radius-md);
  }

  .preview :global(strong) {
    font-weight: 600;
    color: var(--color-ink);
  }

  .preview :global(.mermaid-container) {
    margin: 1em 0;
    text-align: center;
  }

  .preview :global(.mermaid-container svg) {
    max-width: 100%;
    height: auto;
  }

  .preview :global(.mermaid-error) {
    border: 1px solid var(--color-red, #f6465d);
    border-radius: var(--radius-sm);
    padding: 12px;
    color: var(--color-red, #f6465d);
  }

  .preview :global(.katex-block) {
    margin: 1em 0;
    text-align: center;
    overflow-x: auto;
  }

  .preview :global(.katex-inline) {
    display: inline;
  }

  .preview :global(input[type="checkbox"].task-list-item-checkbox) {
    margin-right: 8px;
    cursor: pointer;
    accent-color: var(--color-accent);
  }

  .preview :global(.copy-btn) {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-btn-icon);
    cursor: pointer;
    opacity: 0;
    transition: opacity 150ms ease, color 150ms ease;
    z-index: 2;
  }

  .preview :global(pre:hover .copy-btn),
  .preview :global(.copy-btn.copied) {
    opacity: 1;
  }

  .preview :global(.copy-btn:hover) {
    color: var(--color-btn-icon-hover);
    background: var(--color-btn-bg-hover);
  }

  .preview :global(.lang-label) {
    position: absolute;
    top: 0;
    left: 0;
    padding: 2px 8px;
    font-size: 10px;
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-slate);
    background: var(--color-border);
    border-bottom-right-radius: 4px;
    text-transform: lowercase;
    letter-spacing: 0.3px;
    line-height: 1.6;
    pointer-events: none;
    user-select: none;
  }
</style>
