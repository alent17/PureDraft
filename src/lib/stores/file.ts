import { writable, derived, get } from "svelte/store";
import type { OpenFile } from "$lib/types";

function createFileStore() {
  const { subscribe, set, update } = writable<OpenFile[]>([]);
  const currentIndex = writable<number>(-1);

  const current = derived(
    [{ subscribe }, currentIndex],
    ([$files, $index]) => {
      if ($index >= 0 && $index < $files.length) {
        return $files[$index];
      }
      return null;
    },
  );

  return {
    subscribe,
    set,
    update,
    currentIndex,
    current,
    
    add(file: OpenFile) {
      update((files) => {
        const existingIndex = files.findIndex((f) => f.path === file.path);
        if (existingIndex >= 0) {
          currentIndex.set(existingIndex);
          return files;
        }
        const newIndex = files.length;
        currentIndex.set(newIndex);
        return [...files, file];
      });
    },

    close(index: number) {
      update((files) => {
        const newFiles = files.filter((_, i) => i !== index);
        currentIndex.update((current) => {
          if (newFiles.length === 0) return -1;
          if (index < current) return current - 1;
          if (index === current) return Math.min(current, newFiles.length - 1);
          return current;
        });
        return newFiles;
      });
    },

    updateContent(index: number, content: string) {
      update((files) => {
        return files.map((file, i) => {
          if (i !== index) return file;
          return {
            ...file,
            content,
            isModified: content !== file.originalContent,
          };
        });
      });
    },

    markSaved(index: number) {
      update((files) => {
        return files.map((file, i) => {
          if (i !== index) return file;
          return {
            ...file,
            originalContent: file.content,
            isModified: false,
          };
        });
      });
    },

    updateCursor(index: number, line: number, col: number) {
      update((files) => {
        return files.map((file, i) => {
          if (i !== index) return file;
          return { ...file, cursor: { line, col } };
        });
      });
    },

    switchTo(index: number) {
      currentIndex.set(index);
    },

    getUntitled(content: string = ""): OpenFile {
      return {
        path: "",
        name: "untitled.txt",
        content,
        originalContent: content,
        fileType: "PlainText",
        isModified: false,
        cursor: { line: 1, col: 1 },
      };
    },

    clear() {
      set([]);
      currentIndex.set(-1);
    },
  };
}

export const fileStore = createFileStore();
export const openFiles = fileStore;
export const currentFileIndex = fileStore.currentIndex;
export const currentFile = fileStore.current;
export const addFile = fileStore.add;
export const closeFile = fileStore.close;
export const updateFileContent = fileStore.updateContent;
export const markFileSaved = fileStore.markSaved;
export const updateCursor = fileStore.updateCursor;
export const switchToFile = fileStore.switchTo;
export const getUntitledFile = fileStore.getUntitled;
