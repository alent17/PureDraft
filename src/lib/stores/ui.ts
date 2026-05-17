import { writable } from "svelte/store";

export type ActiveTab = "edit" | "preview" | "split";
export type SidebarTab = "outline" | "recent";
export type Mode = "dark" | "light";
export type AutoSaveInterval = "off" | "10" | "30" | "60" | "120";
export type SyncStatus = "idle" | "syncing" | "error";

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
  const fontSize = writable<number>(14);
  const saveSlotsOpen = writable<boolean>(false);

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
    saveSlotsOpen,

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
export const saveSlotsOpen = uiStore.saveSlotsOpen;
