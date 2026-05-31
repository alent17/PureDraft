export type FileType =
  | 'Markdown'
  | 'JavaScript'
  | 'TypeScript'
  | 'Jsx'
  | 'Tsx'
  | 'Css'
  | 'Html'
  | 'Xml'
  | 'Json'
  | 'Python'
  | 'Rust'
  | 'Go'
  | 'Java'
  | 'C'
  | 'Cpp'
  | 'Shell'
  | 'Yaml'
  | 'Toml'
  | 'PlainText';

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  fileType: FileType;
  isModified: boolean;
  cursor: { line: number; col: number };
}

export interface FileContent {
  content: string;
  fileType: string;
}

export interface FileInfo {
  path: string;
  name: string;
  content: string;
  fileType: string;
}

export interface FileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
  content?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface WindowState {
  isMaximized: boolean;
}

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

export interface RenameDialogConfig {
  title?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: (value: string) => void;
  onCancel?: () => void;
}
