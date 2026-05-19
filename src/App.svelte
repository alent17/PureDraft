<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { EditorView } from '@codemirror/view';
  import TitleBar from './components/TitleBar.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import TabBar from './components/TabBar.svelte';
  import Editor from './components/Editor.svelte';
  import Preview from './components/Preview.svelte';
  import FileTree from './components/FileTree.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import NewFileModal from './components/NewFileModal.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import SaveSlotPanel from './components/SaveSlotPanel.svelte';
  import MDToolbar from './lib/components/MDToolbar.svelte';
  import HoverPreview from './components/HoverPreview.svelte';
  import {
    openFiles,
    currentFileIndex,
    currentFile,
    addFile,
    updateFileContent,
    markFileSaved,
    updateCursor,
  } from '$lib/stores/file';
  import {
    activeTab,
    sidebarOpen,
    mode,
    scrollSyncEnabled,
    hoverPreviewEnabled,
    acrylicEnabled,
    syncStatus,
    focusMode,
    autoSaveInterval,
    customFonts,
  } from '$lib/stores/ui';
  import { setAcrylicEffect } from '$lib/api/window';
  import { openFileDialog, readFile, saveFile, saveFileAs } from '$lib/utils/tauri';
  import { isMarkdown, isFormattable } from '$lib/utils/fileTypes';
  import { formatContent } from '$lib/utils/format';
  import { createMarkedInstance } from '$lib/utils/markdown';
  import { saveState, loadState, clearState } from '$lib/utils/persistence';
  import { pasteImageFromClipboard } from '$lib/utils/image';
  import { addRecentFile } from '$lib/utils/recentFiles';
  import { createSaveSlot, getSaveSlots } from '$lib/utils/saveSlots';
  import { ScrollSyncEngine, type ScrollState } from '$lib/utils/scrollSync';
  import { loadCustomFonts } from '$lib/utils/fontLoader';
  import type { OpenFile, FileType } from '$lib/types';

  let dragOver = $state(false);
  let showNewFileModal = $state(false);
  let formatting = $state(false);
  let triggerSearch = $state(false);
  let editorView = $state<EditorView | null>(null);
  let lastAutoSaveTime = $state(0);
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  let previewEl = $state<HTMLDivElement | null>(null);
  let hoverEl = $state<HTMLDivElement | null>(null);
  let splitRatio = $state(0.5);
  let draggingSplit = $state(false);
  let isSyncingEditorTarget = false;
  let isSyncingPreviewTarget = false;
  let editorScrollEndTimer: ReturnType<typeof setTimeout> | null = null;
  let previewScrollEndTimer: ReturnType<typeof setTimeout> | null = null;

  const syncEngine = new ScrollSyncEngine({ enabled: $scrollSyncEnabled, throttleMs: 30 });

  function clearEditorSyncFlag() {
    isSyncingEditorTarget = false;
    if (editorScrollEndTimer) { clearTimeout(editorScrollEndTimer); editorScrollEndTimer = null; }
  }

  function clearPreviewSyncFlag() {
    isSyncingPreviewTarget = false;
    if (previewScrollEndTimer) { clearTimeout(previewScrollEndTimer); previewScrollEndTimer = null; }
  }

  $effect(() => {
    document.documentElement.setAttribute('data-mode', $mode);
    document.documentElement.classList.toggle('acrylic-on', $acrylicEnabled);
    createMarkedInstance($mode);
    if (typeof window !== 'undefined') {
      document.documentElement.style.colorScheme = $mode;
    }
  });

  $effect(() => {
    syncEngine.updateConfig({ enabled: $scrollSyncEnabled });
  });

  $effect(() => {
    loadCustomFonts($customFonts);
  });

  $effect(() => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
    const interval = $autoSaveInterval;
    if (interval !== 'off') {
      const ms = parseInt(interval) * 1000;
      autoSaveTimer = setInterval(() => {
        handleAutoSave();
      }, ms);
    }
    return () => {
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
      }
    };
  });

  async function handleAutoSave() {
    const index = $currentFileIndex;
    const files = $openFiles;
    if (index < 0 || index >= files.length) return;
    const file = files[index];
    if (!file.isModified || !file.path) return;

    console.log(`[AutoSave] triggered — file=${file.name}, path=${file.path}, contentLen=${file.content.length}`);

    let contentToSave = file.content;
    if (isFormattable(file.fileType)) {
      contentToSave = await formatContent(file.content, file.fileType);
      if (contentToSave !== file.content) {
        updateFileContent(index, contentToSave);
      }
    }

    const [err] = await saveFile(file.path, contentToSave);
    if (!err) {
      markFileSaved(index);
      lastAutoSaveTime = Date.now();
      const slot = await createSaveSlot('auto', file.path, contentToSave, '自动存档', file.cursor);
      if (slot) {
        console.log(`[AutoSave] auto save slot created — slotId=${slot.slotId}, timestamp=${new Date(slot.timestamp).toISOString()}`);
      } else {
        console.warn(`[AutoSave] auto save slot creation failed for ${file.name}`);
      }
    } else {
      console.error(`[AutoSave] saveFile failed for ${file.name}:`, err);
    }
  }

  function handleEditorChange(value: string) {
    const index = $currentFileIndex;
    if (index >= 0) {
      updateFileContent(index, value);
    }
  }

  function handleCursorChange(line: number, col: number) {
    const index = $currentFileIndex;
    if (index >= 0) {
      updateCursor(index, line, col);
    }
  }

  function handleEditorScroll(scrollTop: number, scrollHeight: number, clientHeight: number) {
    if (isSyncingEditorTarget) return;
    const inSplitOrEdit = $activeTab === 'edit' || $activeTab === 'split';
    if (!inSplitOrEdit) return;

    const state: ScrollState = { scrollTop, scrollHeight, clientHeight };
    const ratio = syncEngine.onEditorScroll(state);
    if (ratio === null) return;

    if (previewEl) {
      clearPreviewSyncFlag();
      const target = syncEngine.applyRatioToTarget(ratio, {
        scrollTop: previewEl.scrollTop,
        scrollHeight: previewEl.scrollHeight,
        clientHeight: previewEl.clientHeight,
      });
      isSyncingPreviewTarget = true;
      previewEl.scrollTop = target;
      previewScrollEndTimer = setTimeout(clearPreviewSyncFlag, 300);
    }

    if (hoverEl) {
      const target = syncEngine.applyRatioToTarget(ratio, {
        scrollTop: hoverEl.scrollTop,
        scrollHeight: hoverEl.scrollHeight,
        clientHeight: hoverEl.clientHeight,
      });
      hoverEl.scrollTop = target;
    }
  }

  function handlePreviewScroll(scrollTop: number, scrollHeight: number, clientHeight: number) {
    if (isSyncingPreviewTarget) return;
    const inSplitOrPreview = $activeTab === 'preview' || $activeTab === 'split';
    if (!inSplitOrPreview) return;

    const state: ScrollState = { scrollTop, scrollHeight, clientHeight };
    const ratio = syncEngine.onPreviewScroll(state);
    if (ratio === null) return;

    if (editorView?.scrollDOM) {
      clearEditorSyncFlag();
      const target = syncEngine.applyRatioToTarget(ratio, {
        scrollTop: editorView.scrollDOM.scrollTop,
        scrollHeight: editorView.scrollDOM.scrollHeight,
        clientHeight: editorView.scrollDOM.clientHeight,
      });
      isSyncingEditorTarget = true;
      editorView.scrollDOM.scrollTop = target;
      editorScrollEndTimer = setTimeout(clearEditorSyncFlag, 300);
    }

    if (hoverEl) {
      const target = syncEngine.applyRatioToTarget(ratio, {
        scrollTop: hoverEl.scrollTop,
        scrollHeight: hoverEl.scrollHeight,
        clientHeight: hoverEl.clientHeight,
      });
      hoverEl.scrollTop = target;
    }
  }

  function handleHoverScroll(scrollTop: number, scrollHeight: number, clientHeight: number) {
    if (isSyncingPreviewTarget) return;
    const state: ScrollState = { scrollTop, scrollHeight, clientHeight };
    const ratio = syncEngine.onHoverScroll(state);
    if (ratio === null) return;

    if (editorView?.scrollDOM) {
      clearEditorSyncFlag();
      const target = syncEngine.applyRatioToTarget(ratio, {
        scrollTop: editorView.scrollDOM.scrollTop,
        scrollHeight: editorView.scrollDOM.scrollHeight,
        clientHeight: editorView.scrollDOM.clientHeight,
      });
      isSyncingEditorTarget = true;
      editorView.scrollDOM.scrollTop = target;
      editorScrollEndTimer = setTimeout(clearEditorSyncFlag, 300);
    }

    if (previewEl) {
      const target = syncEngine.applyRatioToTarget(ratio, {
        scrollTop: previewEl.scrollTop,
        scrollHeight: previewEl.scrollHeight,
        clientHeight: previewEl.clientHeight,
      });
      previewEl.scrollTop = target;
    }
  }

  async function handleOpenFiles() {
    const files = await openFileDialog();
    if (!files) return;
    for (const f of files) {
      const fileType = f.fileType as FileType;
      addFile({
        path: f.path,
        name: f.name,
        content: f.content,
        originalContent: f.content,
        fileType,
        isModified: false,
        cursor: { line: 1, col: 1 },
      });
      addRecentFile(f.path, f.name);
    }
  }

  async function handleSave() {
    const index = $currentFileIndex;
    const files = $openFiles;
    if (index < 0 || index >= files.length) return;
    const file = files[index];

    let contentToSave = file.content;

    if (isFormattable(file.fileType)) {
      formatting = true;
      contentToSave = await formatContent(file.content, file.fileType);
      if (contentToSave !== file.content) {
        updateFileContent(index, contentToSave);
      }
      formatting = false;
    }

    if (file.path) {
      const [err] = await saveFile(file.path, contentToSave);
      if (err) {
        console.error('Save failed:', err.message);
        return;
      }
      markFileSaved(index);
      const existingManual = getSaveSlots(file.path).filter(s => s.type === 'manual');
      let shouldSaveSlot = true;
      if (existingManual.length > 0) {
        existingManual.sort((a, b) => b.timestamp - a.timestamp);
        if (existingManual[0].contentLength === contentToSave.length) {
          shouldSaveSlot = false;
        }
      }
      if (shouldSaveSlot) {
        await createSaveSlot('manual', file.path, contentToSave, '手动存档', file.cursor);
      }
    } else {
      const [err, newPath] = await saveFileAs(contentToSave, file.name);
      if (err) {
        console.error('Save As failed:', err.message);
        formatting = false;
        return;
      }
      if (newPath) {
        const name = newPath.split(/[\\/]/).pop() || file.name;
        openFiles.update((fs: OpenFile[]) =>
          fs.map((f: OpenFile, i: number) => {
            if (i !== index) return f;
            return { ...f, path: newPath, name, originalContent: contentToSave, isModified: false };
          })
        );
        addRecentFile(newPath, name);
        await createSaveSlot('manual', newPath, contentToSave, '手动存档', file.cursor);
      }
    }
  }

  async function handleSaveAs() {
    const index = $currentFileIndex;
    const files = $openFiles;
    if (index < 0 || index >= files.length) return;
    const file = files[index];

    let contentToSave = file.content;

    if (isFormattable(file.fileType)) {
      formatting = true;
      contentToSave = await formatContent(file.content, file.fileType);
      if (contentToSave !== file.content) {
        updateFileContent(index, contentToSave);
      }
      formatting = false;
    }

    const [err, newPath] = await saveFileAs(contentToSave, file.name);
    formatting = false;
    if (err) {
      console.error('Save As failed:', err.message);
      return;
    }
    if (newPath) {
      const name = newPath.split(/[\\/]/).pop() || file.name;
      openFiles.update((fs: OpenFile[]) =>
        fs.map((f: OpenFile, i: number) => {
          if (i !== index) return f;
          return { ...f, path: newPath, name, originalContent: contentToSave, isModified: false };
        })
      );
      addRecentFile(newPath, name);
    }
  }

  function handleNewFile() {
    showNewFileModal = true;
  }

  function handleNewFileConfirm(filename: string, ext: string, fileType: FileType, initialContent?: string) {
    showNewFileModal = false;
    addFile({
      path: '',
      name: filename,
      content: initialContent || '',
      originalContent: initialContent || '',
      fileType,
      isModified: false,
      cursor: { line: 1, col: 1 },
    });
  }

  function handleNewFileCancel() {
    showNewFileModal = false;
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name;
      try {
        const content = await file.text();
        const ext = name.split('.').pop()?.toLowerCase() || '';
        const fileType = getFileTypeFromExtension(ext);
        
        addFile({
          path: '',
          name,
          content,
          originalContent: content,
          fileType,
          isModified: false,
          cursor: { line: 1, col: 1 },
        });
      } catch (e) {
        console.error('Failed to read dropped file:', e);
      }
    }
  }

  function getFileTypeFromExtension(ext: string): FileType {
    const map: Record<string, FileType> = {
      'md': 'Markdown', 'markdown': 'Markdown',
      'js': 'JavaScript', 'mjs': 'JavaScript', 'cjs': 'JavaScript',
      'jsx': 'Jsx', 'tsx': 'Tsx',
      'ts': 'TypeScript', 'mts': 'TypeScript', 'cts': 'TypeScript',
      'html': 'Html', 'htm': 'Html',
      'css': 'Css', 'scss': 'Css', 'less': 'Css',
      'json': 'Json',
      'py': 'Python',
      'rs': 'Rust',
      'go': 'Go',
      'java': 'Java',
      'c': 'C', 'h': 'C',
      'cpp': 'Cpp', 'hpp': 'Cpp',
      'sh': 'Shell', 'bash': 'Shell',
      'yaml': 'Yaml', 'yml': 'Yaml',
      'toml': 'Toml',
      'xml': 'Xml',
    };
    return map[ext] || 'PlainText';
  }

  async function handleOpenRecentFile(path: string, name: string) {
    try {
      const [err, content] = await readFile(path);
      if (err || !content) {
        console.error('Failed to read recent file:', err?.message);
        return;
      }
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const fileType = getFileTypeFromExtension(ext);
      addFile({
        path,
        name,
        content: content.content,
        originalContent: content.content,
        fileType,
        isModified: false,
        cursor: { line: 1, col: 1 },
      });
      addRecentFile(path, name);
    } catch (e) {
      console.error('Failed to open recent file:', e);
    }
  }

  function handleOutlineNavigate(line: number) {
    const file = $currentFile;
    const totalLines = file ? file.content.split('\n').length : 1;
    const estimatedRatio = Math.min(1, line / Math.max(1, totalLines));

    if ($activeTab === 'preview') {
      if (previewEl) {
        try {
          const previewState: ScrollState = {
            scrollTop: previewEl.scrollTop,
            scrollHeight: previewEl.scrollHeight,
            clientHeight: previewEl.clientHeight,
          };
          const targetTop = syncEngine.applyRatioToTarget(estimatedRatio, previewState);
          syncEngine.reset();
          previewEl.scrollTo({ top: targetTop, behavior: 'smooth' });
        } catch (err) {
          console.warn('Outline navigate (preview) failed:', err);
        }
      }
      return;
    }
    if (editorView) {
      const doc = editorView.state.doc;
      const target = Math.min(line, doc.lines);
      const pos = doc.line(target).from;
      editorView.dispatch({
        selection: { anchor: pos, head: pos },
        scrollIntoView: true,
      });
      editorView.focus();
    }
  }

  async function handlePaste(e: ClipboardEvent) {
    if (!editorView) return;
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    for (let i = 0; i < clipboardItems.length; i++) {
      if (clipboardItems[i].type.startsWith('image/')) {
        e.preventDefault();
        const result = await pasteImageFromClipboard();
        if (result.success && result.markdown) {
          const pos = editorView.state.selection.main.from;
          editorView.dispatch({
            changes: { from: pos, insert: result.markdown + '\n' },
          });
        }
        return;
      }
    }
  }

  function handleTaskToggle(lineIndex: number, checked: boolean) {
    const index = $currentFileIndex;
    const file = $currentFile;
    if (index < 0 || !file) return;

    const lines = file.content.split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    if (checked) {
      lines[lineIndex] = line.replace(/- \[ \]/, '- [x]');
    } else {
      lines[lineIndex] = line.replace(/- \[x\]/, '- [ ]');
    }

    const newContent = lines.join('\n');
    updateFileContent(index, newContent);
  }

  function handleKeyDown(e: KeyboardEvent) {
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === 'o') {
      e.preventDefault();
      handleOpenFiles();
    } else if (ctrl && e.key === 's') {
      e.preventDefault();
      if (e.shiftKey) {
        handleSaveAs();
      } else {
        handleSave();
      }
    } else if (ctrl && e.key === 'n') {
      e.preventDefault();
      handleNewFile();
    } else if (ctrl && e.key === 'b') {
      e.preventDefault();
      sidebarOpen.update((v: boolean) => !v);
    } else if (ctrl && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      focusMode.update(v => !v);
    } else if (ctrl && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      hoverPreviewEnabled.update(v => !v);
    } else if (e.key === 'Escape' && $focusMode) {
      focusMode.set(false);
    }
  }

  let showPreview = $derived(
    $currentFile ? isMarkdown($currentFile.fileType) : false
  );

  onMount(() => {
    setAcrylicEffect($acrylicEnabled);
    document.documentElement.classList.toggle('acrylic-on', $acrylicEnabled);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', () => saveState());
    document.addEventListener('paste', handlePaste);
    window.addEventListener('mousemove', (e) => {
      if (!draggingSplit) return;
      const el = document.querySelector('.split-layout');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      splitRatio = Math.min(0.8, Math.max(0.2, (e.clientX - rect.left) / rect.width));
    });
    window.addEventListener('mouseup', () => { draggingSplit = false; });
    return () => {
      clearEditorSyncFlag();
      clearPreviewSyncFlag();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', () => saveState());
      document.removeEventListener('paste', handlePaste);
    };
  });
