import { open } from "@tauri-apps/plugin-dialog";
import * as fileApi from "$lib/api/file";
import * as windowApi from "$lib/api/window";
import type { FileInfo } from "$lib/types";

export const readFile = fileApi.readFile;
export const saveFile = fileApi.saveFile;
export const saveFileAs = fileApi.saveFileAs;
export const minimizeWindow = windowApi.minimizeWindow;
export const toggleMaximize = windowApi.toggleMaximize;
export const closeWindow = windowApi.closeWindow;
export const isMaximized = windowApi.isMaximized;

export async function openFileDialog(): Promise<FileInfo[] | null> {
  try {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Supported Files",
          extensions: [
            "txt", "md", "html", "htm", "css",
            "js", "mjs", "cjs", "ts", "mts", "cts",
            "jsx", "tsx", "json", "py", "rs", "go",
            "java", "c", "h", "cpp", "hpp", "cc",
            "sh", "bash", "zsh", "yaml", "yml", "toml", "xml",
          ],
        },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!selected) return null;

    const paths = Array.isArray(selected) ? selected : [selected];
    const files: FileInfo[] = [];

    for (const path of paths) {
      const [, content] = await fileApi.readFile(path);
      if (content) {
        const name = path.split(/[\\/]/).pop() || "untitled";
        files.push({
          path,
          name,
          content: content.content,
          fileType: content.fileType,
        });
      } else {
        console.error(`Failed to read file: ${path}`);
      }
    }

    return files.length > 0 ? files : null;
  } catch (error) {
    console.error("Tauri dialog not available, using browser fallback");
    return null;
  }
}

export async function openImageDialog(): Promise<string | null> {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"] },
      ],
    });
    if (!selected) return null;
    return selected as string;
  } catch {
    return null;
  }
}
