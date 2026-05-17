import type { OpenFile } from "../types";
import { get } from "svelte/store";
import { openFiles, currentFileIndex } from "../stores/file";

const STORAGE_KEY = "puredraft_state";

export interface SavedFile {
  path: string;
  name: string;
  cursor: { line: number; col: number };
  timestamp: number;
}

export interface SavedState {
  files: SavedFile[];
  activeIndex: number;
}

export function saveState() {
  const files = get(openFiles);
  const index = get(currentFileIndex);

  const savedFiles: SavedFile[] = files
    .filter((f) => f.path)
    .map((f) => ({
      path: f.path,
      name: f.name,
      cursor: f.cursor,
      timestamp: Date.now(),
    }));

  if (savedFiles.length === 0) return;

  const state: SavedState = {
    files: savedFiles,
    activeIndex: index,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

export function loadState(): SavedState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as SavedState;
  } catch (e) {
    console.error("Failed to load state:", e);
    return null;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear state:", e);
  }
}
