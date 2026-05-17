<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, keymap, lineNumbers } from '@codemirror/view';
  import { EditorState, Compartment } from '@codemirror/state';
  import { basicSetup } from 'codemirror';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
  import { searchKeymap } from '@codemirror/search';
  import { tags } from '@lezer/highlight';
  import type { FileType } from '$lib/types';
  import { getLanguageExtension } from '$lib/utils/fileTypes';
  import { mode, acrylicEnabled } from '$lib/stores/ui';
  import SearchBar from './SearchBar.svelte';
  import { setSearchResults, createSearchHighlightExtension, searchTheme } from '$lib/utils/search';

  let {
    content,
    fileType,
    onChange,
    onCursorChange,
    onScroll,
    triggerSearch = $bindable(false),
    editorViewRef = $bindable(null as EditorView | null),
  }: {
    content: string;
    fileType: FileType;
    onChange: (value: string) => void;
    onCursorChange?: (line: number, col: number) => void;
    onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
    triggerSearch?: boolean;
    editorViewRef?: EditorView | null;
  } = $props();

  let container: HTMLDivElement;
  let view: EditorView | null = null;

  const languageConf = new Compartment();
  const themeConf = new Compartment();

  let currentContent = $state(content);
  let currentMode = $state('dark');
  let searchVisible = $state(false);

  const darkCM = EditorView.theme({
    '&': { backgroundColor: '#1F1F1F', color: '#D4D4D4', height: '100%' },
    '.cm-scroller': {
      fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontSize: '14px', lineHeight: '1.6', overflow: 'auto',
    },
    '.cm-content': { caretColor: '#60CDFF', padding: '8px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#60CDFF', borderLeftWidth: '2px' },
    '.cm-cursor-primary': { transition: 'left 100ms ease-out' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(96, 205, 255, 0.25)',
    },
    '.cm-gutters': { backgroundColor: '#1F1F1F', color: '#858585', border: 'none', minWidth: '50px' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(96, 205, 255, 0.06)', color: '#60CDFF' },
    '.cm-activeLine': { backgroundColor: 'rgba(96, 205, 255, 0.04)' },
    '.cm-foldGutter .cm-gutterElement': { color: '#858585' },
    '.cm-tooltip': { border: '1px solid #3B3B3B', backgroundColor: '#2C2C2C', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'rgba(96, 205, 255, 0.15)' },
    '.cm-panels': { backgroundColor: '#2C2C2C', color: '#FFFFFF' },
    '.cm-searchMatch': { backgroundColor: 'rgba(96, 205, 255, 0.2)' },
    '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: 'rgba(96, 205, 255, 0.4)' },
    '.cm-matchingBracket': { backgroundColor: 'rgba(96, 205, 255, 0.3)', color: '#60CDFF !important' },
  }, { dark: true });

  const lightCM = EditorView.theme({
    '&': { backgroundColor: '#FFFFFF', color: '#171717', height: '100%' },
    '.cm-scroller': {
      fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontSize: '14px', lineHeight: '1.6', overflow: 'auto',
    },
    '.cm-content': { caretColor: '#005FB8', padding: '8px 0' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#005FB8', borderLeftWidth: '2px' },
    '.cm-cursor-primary': { transition: 'left 100ms ease-out' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(0, 95, 184, 0.25)',
    },
    '.cm-gutters': { backgroundColor: '#FFFFFF', color: '#999999', border: 'none', minWidth: '50px' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(0, 95, 184, 0.08)', color: '#005FB8' },
    '.cm-activeLine': { backgroundColor: 'rgba(0, 95, 184, 0.06)' },
    '.cm-foldGutter .cm-gutterElement': { color: '#999999' },
    '.cm-tooltip': { border: '1px solid #D1D1D1', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'rgba(0, 95, 184, 0.1)' },
    '.cm-panels': { backgroundColor: '#F3F3F3', color: '#171717' },
    '.cm-searchMatch': { backgroundColor: 'rgba(0, 95, 184, 0.2)' },
    '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: 'rgba(0, 95, 184, 0.4)' },
    '.cm-matchingBracket': { backgroundColor: 'rgba(0, 95, 184, 0.3)', color: '#005FB8 !important' },
  }, { dark: false });

  const darkHighlight = HighlightStyle.define([
    { tag: tags.keyword, color: '#569CD6' },
    { tag: [tags.controlKeyword, tags.operatorKeyword], color: '#C586C0' },
    { tag: [tags.typeName, tags.className, tags.namespace], color: '#4EC9B0' },
    { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: '#DCDCAA' },
    { tag: [tags.function(tags.propertyName)], color: '#C8C8C8' },
    { tag: tags.string, color: '#CE9178' },
    { tag: tags.special(tags.string), color: '#569CD6' },
    { tag: tags.number, color: '#B5CEA8' },
    { tag: tags.regexp, color: '#D16969' },
    { tag: [tags.lineComment, tags.blockComment], color: '#6A9955', fontStyle: 'italic' },
    { tag: tags.docComment, color: '#608B4E', fontStyle: 'italic' },
    { tag: tags.variableName, color: '#9CDCFE' },
    { tag: [tags.definition(tags.propertyName), tags.propertyName], color: '#9CDCFE' },
    { tag: tags.operator, color: '#D4D4D4' },
    { tag: [tags.tagName, tags.labelName], color: '#569CD6' },
    { tag: tags.attributeName, color: '#9CDCFE' },
    { tag: tags.attributeValue, color: '#CE9178' },
    { tag: tags.punctuation, color: '#808080' },
    { tag: tags.separator, color: '#808080' },
    { tag: tags.bracket, color: '#808080' },
    { tag: tags.heading, color: '#569CD6', fontWeight: 'bold' },
    { tag: tags.heading1, color: '#569CD6', fontWeight: 'bold', fontSize: '1.4em' },
    { tag: tags.heading2, color: '#569CD6', fontWeight: 'bold', fontSize: '1.2em' },
    { tag: tags.link, color: '#4FC1FF', textDecoration: 'underline' },
    { tag: tags.url, color: '#6A9955' },
    { tag: tags.strong, fontWeight: 'bold', color: '#DCDCAA' },
    { tag: tags.emphasis, fontStyle: 'italic', color: '#C586C0' },
    { tag: tags.strikethrough, textDecoration: 'line-through', color: '#F44747' },
    { tag: tags.inserted, color: '#4EC9B0' },
    { tag: tags.deleted, color: '#F44747', textDecoration: 'line-through' },
    { tag: tags.changed, color: '#DCDCAA' },
    { tag: tags.processingInstruction, color: '#808080' },
    { tag: [tags.meta, tags.modifier], color: '#C586C0' },
    { tag: tags.invalid, color: '#F44747', textDecoration: 'underline' },
    { tag: tags.escape, color: '#D7BA7D' },
    { tag: tags.color, color: '#D7BA7D' },
    { tag: tags.unit, color: '#B5CEA8' },
    { tag: tags.constant(tags.variableName), color: '#4FC1FF' },
    { tag: tags.standard(tags.variableName), color: '#DCDCAA' },
    { tag: tags.local(tags.variableName), color: '#9CDCFE' },
    { tag: tags.special(tags.variableName), color: '#4FC1FF' },
  ]);

  const lightHighlight = HighlightStyle.define([
    { tag: tags.keyword, color: '#0000FF' },
    { tag: [tags.controlKeyword, tags.operatorKeyword], color: '#AF00DB' },
    { tag: [tags.typeName, tags.className, tags.namespace], color: '#267F99' },
    { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: '#795E26' },
    { tag: [tags.function(tags.propertyName)], color: '#001080' },
    { tag: tags.string, color: '#A31515' },
    { tag: tags.special(tags.string), color: '#0000FF' },
    { tag: tags.number, color: '#098658' },
    { tag: tags.regexp, color: '#811F3F' },
    { tag: [tags.lineComment, tags.blockComment], color: '#008000', fontStyle: 'italic' },
    { tag: tags.docComment, color: '#006000', fontStyle: 'italic' },
    { tag: tags.variableName, color: '#001080' },
    { tag: [tags.definition(tags.propertyName), tags.propertyName], color: '#001080' },
    { tag: tags.operator, color: '#000000' },
    { tag: [tags.tagName, tags.labelName], color: '#800000' },
    { tag: tags.attributeName, color: '#FF0000' },
    { tag: tags.attributeValue, color: '#0000FF' },
    { tag: tags.punctuation, color: '#808080' },
    { tag: tags.separator, color: '#808080' },
    { tag: tags.bracket, color: '#808080' },
    { tag: tags.heading, color: '#0000FF', fontWeight: 'bold' },
    { tag: tags.heading1, color: '#0000FF', fontWeight: 'bold', fontSize: '1.4em' },
    { tag: tags.heading2, color: '#0000FF', fontWeight: 'bold', fontSize: '1.2em' },
    { tag: tags.link, color: '#0078D4', textDecoration: 'underline' },
    { tag: tags.url, color: '#098658' },
    { tag: tags.strong, fontWeight: 'bold', color: '#795E26' },
    { tag: tags.emphasis, fontStyle: 'italic', color: '#AF00DB' },
    { tag: tags.strikethrough, textDecoration: 'line-through', color: '#A31515' },
    { tag: tags.inserted, color: '#267F99' },
    { tag: tags.deleted, color: '#A31515', textDecoration: 'line-through' },
    { tag: tags.changed, color: '#795E26' },
    { tag: tags.processingInstruction, color: '#808080' },
    { tag: [tags.meta, tags.modifier], color: '#AF00DB' },
    { tag: tags.invalid, color: '#CD3131', textDecoration: 'underline' },
    { tag: tags.escape, color: '#0451A5' },
    { tag: tags.color, color: '#0451A5' },
    { tag: tags.unit, color: '#098658' },
    { tag: tags.constant(tags.variableName), color: '#0070C1' },
    { tag: tags.standard(tags.variableName), color: '#795E26' },
    { tag: tags.local(tags.variableName), color: '#001080' },
    { tag: tags.special(tags.variableName), color: '#0070C1' },
  ]);

  function getCMLightDark(m: string, acrylic: boolean) {
    if (m === 'light') {
      if (acrylic) {
        return [
          EditorView.theme({
            '&': { backgroundColor: 'rgba(255,255,255,0.5)', color: '#171717', height: '100%' },
            '.cm-gutters': { backgroundColor: 'rgba(255,255,255,0.5)', color: '#999999', border: 'none', minWidth: '50px' },
            '.cm-activeLine': { backgroundColor: 'rgba(0, 95, 184, 0.06)' },
          }, { dark: false }),
          lightCM, syntaxHighlighting(lightHighlight),
        ];
      }
      return [lightCM, syntaxHighlighting(lightHighlight)];
    }
    if (acrylic) {
      return [
        EditorView.theme({
          '&': { backgroundColor: 'rgba(32,32,32,0.5)', color: '#D4D4D4', height: '100%' },
          '.cm-gutters': { backgroundColor: 'rgba(32,32,32,0.5)', color: '#858585', border: 'none', minWidth: '50px' },
          '.cm-activeLine': { backgroundColor: 'rgba(96, 205, 255, 0.04)' },
        }, { dark: true }),
        darkCM, syntaxHighlighting(darkHighlight),
      ];
    }
    return [darkCM, syntaxHighlighting(darkHighlight)];
  }

  onMount(() => {
    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        history(),
        lineNumbers(),
        languageConf.of(getLanguageExtension(fileType)),
        themeConf.of(getCMLightDark(currentMode, $acrylicEnabled)),
        createSearchHighlightExtension(),
        searchTheme,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            currentContent = update.state.doc.toString();
            onChange(currentContent);
          }
          if (update.selectionSet && onCursorChange) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            onCursorChange(line.number, pos - line.from + 1);
          }
        }),
        EditorView.lineWrapping,
      ],
    });

    view = new EditorView({ state, parent: container });
    editorViewRef = view;

    if (onScroll) {
      view.scrollDOM.addEventListener('scroll', () => {
        onScroll(view!.scrollDOM.scrollTop, view!.scrollDOM.scrollHeight, view!.scrollDOM.clientHeight);
      });
    }
  });

  $effect(() => {
    if (view) {
      view.dispatch({ effects: languageConf.reconfigure(getLanguageExtension(fileType)) });
    }
  });

  $effect(() => {
    if (view && content !== currentContent) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
      currentContent = content;
    }
  });

  $effect(() => {
    const m = $mode;
    if (view) {
      currentMode = m;
      view.dispatch({ effects: themeConf.reconfigure(getCMLightDark(m, $acrylicEnabled)) });
    }
  });

  $effect(() => {
    if (triggerSearch) {
      searchVisible = true;
      triggerSearch = false;
    }
  });

  function handleKeyDown(e: KeyboardEvent) {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 'f') {
      e.preventDefault();
      searchVisible = true;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    view?.destroy();
    view = null;
    editorViewRef = null;
  });
</script>

<div class="editor-wrapper">
  <SearchBar bind:visible={searchVisible} bind:editorView={view} />
  <div class="editor-container" bind:this={container}></div>
</div>

<style>
  .editor-wrapper {
    flex: 1;
    overflow: hidden;
    background: var(--color-editor-bg);
  }

  .editor-container {
    height: 100%;
  }

  .editor-container :global(.cm-editor) {
    height: 100%;
  }

  .editor-container :global(.cm-editor.cm-focused) {
    outline: none;
  }
</style>
