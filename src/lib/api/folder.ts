import { openFolder, readFileContent, writeFile } from "$lib/api/file";
import type { FileNode } from "$lib/types";

export type { FileNode };

export async function openFolderTree(folderPath: string): Promise<FileNode | null> {
  const [err, result] = await openFolder(folderPath);
  if (err) {
    console.error("Failed to open folder:", err.message);
    return null;
  }
  if (result && result.success && result.data) {
    return result.data;
  }
  console.error("Failed to open folder:", result?.error);
  return null;
}

export async function readFileNode(filePath: string): Promise<FileNode | null> {
  const [err, result] = await readFileContent(filePath);
  if (err) {
    console.error("Error reading file:", err.message);
    return null;
  }
  if (result && result.success && result.data) {
    return result.data;
  }
  console.error("Failed to read file:", result?.error);
  return null;
}

export async function writeFileSync(
  filePath: string,
  content: string,
): Promise<FileNode | null> {
  const [err, result] = await writeFile(filePath, content);
  if (err) {
    console.error("Error writing file:", err.message);
    return null;
  }
  if (result && result.success && result.data) {
    return result.data;
  }
  console.error("Failed to write file:", result?.error);
  return null;
}