</script>

<div
  class="app"
  class:drag-over={dragOver}
  class:focus-mode={$focusMode}
  class:acrylic-on={$acrylicEnabled}
  role="application"
  ondrop={handleDrop}
  ondragover={(e) => { e.preventDefault(); dragOver = true; }}
  ondragleave={() => { dragOver = false; }}
>
  {#if !$focusMode}
    <TitleBar />
    <Toolbar
      onOpen={handleOpenFiles}
      onSave={handleSave}
      onSaveAs={handleSaveAs}
      onNew={handleNewFile}
    />
  {/if}

  <div class="main-area">
    {#if !$focusMode && $sidebarOpen}
      <div class="sidebar-panel" class:collapsed={!$sidebarOpen}>
        <FileTree
          onNavigateToLine={handleOutlineNavigate}
          onOpenRecentFile={handleOpenRecentFile}
          editorView={editorView}
        />
      </div>
    {/if}
    <div class="content-area">
      {#if $currentFile}
        {#if !$focusMode}
          <TabBar fileType={$currentFile.fileType} />
        {/if}
        {#if !$focusMode}
          <MDToolbar editorView={editorView} fileType={$currentFile.fileType} />
        {/if}
        <div class="editor-preview-area" class:focus-layout={$focusMode}>
          {#if $activeTab === 'split'}
            <div class="split-layout" class:dragging={draggingSplit}>
              <div class="split-editor" style="width: {splitRatio * 100}%">
                <Editor
                  content={$currentFile.content}
                  fileType={$currentFile.fileType}
                  onChange={handleEditorChange}
                  onCursorChange={handleCursorChange}
                  onScroll={handleEditorScroll}
                  bind:triggerSearch
                  bind:editorViewRef={editorView}
                />
              </div>
              <div
                class="split-handle"
                onmousedown={(e) => { draggingSplit = true; e.preventDefault(); }}
                role="separator"
              ></div>
              <div class="split-preview">
                <Preview
                  content={$currentFile.content}
                  onSearch={() => { activeTab.set('edit'); triggerSearch = true; }}
                  onScroll={handlePreviewScroll}
                  onTaskToggle={handleTaskToggle}
                  bind:previewEl
                />
              </div>
            </div>
          {:else if $activeTab === 'edit' || !showPreview}
            <Editor
              content={$currentFile.content}
              fileType={$currentFile.fileType}
              onChange={handleEditorChange}
              onCursorChange={handleCursorChange}
              onScroll={handleEditorScroll}
              bind:triggerSearch
              bind:editorViewRef={editorView}
            />
            {#if showPreview && $hoverPreviewEnabled}
              <HoverPreview
                content={$currentFile.content}
                bind:visible={$hoverPreviewEnabled}
                onScroll={handleHoverScroll}
                bind:hoverEl
              />
            {/if}
          {:else}
            <Preview
              content={$currentFile.content}
              onSearch={() => { activeTab.set('edit'); triggerSearch = true; }}
              onScroll={handlePreviewScroll}
              onTaskToggle={handleTaskToggle}
              bind:previewEl
            />
          {/if}
        </div>
      {:else}
        <div class="welcome">
          <div class="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <h2>PureDraft</h2>
          <p>MD & Code Editor</p>
          <div class="welcome-actions">
            <button class="btn-primary" onclick={handleOpenFiles} title="打开文件 (Ctrl+O)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              打开文件
            </button>
            <button class="btn-secondary" onclick={handleNewFile} title="新建文件 (Ctrl+N)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              新建文件
            </button>
          </div>
          <div class="welcome-shortcuts">
            <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>O</kbd><span>打开文件</span></div>
            <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>S</kbd><span>保存 & 格式化</span></div>
            <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>N</kbd><span>新建文件</span></div>
            <div class="shortcut"><kbd>Ctrl</kbd>+<kbd>B</kbd><span>切换侧边栏</span></div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if !$focusMode}
    <StatusBar />
  {/if}

  {#if formatting}
    <div class="format-toast">格式化中...</div>
  {/if}

  {#if dragOver}
    <div class="drag-overlay">
      <div class="drag-overlay-content">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span>拖拽文件到此处打开</span>
      </div>
    </div>
  {/if}
</div>

{#if showNewFileModal}
  <NewFileModal onConfirm={handleNewFileConfirm} onCancel={handleNewFileCancel} />
{/if}

<SettingsPanel />
<SaveSlotPanel />

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    position: relative;
    background: var(--acrylic-bg);
    color: var(--color-ink);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06),
                0 8px 32px rgba(0, 0, 0, 0.55);
  }

  .app.focus-mode {
    background: var(--color-editor-bg);
  }

  .main-area {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar-panel {
    width: 240px;
    min-width: 180px;
    max-width: 360px;
    background: var(--acrylic-sidebar-bg);
    border-right: 1px solid var(--color-border);
    box-shadow: var(--shadow-sidebar);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    z-index: 5;
    position: relative;
    transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1),
                min-width 250ms cubic-bezier(0.4, 0, 0.2, 1),
                border 250ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar-panel.collapsed {
    width: 0;
    min-width: 0;
    border-right: none;
    box-shadow: none;
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--acrylic-content-bg);
  }

  .editor-preview-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--acrylic-content-bg);
  }

  .editor-preview-area.focus-layout {
    max-width: 860px;
    margin: 0 auto;
    width: 100%;
    padding: 60px 40px;
  }

  .split-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .split-layout.dragging {
    user-select: none;
  }

  .split-editor {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-border);
  }

  .split-handle {
    width: 4px;
    cursor: col-resize;
    background: transparent;
    transition: background 120ms ease;
    flex-shrink: 0;
  }

  .split-handle:hover,
  .split-layout.dragging .split-handle {
    background: var(--color-accent);
  }

  .split-preview {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 900px) {
    .split-layout {
      flex-direction: column;
    }
    .split-editor {
      width: 100% !important;
      height: 50%;
      border-right: none;
      border-bottom: 1px solid var(--color-border);
    }
    .split-handle {
      width: 100%;
      height: 4px;
      cursor: row-resize;
    }
    .split-preview {
      height: 50%;
    }
  }

  .welcome {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--acrylic-content-bg);
    user-select: none;
  }

  .welcome-icon {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-accent);
    border-radius: var(--radius-lg);
    color: white;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .welcome h2 {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-ink);
    margin: 0;
  }

  .welcome p {
    font-size: 16px;
    color: var(--color-slate);
    margin-bottom: 24px;
  }

  .welcome-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
  }

  .btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    background: var(--color-accent);
    color: white;
    font-size: 14px;
    font-weight: 600;
    border-radius: var(--radius-sm);
    transition: all 200ms ease;
  }

  .btn-primary:hover {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .btn-secondary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    background: var(--color-bg);
    color: var(--color-accent);
    font-size: 14px;
    font-weight: 600;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    transition: all 200ms ease;
  }

  .btn-secondary:hover {
    border-color: var(--color-accent);
    background: var(--color-bg-secondary);
    transform: translateY(-1px);
  }

  .welcome-shortcuts {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .shortcut {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--color-slate);
  }

  .shortcut kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    padding: 2px 6px;
    font-size: 11px;
    font-family: inherit;
    font-weight: 600;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    color: var(--color-ink);
  }

  .shortcut span {
    margin-left: auto;
    min-width: 120px;
  }

  .format-toast {
    position: fixed;
    bottom: 40px;
    right: 16px;
    padding: 8px 16px;
    background: var(--color-accent);
    color: white;
    font-size: 13px;
    font-weight: 600;
    border-radius: var(--radius-sm);
    z-index: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .drag-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    border: 2px dashed var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    pointer-events: none;
  }

  .drag-overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--color-accent);
  }

  .drag-overlay-content span {
    font-size: 16px;
    font-weight: 600;
  }
</style>
