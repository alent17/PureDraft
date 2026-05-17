use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FileType {
    Markdown,
    JavaScript,
    TypeScript,
    Jsx,
    Tsx,
    Css,
    Html,
    Xml,
    Json,
    Python,
    Rust,
    Go,
    Java,
    C,
    Cpp,
    Shell,
    Yaml,
    Toml,
    PlainText,
}

impl FileType {
    pub fn from_path(path: &str) -> Self {
        let ext = std::path::Path::new(path)
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase())
            .unwrap_or_default();

        match ext.as_str() {
            "md" | "markdown" => FileType::Markdown,
            "js" | "mjs" | "cjs" => FileType::JavaScript,
            "ts" | "mts" | "cts" => FileType::TypeScript,
            "jsx" => FileType::Jsx,
            "tsx" => FileType::Tsx,
            "css" | "scss" => FileType::Css,
            "html" | "htm" => FileType::Html,
            "xml" => FileType::Xml,
            "json" => FileType::Json,
            "py" => FileType::Python,
            "rs" => FileType::Rust,
            "go" => FileType::Go,
            "java" => FileType::Java,
            "c" | "h" => FileType::C,
            "cpp" | "hpp" | "cc" | "cxx" => FileType::Cpp,
            "sh" | "bash" | "zsh" => FileType::Shell,
            "yaml" | "yml" => FileType::Yaml,
            "toml" => FileType::Toml,
            _ => FileType::PlainText,
        }
    }
}

impl std::fmt::Display for FileType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FileType::Markdown => write!(f, "Markdown"),
            FileType::JavaScript => write!(f, "JavaScript"),
            FileType::TypeScript => write!(f, "TypeScript"),
            FileType::Jsx => write!(f, "JSX"),
            FileType::Tsx => write!(f, "TSX"),
            FileType::Css => write!(f, "CSS"),
            FileType::Html => write!(f, "HTML"),
            FileType::Xml => write!(f, "XML"),
            FileType::Json => write!(f, "JSON"),
            FileType::Python => write!(f, "Python"),
            FileType::Rust => write!(f, "Rust"),
            FileType::Go => write!(f, "Go"),
            FileType::Java => write!(f, "Java"),
            FileType::C => write!(f, "C"),
            FileType::Cpp => write!(f, "C++"),
            FileType::Shell => write!(f, "Shell"),
            FileType::Yaml => write!(f, "YAML"),
            FileType::Toml => write!(f, "TOML"),
            FileType::PlainText => write!(f, "Plain Text"),
        }
    }
}
