import { writable } from 'svelte/store';
import {
  persistedBoolean,
  persistedNumber,
  persistedString,
  persistedJson,
} from '$lib/utils/persistedStore';
import type { CustomFont, ConfirmDialogConfig, RenameDialogConfig } from '$lib/types';

export type { CustomFont, ConfirmDialogConfig, RenameDialogConfig };
export type ActiveTab = 'edit' | 'preview' | 'split';
export type SidebarTab = 'outline' | 'recent';
export type Mode = 'dark' | 'light';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';
export type AutoSaveInterval = 'off' | '10' | '30' | '60' | '120';
export type SyncStatus = 'idle' | 'syncing' | 'error';

export const ACCENT_COLORS: Record<
  AccentColor,
  { accent: string; hover: string; statusbar: string; selection: string }
> = {
  blue: {
    accent: '#60cdff',
    hover: '#88d8ff',
    statusbar: '#0078d4',
    selection: 'rgba(96,205,255,0.25)',
  },
  purple: {
    accent: '#b27eff',
    hover: '#c99dff',
    statusbar: '#7c3aed',
    selection: 'rgba(178,126,255,0.25)',
  },
  green: {
    accent: '#4ade80',
    hover: '#6ee7a0',
    statusbar: '#16a34a',
    selection: 'rgba(74,222,128,0.25)',
  },
  orange: {
    accent: '#fb923c',
    hover: '#fdba74',
    statusbar: '#ea580c',
    selection: 'rgba(251,146,60,0.25)',
  },
  red: {
    accent: '#f87171',
    hover: '#fca5a5',
    statusbar: '#dc2626',
    selection: 'rgba(248,113,113,0.25)',
  },
  pink: {
    accent: '#f472b6',
    hover: '#f9a8d4',
    statusbar: '#db2777',
    selection: 'rgba(244,114,182,0.25)',
  },
};

const DEFAULT_FONT_FAMILY = "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, monospace";

function createUiStore() {
  const activeTab = writable<ActiveTab>('edit');
  const sidebarOpen = persistedBoolean('puredraft_sidebar', true);
  const sidebarTab = writable<SidebarTab>('outline');
  const isMaximized = writable<boolean>(false);
  const mode = persistedString('puredraft_mode', 'dark') as import('svelte/store').Writable<Mode>;
  const accentColor = persistedString(
    'puredraft_accent',
    'blue',
  ) as import('svelte/store').Writable<AccentColor>;
  const toolbarOpen = writable<boolean>(true);
  const settingsOpen = writable<boolean>(false);
  const scrollSyncEnabled = writable<boolean>(true);
  const hoverPreviewEnabled = writable<boolean>(false);
  const acrylicEnabled = persistedBoolean('puredraft_acrylic', true);
  const syncStatus = writable<SyncStatus>('idle');
  const focusMode = writable<boolean>(false);
  const typewriterMode = writable<boolean>(false);
  const paragraphFocus = writable<boolean>(false);
  const autoSaveInterval = writable<AutoSaveInterval>('30');
  const fontSize = persistedNumber('puredraft_fontSize', 14);
  const fontFamily = persistedString('puredraft_fontFamily', DEFAULT_FONT_FAMILY);
  const customFonts = persistedJson<CustomFont[]>('puredraft_customFonts', []);
  const saveSlotsOpen = writable<boolean>(false);
  const confirmDialogOpen = writable<boolean>(false);
  const confirmDialogConfig = writable<ConfirmDialogConfig | null>(null);
  const renameDialogOpen = writable<boolean>(false);
  const renameDialogConfig = writable<RenameDialogConfig | null>(null);

  return {
    activeTab,
    sidebarOpen,
    sidebarTab,
    isMaximized,
    mode,
    accentColor,
    toolbarOpen,
    settingsOpen,
    scrollSyncEnabled,
    hoverPreviewEnabled,
    acrylicEnabled,
    syncStatus,
    focusMode,
    typewriterMode,
    paragraphFocus,
    autoSaveInterval,
    fontSize,
    fontFamily,
    customFonts,
    saveSlotsOpen,
    confirmDialogOpen,
    confirmDialogConfig,
    renameDialogOpen,
    renameDialogConfig,

    openConfirmDialog(config: ConfirmDialogConfig) {
      confirmDialogConfig.set(config);
      confirmDialogOpen.set(true);
    },

    closeConfirmDialog() {
      confirmDialogOpen.set(false);
      confirmDialogConfig.set(null);
    },

    openRenameDialog(config: RenameDialogConfig) {
      renameDialogConfig.set(config);
      renameDialogOpen.set(true);
    },

    closeRenameDialog() {
      renameDialogOpen.set(false);
      renameDialogConfig.set(null);
    },

    toggleSidebar() {
      sidebarOpen.update((v) => !v);
    },

    toggleToolbar() {
      toolbarOpen.update((v) => !v);
    },

    toggleSettings() {
      settingsOpen.update((v) => !v);
    },

    setMode(newMode: Mode) {
      mode.set(newMode);
    },

    toggleMode() {
      mode.update((m) => (m === 'dark' ? 'light' : 'dark'));
    },

    setSidebarTab(tab: SidebarTab) {
      sidebarTab.set(tab);
    },
  };
}

export const uiStore = createUiStore();
export const activeTab = uiStore.activeTab;
export const sidebarOpen = uiStore.sidebarOpen;
export const sidebarTab = uiStore.sidebarTab;
export const isMaximized = uiStore.isMaximized;
export const mode = uiStore.mode;
export const accentColor = uiStore.accentColor;
export const toolbarOpen = uiStore.toolbarOpen;
export const settingsOpen = uiStore.settingsOpen;
export const scrollSyncEnabled = uiStore.scrollSyncEnabled;
export const hoverPreviewEnabled = uiStore.hoverPreviewEnabled;
export const acrylicEnabled = uiStore.acrylicEnabled;
export const syncStatus = uiStore.syncStatus;
export const focusMode = uiStore.focusMode;
export const typewriterMode = uiStore.typewriterMode;
export const paragraphFocus = uiStore.paragraphFocus;
export const autoSaveInterval = uiStore.autoSaveInterval;
export const fontSize = uiStore.fontSize;
export const fontFamily = uiStore.fontFamily;
export const customFonts = uiStore.customFonts;
export const saveSlotsOpen = uiStore.saveSlotsOpen;
export const confirmDialogOpen = uiStore.confirmDialogOpen;
export const confirmDialogConfig = uiStore.confirmDialogConfig;
export const renameDialogOpen = uiStore.renameDialogOpen;
export const renameDialogConfig = uiStore.renameDialogConfig;
export const openConfirmDialog = uiStore.openConfirmDialog;
export const closeConfirmDialog = uiStore.closeConfirmDialog;
export const openRenameDialog = uiStore.openRenameDialog;
export const closeRenameDialog = uiStore.closeRenameDialog;
