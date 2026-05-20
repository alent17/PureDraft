import { markedInstance } from '$lib/utils/markdown';
import { processLatex, processMermaid } from '$lib/utils/markdown';
import { mode } from '$lib/stores/ui';
import { get } from 'svelte/store';

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1, h2, h3, h4, h5, h6 { margin: 1.5em 0 0.8em 0; font-weight: 600; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.6em; }
    h3 { font-size: 1.3em; }
    p { margin: 1em 0; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    li { margin: 0.5em 0; }
    blockquote {
      border-left: 4px solid #4fc3f7;
      padding-left: 1em;
      margin: 1em 0;
      font-style: italic;
    }
    pre {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 1em;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'Fira Code', 'Consolas', monospace;
    }
    code {
      font-family: 'Fira Code', 'Consolas', monospace;
      padding: 0.2em 0.4em;
      background: rgba(0, 0, 0, 0.08);
      border-radius: 3px;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f5f5f5;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    a {
      color: #4fc3f7;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 2em 0;
    }
    .katex { font-size: 1.1em; }
    .mermaid {
      text-align: center;
      margin: 1em 0;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
  <style id="theme-style"></style>
</head>
<body>
  <article>{{content}}</article>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>`;

function applyDarkTheme() {
  return `
    body { background: #1e1e1e; color: #d4d4d4; }
    h1, h2, h3, h4, h5, h6 { color: #e0e0e0; }
    blockquote { border-left-color: #4fc3f7; color: #aaa; }
    th { background: #2d2d2d; }
    th, td { border-color: #444; }
    code { background: rgba(255, 255, 255, 0.1); }
    a { color: #4fc3f7; }
  `;
}

export function exportToHTML(content: string, fileName: string = 'document'): void {
  if (!content) {
    alert('没有内容可导出');
    return;
  }

  let html = markedInstance.parse(content) as string;
  html = processLatex(html);
  html = processMermaid(html);

  const themeStyle = get(mode) === 'dark' ? applyDarkTheme() : '';
  const fullHtml = HTML_TEMPLATE
    .replace('{{title}}', fileName)
    .replace('{{content}}', html)
    .replace('<style id="theme-style"></style>', `<style id="theme-style">${themeStyle}</style>`);

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printDocument(): void {
  window.print();
}
