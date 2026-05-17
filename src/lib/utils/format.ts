import * as prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserTypescript from "prettier/plugins/typescript";
import parserPostcss from "prettier/plugins/postcss";
import parserHtml from "prettier/plugins/html";
import parserMarkdown from "prettier/plugins/markdown";
import parserYaml from "prettier/plugins/yaml";
import parserEstree from "prettier/plugins/estree";
import type { FileType } from "../types";

interface ParserConfig {
  parser: string;
  plugins: any[];
}

let xmlPlugin: any = null;

async function getParserConfig(
  fileType: FileType,
): Promise<ParserConfig | null> {
  const basePlugins = [parserEstree];

  switch (fileType) {
    case "JavaScript":
    case "Jsx":
      return { parser: "babel", plugins: [...basePlugins, parserBabel] };

    case "TypeScript":
    case "Tsx":
      return {
        parser: "typescript",
        plugins: [...basePlugins, parserTypescript],
      };

    case "Css":
      return { parser: "css", plugins: [...basePlugins, parserPostcss] };

    case "Html":
      return { parser: "html", plugins: [...basePlugins, parserHtml] };

    case "Json":
      return { parser: "json", plugins: [...basePlugins, parserBabel] };

    case "Markdown":
      return { parser: "markdown", plugins: [...basePlugins, parserMarkdown] };

    case "Yaml":
      return { parser: "yaml", plugins: [...basePlugins, parserYaml] };

    case "Xml":
      if (!xmlPlugin) {
        xmlPlugin = await import("@prettier/plugin-xml");
      }
      return { parser: "xml", plugins: [xmlPlugin.default || xmlPlugin] };

    default:
      return null;
  }
}

export async function formatContent(
  content: string,
  fileType: FileType,
): Promise<string> {
  const config = await getParserConfig(fileType);
  if (!config) return content;

  try {
    return await prettier.format(content, {
      parser: config.parser,
      plugins: config.plugins,
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      trailingComma: "all",
    });
  } catch (e) {
    console.warn(`Format failed for ${fileType}:`, e);
    return content;
  }
}
