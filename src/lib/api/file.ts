import { cmd, type AppError } from "./index";
import type { FileContent, FileInfo, FileNode, ApiResponse } from "$lib/types";

export function readFile(path: string): Promise<[AppError | null, FileContent | null]> {
  return cmd<FileContent>("read_file", { path });
}

export function saveFile(path: string, content: string): Promise<[AppError | null, null]> {
  return cmd<void>("save_file", { path, content }) as Promise<[AppError | null, null]>;
}

export function saveFileAs(
  content: string,
  defaultName?: string,
): Promise<[AppError | null, string | null]> {
  return cmd<string>("save_file_as", { content, defaultName });
}

export function openFileDialog(): Promise<[AppError | null, FileInfo[] | null]> {
  return cmd<FileInfo[]>("open_file_dialog");
}

export function openFolder(path: string): Promise<[AppError | null, ApiResponse<FileNode> | null]> {
  return cmd<ApiResponse<FileNode>>("open_folder", { path });
}

export function readFileContent(path: string): Promise<[AppError | null, ApiResponse<FileNode> | null]> {
  return cmd<ApiResponse<FileNode>>("read_file_content", { path });
}

export function writeFile(
  path: string,
  content: string,
): Promise<[AppError | null, ApiResponse<FileNode> | null]> {
  return cmd<ApiResponse<FileNode>>("write_file", { path, content });
}
