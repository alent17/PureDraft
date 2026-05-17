import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import go from "highlight.js/lib/languages/go";
import yaml from "highlight.js/lib/languages/yaml";
import sql from "highlight.js/lib/languages/sql";
import markdown from "highlight.js/lib/languages/markdown";
import hljsDarkTheme from "highlight.js/styles/atom-one-dark.css?inline";
import hljsLightTheme from "highlight.js/styles/github.css?inline";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("java", java);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("c", cpp);
hljs.registerLanguage("go", go);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("markdown", markdown);

const LATEX_INLINE_REGEX = /\$([^$\n]+?)\$/g;
const LATEX_BLOCK_REGEX = /\$\$([\s\S]+?)\$\$/g;
const MERMAID_REGEX = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;

export function processLatex(html: string): string {
  if (!html) return html;

  html = html.replace(LATEX_BLOCK_REGEX, (_match: string, formula: string) => {
    try {
      return `<div class="katex-block">${renderLatex(formula.trim(), true)}</div>`;
    } catch {
      return _match;
    }
  });

  html = html.replace(LATEX_INLINE_REGEX, (_match: string, formula: string) => {
    try {
      return `<span class="katex-inline">${renderLatex(formula.trim(), false)}</span>`;
    } catch {
      return _match;
    }
  });

  return html;
}

function renderLatex(formula: string, displayMode: boolean): string {
  return `<code>${escapeHtml(formula)}</code>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function processMermaid(html: string): string {
  if (!html) return html;

  return html.replace(MERMAID_REGEX, (_match: string, code: string) => {
    const id = 'mermaid-' + Math.random().toString(36).slice(2, 9);
    const decoded = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    return `<div class="mermaid-container"><pre class="mermaid" id="${id}">${escapeHtml(decoded)}</pre></div>`;
  });
}

export function createMarkedInstance(mode: string = "dark") {
  if (typeof document === "undefined") {
    return new Marked();
  }

  let styleEl = document.getElementById("hljs-theme-style") as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "hljs-theme-style";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = mode === "light" ? hljsLightTheme : hljsDarkTheme;

  return new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch {
            return hljs.highlightAuto(code).value;
          }
        }
        return hljs.highlightAuto(code).value;
      },
    }),
  );
}

export const markedInstance = createMarkedInstance("dark");
markedInstance.use({ gfm: true, breaks: true });
