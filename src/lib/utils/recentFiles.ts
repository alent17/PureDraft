const RECENT_KEY = "puredraft_recent";
const MAX_RECENT = 20;

export interface RecentFileEntry {
  path: string;
  name: string;
  lastOpened: number;
}

export function getRecentFiles(): RecentFileEntry[] {
  try {
    const data = localStorage.getItem(RECENT_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.sort((a: RecentFileEntry, b: RecentFileEntry) => b.lastOpened - a.lastOpened);
    }
    return [];
  } catch {
    return [];
  }
}

export function addRecentFile(path: string, name: string): void {
  if (!path) return;
  try {
    const files = getRecentFiles();
    const existing = files.findIndex(f => f.path === path);
    const entry: RecentFileEntry = { path, name, lastOpened: Date.now() };

    if (existing >= 0) {
      files[existing] = entry;
    } else {
      files.unshift(entry);
      if (files.length > MAX_RECENT) files.pop();
    }

    files.sort((a, b) => b.lastOpened - a.lastOpened);
    localStorage.setItem(RECENT_KEY, JSON.stringify(files));
  } catch {
    // silent fail
  }
}

export function removeRecentFile(path: string): void {
  try {
    const files = getRecentFiles().filter(f => f.path !== path);
    localStorage.setItem(RECENT_KEY, JSON.stringify(files));
  } catch {
    // silent fail
  }
}

export function clearRecentFiles(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // silent fail
  }
}
