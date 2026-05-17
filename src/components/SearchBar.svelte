<script lang="ts">
  import { searchContent, setSearchResults } from '$lib/utils/search';
  import { createEventDispatcher } from 'svelte';

  let { visible = $bindable(false), editorView = $bindable(null), onCtrlF }: {
    visible?: boolean;
    editorView?: any;
    onCtrlF?: () => void;
  } = $props();

  const dispatch = createEventDispatcher();

  let query = $state('');
  let matchCount = $state(0);
  let currentIndex = $state(0);
  let results: any[] = $state([]);
  let inputEl = $state<HTMLInputElement | null>(null);

  async function doSearch() {
    if (!editorView || !query) {
      matchCount = 0;
      currentIndex = 0;
      results = [];
      editorView?.dispatch({ effects: setSearchResults.of({ results: [], currentIndex: 0 }) });
      return;
    }
    const searchResults = await searchContent(editorView, query);
    results = searchResults;
    matchCount = results.length;
    if (results.length > 0) {
      currentIndex = 0;
      goToMatch(0);
    } else {
      currentIndex = 0;
    }
  }

  function goToMatch(index: number) {
    if (!editorView || results.length === 0) return;
    const result = results[index];
    editorView.dispatch({
      selection: { anchor: result.from, head: result.to },
      scrollIntoView: true,
      effects: setSearchResults.of({ results, currentIndex: index }),
    });
  }

  function nextMatch() {
    if (matchCount > 0) {
      currentIndex = (currentIndex + 1) % matchCount;
      goToMatch(currentIndex);
    }
  }

  function prevMatch() {
    if (matchCount > 0) {
      currentIndex = currentIndex <= 0 ? matchCount - 1 : currentIndex - 1;
      goToMatch(currentIndex);
    }
  }

  function closeSearchBar() {
    editorView?.dispatch({ effects: setSearchResults.of({ results: [], currentIndex: 0 }) });
    visible = false;
    query = '';
    matchCount = 0;
    currentIndex = 0;
    results = [];
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      if (onCtrlF) {
        onCtrlF();
      }
    } else if (e.key === 'Enter') {
      e.shiftKey ? prevMatch() : nextMatch();
    } else if (e.key === 'Escape') {
      closeSearchBar();
      dispatch('dismiss');
    }
  }

  $effect(() => {
    if (query && editorView) {
      doSearch();
    }
  });

  $effect(() => {
    if (visible && inputEl) {
      inputEl.focus();
    }
  });
</script>

{#if visible}
<div class="search-bar">
  <div class="search-input-wrapper">
    <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input
      type="text"
      class="search-input"
      bind:value={query}
      bind:this={inputEl}
      onkeydown={handleKeyDown}
    />
    {#if query}
      <button class="clear-btn" onclick={() => { query = ''; matchCount = 0; }} title="Clear">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    {/if}
  </div>
  
  <div class="search-info">
    {#if matchCount > 0}
      <span class="match-count">{currentIndex + 1}/{matchCount}</span>
      <button class="nav-btn" onclick={prevMatch} title="Previous (Shift+Enter)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
      <button class="nav-btn" onclick={nextMatch} title="Next (Enter)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    {/if}
  </div>
  
  <button class="close-btn" onclick={closeSearchBar} title="Close (Esc)">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
</div>
{/if}

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--acrylic-content-bg);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
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
    transition: border-color 150ms ease;
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

  .search-input::placeholder {
    color: var(--color-slate);
  }

  .clear-btn, .nav-btn, .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: var(--radius-sm);
    color: var(--color-btn-icon);
    transition: all 150ms ease;
    flex-shrink: 0;
  }

  .clear-btn:hover, .nav-btn:hover, .close-btn:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .search-info {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 70px;
  }

  .match-count {
    font-size: 12px;
    color: var(--color-slate);
    min-width: 40px;
    text-align: center;
  }
</style>