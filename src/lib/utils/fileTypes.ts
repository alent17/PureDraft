import type { Extension } from "@codemirror/state";
import type { FileType } from "../types";
import { markdown } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { xml } from "@codemirror/lang-xml";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { cpp } from "@codemirror/lang-cpp";
import { yaml } from "@codemirror/lang-yaml";
import { java } from "@codemirror/lang-java";
import { go } from "@codemirror/lang-go";

export function getLanguageExtension(fileType: FileType): Extension {
  switch (fileType) {
    case "Markdown":
      return markdown();
    case "JavaScript":
      return javascript();
    case "TypeScript":
      return javascript({ typescript: true });
    case "Jsx":
      return javascript({ jsx: true });
    case "Tsx":
      return javascript({ typescript: true, jsx: true });
    case "Css":
      return css();
    case "Html":
      return html();
    case "Xml":
      return xml();
    case "Json":
      return json();
    case "Python":
      return python();
    case "Rust":
      return rust();
    case "Go":
      return go();
    case "Java":
      return java();
    case "C":
      return cpp();
    case "Cpp":
      return cpp();
    case "Shell":
      return [];
    case "Yaml":
      return yaml();
    case "Toml":
      return [];
    default:
      return [];
  }
}

const EXT_MAP: Record<string, FileType> = {
  ".md": "Markdown",
  ".markdown": "Markdown",
  ".js": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".ts": "TypeScript",
  ".mts": "TypeScript",
  ".cts": "TypeScript",
  ".jsx": "Jsx",
  ".tsx": "Tsx",
  ".css": "Css",
  ".scss": "Css",
  ".html": "Html",
  ".htm": "Html",
  ".xml": "Xml",
  ".json": "Json",
  ".py": "Python",
  ".rs": "Rust",
  ".go": "Go",
  ".java": "Java",
  ".c": "C",
  ".h": "C",
  ".cpp": "Cpp",
  ".hpp": "Cpp",
  ".cc": "Cpp",
  ".cxx": "Cpp",
  ".sh": "Shell",
  ".bash": "Shell",
  ".zsh": "Shell",
  ".yaml": "Yaml",
  ".yml": "Yaml",
  ".toml": "Toml",
  ".txt": "PlainText",
};

export interface ExtensionOption {
  ext: string;
  label: string;
  fileType: FileType;
}

export const EXTENSION_OPTIONS: ExtensionOption[] = [
  { ext: ".txt", label: "Plain Text", fileType: "PlainText" },
  { ext: ".md", label: "Markdown", fileType: "Markdown" },
  { ext: ".html", label: "HTML", fileType: "Html" },
  { ext: ".css", label: "CSS", fileType: "Css" },
  { ext: ".js", label: "JavaScript", fileType: "JavaScript" },
  { ext: ".ts", label: "TypeScript", fileType: "TypeScript" },
  { ext: ".jsx", label: "JSX", fileType: "Jsx" },
  { ext: ".tsx", label: "TSX", fileType: "Tsx" },
  { ext: ".json", label: "JSON", fileType: "Json" },
  { ext: ".py", label: "Python", fileType: "Python" },
  { ext: ".rs", label: "Rust", fileType: "Rust" },
  { ext: ".go", label: "Go", fileType: "Go" },
  { ext: ".java", label: "Java", fileType: "Java" },
  { ext: ".c", label: "C", fileType: "C" },
  { ext: ".cpp", label: "C++", fileType: "Cpp" },
  { ext: ".sh", label: "Shell", fileType: "Shell" },
  { ext: ".yaml", label: "YAML", fileType: "Yaml" },
  { ext: ".xml", label: "XML", fileType: "Xml" },
  { ext: ".toml", label: "TOML", fileType: "Toml" },
];

export function getFileType(filename: string): FileType {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot < 0) return "PlainText";
  const ext = filename.slice(lastDot).toLowerCase();
  return EXT_MAP[ext] || "PlainText";
}

export function isMarkdown(fileType: FileType): boolean {
  return fileType === "Markdown";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isFormattable(fileType: FileType): boolean {
  return [
    "JavaScript",
    "TypeScript",
    "Jsx",
    "Tsx",
    "Css",
    "Html",
    "Xml",
    "Json",
    "Markdown",
    "Yaml",
  ].includes(fileType);
}
