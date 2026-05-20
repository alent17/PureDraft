import { writable } from "svelte/store";

export type ActiveTab = "edit" | "preview" | "split";
export type SidebarTab = "outline" | "recent";
export type Mode = "dark" | "light";
export type AutoSaveInterval = "off" | "10" | "30" | "60" | "120";
export type SyncStatus = "idle" | "syncing" | "error";

export interface CustomFont {
  name: string;
  dataUrl: string;
}

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  danger?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const DEFAULT_FONT_FAMILY = "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, monospace";

function createUiStore() {
  const activeTab = writable<ActiveTab>("edit");
  const savedSidebar = typeof localStorage !== 'undefined' ? localStorage.getItem('puredraft_sidebar') : null;
  const sidebarOpen = writable<boolean>(savedSidebar !== null ? savedSidebar === 'true' : true);
  sidebarOpen.subscribe(v => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('puredraft_sidebar', String(v));
  });
  const sidebarTab = writable<SidebarTab>("outline");
  const isMaximized = writable<boolean>(false);
  const mode = writable<Mode>("dark");
  const toolbarOpen = writable<boolean>(true);
  const settingsOpen = writable<boolean>(false);
  const scrollSyncEnabled = writable<boolean>(true);
  const hoverPreviewEnabled = writable<boolean>(false);
  const savedAcrylic = typeof localStorage !== 'undefined' ? localStorage.getItem('puredraft_acrylic') : null;
  const acrylicEnabled = writable<boolean>(savedAcrylic !== null ? savedAcrylic === 'true' : true);
  acrylicEnabled.subscribe(v => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('puredraft_acrylic', String(v));
  });
  const syncStatus = writable<SyncStatus>("idle");
  const focusMode = writable<boolean>(false);
  const typewriterMode = writable<boolean>(false);
  const paragraphFocus = writable<boolean>(false);
  const autoSaveInterval = writable<AutoSaveInterval>("30");
  const savedFontSize = typeof localStorage !== 'undefined' ? localStorage.getItem('puredraft_fontSize') : null;
  const fontSize = writable<number>(savedFontSize ? parseInt(savedFontSize) : 14);
  fontSize.subscribe(v => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('puredraft_fontSize', String(v));
  });
  const savedFontFamily = typeof localStorage !== 'undefined' ? localStorage.getItem('puredraft_fontFamily') : null;
  const fontFamily = writable<string>(savedFontFamily || DEFAULT_FONT_FAMILY);
  fontFamily.subscribe(v => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('puredraft_fontFamily', v);
  });
  const savedCustomFonts = typeof localStorage !== 'undefined' ? localStorage.getItem('puredraft_customFonts') : null;
  const customFonts = writable<CustomFont[]>(savedCustomFonts ? JSON.parse(savedCustomFonts) : []);
  customFonts.subscribe(v => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('puredraft_customFonts', JSON.stringify(v));
  });
  const saveSlotsOpen = writable<boolean>(false);
  const confirmDialogOpen = writable<boolean>(false);
  const confirmDialogConfig = writable<ConfirmDialogConfig | null>(null);

  return {
    activeTab,
    sidebarOpen,
    sidebarTab,
    isMaximized,
    mode,
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

    openConfirmDialog(config: ConfirmDialogConfig) {
      confirmDialogConfig.set(config);
      confirmDialogOpen.set(true);
    },

    closeConfirmDialog() {
      confirmDialogOpen.set(false);
      confirmDialogConfig.set(null);
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
      mode.update((m) => (m === "dark" ? "light" : "dark"));
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
export const openConfirmDialog = uiStore.openConfirmDialog;
export const closeConfirmDialog = uiStore.closeConfirmDialog;
