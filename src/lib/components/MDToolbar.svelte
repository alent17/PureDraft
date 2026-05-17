<script lang="ts">
  import { EditorView } from '@codemirror/view';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import type { FileType } from '$lib/types';
  import { isMarkdown } from '$lib/utils/fileTypes';
  import { openImageDialog } from '$lib/utils/tauri';

  let {
    editorView = null as EditorView | null,
    fileType,
  }: {
    editorView: EditorView | null;
    fileType: FileType;
  } = $props();

  let isMD = $derived(isMarkdown(fileType));

  function getSelection(): { text: string; from: number; to: number } | null {
    if (!editorView) return null;
    const sel = editorView.state.selection.main;
    return {
      text: editorView.state.sliceDoc(sel.from, sel.to),
      from: sel.from,
      to: sel.to,
    };
  }

  function insertAtCursor(template: string, placeholder?: string) {
    if (!editorView) return;
    const sel = getSelection();
    let insertText = template;

    if (sel && sel.text) {
      insertText = template.replace('$1', sel.text);
      editorView.dispatch({
        changes: { from: sel.from, to: sel.to, insert: insertText },
      });
    } else {
      const pos = editorView.state.selection.main.head;
      editorView.dispatch({
        changes: { from: pos, insert: insertText },
        selection: placeholder
          ? { anchor: pos + insertText.indexOf(placeholder), head: pos + insertText.indexOf(placeholder) + placeholder.length }
          : undefined,
      });
    }
    editorView.focus();
  }

  function insertBold() { insertAtCursor('**$1**', 'text'); }
  function insertItalic() { insertAtCursor('*$1*', 'text'); }
  function insertStrikethrough() { insertAtCursor('~~$1~~', 'text'); }
  function insertInlineCode() { insertAtCursor('`$1`', 'code'); }
  function insertLink() { insertAtCursor('[$1](url)', 'url'); }
  function insertBlockquote() { insertAtCursor('\n> quote\n', 'quote'); }
  function insertUnorderedList() { insertAtCursor('\n- item\n', 'item'); }
  function insertOrderedList() { insertAtCursor('\n1. item\n', 'item'); }
  function insertTaskList() { insertAtCursor('\n- [ ] task\n', 'task'); }
  function insertDivider() { insertAtCursor('\n---\n'); }
  function insertCodeBlock() { insertAtCursor('\n```lang\ncode\n```\n', 'code'); }

  function insertTable() {
    if (!editorView) return;
    const pos = editorView.state.selection.main.head;
    const table = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n| Cell     | Cell     | Cell     |\n| Cell     | Cell     | Cell     |\n';
    editorView.dispatch({ changes: { from: pos, insert: table } });
    const anchor = pos + table.indexOf('Header 1');
    editorView.dispatch({ selection: { anchor, head: anchor + 8 } });
    editorView.focus();
  }

  async function insertLocalImage() {
    if (!editorView) return;
    const imagePath = await openImageDialog();
    if (!imagePath) return;

    const name = imagePath.split(/[\\/]/).pop() || 'image';
    const assetUrl = convertFileSrc(imagePath);
    const pos = editorView.state.selection.main.head;
    editorView.dispatch({
      changes: { from: pos, insert: `![${name}](${assetUrl})\n` },
    });
    editorView.focus();
  }
</script>

{#if isMD}
<div class="md-toolbar">
  <div class="md-toolbar-group">
    <button class="md-btn" onclick={insertBold} title="加粗">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
      </svg>
    </button>
    <button class="md-btn" onclick={insertItalic} title="斜体">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="19" y1="4" x2="10" y2="4"/>
        <line x1="14" y1="20" x2="5" y2="20"/>
        <line x1="15" y1="4" x2="9" y2="20"/>
      </svg>
    </button>
    <button class="md-btn" onclick={insertStrikethrough} title="删除线">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M17.3 4.9c-1.5-1.9-4.2-2.4-6.2-1.7s-3.5 3.1-3.5 5.6c0 1.7.6 3.2 1.6 4.3"/>
        <path d="M6.7 19.1c1.5 1.9 4.2 2.4 6.2 1.7s3.5-3.1 3.5-5.6c0-1.7-.6-3.2-1.6-4.3"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
      </svg>
    </button>
    <button class="md-btn" onclick={insertInlineCode} title="行内代码">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    </button>
  </div>

  <div class="md-toolbar-separator"></div>

  <div class="md-toolbar-group">
    <button class="md-btn" onclick={insertLink} title="链接">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    </button>
    <button class="md-btn" onclick={insertLocalImage} title="本地图片">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </button>
    <button class="md-btn" onclick={insertBlockquote} title="引用块">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M3 5h3v6H3z"/>
        <path d="M6 5c0 2-3 3-3 5"/>
        <path d="M13 5h3v6h-3z"/>
        <path d="M16 5c0 2-3 3-3 5"/>
        <path d="M3 15h18v2H3z"/>
        <path d="M3 19h18v2H3z"/>
      </svg>
    </button>
  </div>

  <div class="md-toolbar-separator"></div>

  <div class="md-toolbar-group">
    <button class="md-btn" onclick={insertUnorderedList} title="无序列表">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    </button>
    <button class="md-btn" onclick={insertOrderedList} title="有序列表">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="10" y1="6" x2="21" y2="6"/>
        <line x1="10" y1="12" x2="21" y2="12"/>
        <line x1="10" y1="18" x2="21" y2="18"/>
        <path d="M4 6h1v4"/>
        <path d="M4 14h2l-2 3h2"/>
        <path d="M6 20h-2l2-3h-2"/>
      </svg>
    </button>
    <button class="md-btn" onclick={insertTaskList} title="任务列表">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    </button>
  </div>

  <div class="md-toolbar-separator"></div>

  <div class="md-toolbar-group">
    <button class="md-btn" onclick={insertTable} title="表格">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>
      </svg>
    </button>
    <button class="md-btn" onclick={insertCodeBlock} title="代码块">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
        <line x1="12" y1="2" x2="12" y2="22"/>
      </svg>
    </button>
    <button class="md-btn" onclick={insertDivider} title="分割线">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="4" y1="12" x2="20" y2="12"/>
        <polyline points="8 8 4 12 8 16"/>
        <polyline points="16 8 20 12 16 16"/>
      </svg>
    </button>
  </div>
</div>
{/if}

<style>
  .md-toolbar {
    display: flex;
    align-items: center;
    height: var(--toolbar-height);
    background: var(--acrylic-bg);
    border-bottom: 1px solid var(--color-toolbar-border);
    padding: 0 8px;
    gap: 2px;
    flex-shrink: 0;
  }

  .md-toolbar-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .md-toolbar-separator {
    width: 1px;
    height: 20px;
    background: var(--color-border);
    margin: 0 4px;
  }

  .md-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: var(--radius-sm);
    color: var(--color-btn-icon);
    transition: all 120ms ease;
  }

  .md-btn:hover {
    color: var(--color-btn-icon-hover);
    background: var(--color-btn-bg-hover);
  }
</style>
