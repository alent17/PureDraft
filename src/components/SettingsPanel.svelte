<script lang="ts">
  import { mode, settingsOpen, autoSaveInterval, scrollSyncEnabled, focusMode, acrylicEnabled, fontSize, fontFamily, customFonts, accentColor, ACCENT_COLORS, openConfirmDialog, closeConfirmDialog } from '$lib/stores/ui';
  import type { AutoSaveInterval, AccentColor } from '$lib/stores/ui';
  import { setAcrylicEffect } from '$lib/api/window';
  import { setAsDefaultMdEditor, checkDefaultMdEditor } from '$lib/api/file';
  import { selectFontFile } from '$lib/utils/fontLoader';
  import { loadCustomFonts } from '$lib/utils/fontLoader';

  let isDefaultEditor = $state(false);
  let assocLoading = $state(false);
  let assocMessage = $state('');

  async function checkDefaultStatus() {
    const [err, isDefault] = await checkDefaultMdEditor();
    if (!err && isDefault !== null) {
      isDefaultEditor = isDefault;
    }
  }

  async function handleSetDefault() {
    assocLoading = true;
    assocMessage = '';
    const [err] = await setAsDefaultMdEditor();
    if (err) {
      assocMessage = '设置失败: ' + err.message;
    } else {
      isDefaultEditor = true;
      assocMessage = '已设为 .md 文件默认打开程序';
    }
    assocLoading = false;
  }

  checkDefaultStatus();

  const PRESET_FONTS = [
    { label: 'Cascadia Code', value: "'Cascadia Code', monospace" },
    { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
    { label: 'Fira Code', value: "'Fira Code', monospace" },
    { label: 'Consolas', value: "Consolas, monospace" },
    { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
    { label: 'monospace', value: 'monospace' },
  ];

  function extractFontName(family: string): string {
    for (const pf of PRESET_FONTS) {
      if (family === pf.value) return pf.label;
    }
    return family.split(',')[0].trim().replace(/'/g, '');
  }

  let currentFontName = $state(extractFontName($fontFamily));

  function handleFontPreset(fontValue: string, fontLabel: string) {
    fontFamily.set(fontValue);
    currentFontName = fontLabel;
  }

  function handleUploadFont() {
    selectFontFile().then((font) => {
      if (!font) return;
      const exists = $customFonts.some(f => f.name === font.name);
      if (exists) {
        openConfirmDialog({
          title: '字体已存在',
          message: '该字体已存在，请勿重复上传。',
          confirmText: '知道了',
          onConfirm: () => closeConfirmDialog(),
          onCancel: () => closeConfirmDialog(),
        });
        return;
      }
      if ($customFonts.length >= 5) {
        openConfirmDialog({
          title: '数量限制',
          message: '最多只能上传 5 个自定义字体。',
          confirmText: '知道了',
          onConfirm: () => closeConfirmDialog(),
          onCancel: () => closeConfirmDialog(),
        });
        return;
      }
      customFonts.update(fonts => [...fonts, font]);
      loadCustomFonts([...$customFonts, font]);
      const fontValue = `'${font.name}', monospace`;
      fontFamily.set(fontValue);
      currentFontName = font.name;
    });
  }

  function handleRemoveCustomFont(fontNameToRemove: string) {
    openConfirmDialog({
      title: '移除字体',
      message: `确定要移除自定义字体 "${fontNameToRemove}" 吗？`,
      danger: true,
      confirmText: '移除',
      cancelText: '取消',
      onConfirm: () => {
        const wasCurrent = currentFontName === fontNameToRemove;
        customFonts.update(fonts => fonts.filter(f => f.name !== fontNameToRemove));
        loadCustomFonts($customFonts.filter(f => f.name !== fontNameToRemove));
        if (wasCurrent) {
          fontFamily.set(PRESET_FONTS[0].value);
          currentFontName = PRESET_FONTS[0].label;
        }
        closeConfirmDialog();
      },
      onCancel: () => closeConfirmDialog(),
    });
  }

  async function handleAcrylicToggle() {
    const newValue = !$acrylicEnabled;
    acrylicEnabled.set(newValue);
    await setAcrylicEffect(newValue);
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      settingsOpen.set(false);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      settingsOpen.set(false);
    }
  }
</script>

{#if $settingsOpen}
<div class="modal-overlay" onclick={handleOverlayClick} role="dialog" aria-modal="true" tabindex="-1" onkeydown={handleKeydown}>
  <div class="settings-panel">
    <div class="panel-header">
      <h3>设置</h3>
      <button class="close-btn" onclick={() => settingsOpen.set(false)} title="关闭">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="panel-body">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">配色模式</span>
          <span class="setting-desc">深色 / 浅色</span>
        </div>
        <div class="toggle-group">
          <button
            class="toggle-btn"
            class:active={$mode === 'light'}
            onclick={() => mode.set('light')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            浅色
          </button>
          <button
            class="toggle-btn"
            class:active={$mode === 'dark'}
            onclick={() => mode.set('dark')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            深色
          </button>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">主题色</span>
          <span class="setting-desc">选择强调色</span>
        </div>
        <div class="accent-group">
          {#each Object.entries(ACCENT_COLORS) as [name, colors]}
            <button
              class="accent-btn"
              class:active={$accentColor === name}
              style="--accent-preview: {colors.accent}"
              onclick={() => {
                accentColor.set(name as AccentColor);
                document.documentElement.dataset.accent = name;
              }}
              title={name}
            >
              {#if $accentColor === name}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">自动保存</span>
          <span class="setting-desc">自动保存已修改的文件</span>
        </div>
        <div class="toggle-group">
          {#each [['off', '关闭'], ['10', '10s'], ['30', '30s'], ['60', '1min'], ['120', '2min']] as [val, label]}
            {@const v = val as AutoSaveInterval}
            <button
              class="toggle-btn"
              class:active={$autoSaveInterval === v}
              onclick={() => autoSaveInterval.set(v)}
            >
              {label}
            </button>
          {/each}
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">滚动同步</span>
          <span class="setting-desc">编辑器和预览之间同步滚动</span>
        </div>
        <div class="toggle-group">
          <button
            class="toggle-btn"
            class:active={$scrollSyncEnabled}
            onclick={() => scrollSyncEnabled.update(v => !v)}
          >
            {$scrollSyncEnabled ? '开启' : '关闭'}
          </button>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">专注模式</span>
          <span class="setting-desc">无干扰写作模式 (Ctrl+Shift+F)</span>
        </div>
        <div class="toggle-group">
          <button
            class="toggle-btn"
            class:active={$focusMode}
            onclick={() => focusMode.update(v => !v)}
          >
            {$focusMode ? '开启' : '关闭'}
          </button>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">亚克力材质</span>
          <span class="setting-desc">全局窗口背景模糊效果（Windows）</span>
        </div>
        <div class="toggle-group">
          <button
            class="toggle-btn"
            class:active={$acrylicEnabled}
            onclick={handleAcrylicToggle}
          >
            {$acrylicEnabled ? '开启' : '关闭'}
          </button>
        </div>
      </div>

      <!-- Font Settings -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">字体</span>
          <span class="setting-desc">编辑器字体设置</span>
        </div>
        <div class="toggle-group">
          {#each PRESET_FONTS as font}
            <button
              class="toggle-btn"
              class:active={currentFontName === font.label}
              onclick={() => handleFontPreset(font.value, font.label)}
            >
              {font.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">字体大小</span>
          <span class="setting-desc">当前: {$fontSize}px</span>
        </div>
        <div class="toggle-group">
          <input
            type="range"
            min="12"
            max="32"
            value={$fontSize}
            oninput={(e) => fontSize.set(Number(e.currentTarget.value))}
          />
          <span class="font-size-value">{$fontSize}px</span>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">自定义字体</span>
          <span class="setting-desc">上传自定义字体 (最多 5 个)</span>
        </div>
        <div class="toggle-group">
          <button class="toggle-btn" onclick={handleUploadFont}>
            + 上传字体
          </button>
        </div>
        {#if $customFonts.length > 0}
          <div class="custom-fonts-list">
            {#each $customFonts as font}
              <div class="custom-font-item">
                <span>{font.name}</span>
                <button class="remove-font-btn" onclick={() => handleRemoveCustomFont(font.name)} title="移除">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">文件关联</span>
          <span class="setting-desc">将 PureDraft 设为 .md 文件默认打开程序</span>
        </div>
        <div class="assoc-group">
          {#if isDefaultEditor}
            <span class="assoc-status assoc-active">已是默认</span>
          {:else}
            <button
              class="mode-btn"
              onclick={handleSetDefault}
              disabled={assocLoading}
            >
              {assocLoading ? '设置中...' : '设为默认'}
            </button>
          {/if}
          {#if assocMessage}
            <span class="assoc-message" class:success={isDefaultEditor}>{assocMessage}</span>
          {/if}
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">快捷键</span>
        </div>
        <div class="shortcuts-list">
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>O</kbd><span>打开文件</span></div>
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>S</kbd><span>保存 & 格式化</span></div>
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd><span>另存为</span></div>
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>N</kbd><span>新建文件</span></div>
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>B</kbd><span>侧边栏</span></div>
          <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd><span>专注模式</span></div>
        </div>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .settings-panel {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-elevated);
    width: 440px;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    background: var(--color-bg-secondary);
    z-index: 1;
  }

  .panel-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-ink);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    color: var(--color-btn-icon);
    transition: all 120ms ease;
  }

  .close-btn:hover {
    background: var(--color-btn-bg-hover);
    color: var(--color-btn-icon-hover);
  }

  .panel-body {
    padding: 4px 0;
  }

  .setting-row {
    padding: 14px 20px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .setting-row:last-child {
    border-bottom: none;
  }

  .setting-info {
    margin-bottom: 10px;
  }

  .setting-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-ink);
    margin-bottom: 3px;
  }

  .setting-desc {
    font-size: 12px;
    color: var(--color-slate);
  }

  .toggle-group {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-btn-icon);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition: all 120ms ease;
  }

  .toggle-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-btn-icon-hover);
  }

  .toggle-btn.active {
    border-color: var(--color-accent);
    background: rgba(79, 193, 255, 0.1);
    color: var(--color-accent);
    font-weight: 600;
  }

  .shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-slate);
  }

  .shortcut-item kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    padding: 1px 5px;
    font-size: 10px;
    font-family: var(--font-mono);
    font-weight: 600;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 3px;
    color: var(--color-ink);
  }

  .shortcut-item span {
    margin-left: auto;
  }

  .font-size-value {
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--color-accent);
    font-weight: 600;
    min-width: 36px;
    text-align: center;
  }

  .custom-fonts-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
  }

  .custom-font-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    background: var(--color-bg);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    font-size: 12px;
    color: var(--color-ink);
  }

  .remove-font-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 3px;
    color: var(--color-slate);
    transition: all 100ms ease;
  }

  .remove-font-btn:hover {
    color: #e5534b;
    background: rgba(229, 83, 75, 0.12);
  }

  input[type="range"] {
    accent-color: var(--color-accent);
    width: 120px;
  }

  .accent-group {
    display: flex;
    gap: 8px;
  }

  .accent-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--accent-preview);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 120ms ease;
    border: 2px solid transparent;
  }

  .accent-btn:hover {
    transform: scale(1.1);
  }

  .accent-btn.active {
    border-color: var(--color-ink);
    box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--accent-preview);
  }

  .assoc-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .assoc-status {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: var(--radius-sm);
  }

  .assoc-active {
    background: rgba(74, 222, 128, 0.15);
    color: #4ade80;
  }

  .assoc-message {
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .assoc-message.success {
    color: #4ade80;
  }
</style>
