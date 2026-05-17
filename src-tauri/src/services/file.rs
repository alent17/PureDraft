use crate::error::AppError;
use crate::models::{FileContent, FileInfo, FileNode, FileKind, ApiResponse};
use crate::utils::file_type::FileType;
use std::fs;
use std::path::Path;
use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, FilePath};
use std::sync::mpsc;
use tracing::{info, warn};

pub struct FileService;

impl FileService {
    pub fn new() -> Self {
        Self
    }

    pub fn read_file(&self, path: &str) -> Result<FileContent, AppError> {
        info!("Reading file: {}", path);
        let content = fs::read_to_string(path)?;
        let file_type = FileType::from_path(path);
        Ok(FileContent {
            content,
            file_type: file_type.to_string(),
        })
    }

    pub fn save_file(&self, path: &str, content: &str) -> Result<(), AppError> {
        info!("Saving file: {}", path);
        fs::write(path, content)?;
        Ok(())
    }

    pub async fn save_file_as(
        &self,
        app: &AppHandle,
        content: &str,
        default_name: Option<&str>,
    ) -> Result<String, AppError> {
        let name = default_name.unwrap_or("untitled.txt");

        let (tx, rx) = mpsc::channel::<Option<FilePath>>();

        app.dialog()
            .file()
            .set_file_name(name)
            .add_filter("Text Files", &[
                "txt", "md", "html", "css", "js", "ts", "json", "py", "rs",
                "go", "java", "c", "cpp", "h", "hpp", "sh", "yaml", "yml",
                "toml", "xml", "jsx", "tsx",
            ])
            .add_filter("All Files", &["*"])
            .save_file(move |path| {
                let _ = tx.send(path);
            });

        let file_path = rx
            .recv()?
            .ok_or(AppError::NoSelection)?;

        let path = match file_path {
            FilePath::Path(p) => p,
            FilePath::Url(u) => {
                return Err(AppError::UrlNotSupported(u.to_string()));
            }
        };

        let path_str = path.to_string_lossy().to_string();
        info!("Saving file as: {}", path_str);
        fs::write(&path, content)?;
        Ok(path_str)
    }

    pub async fn open_file_dialog(&self, app: &AppHandle) -> Result<Vec<FileInfo>, AppError> {
        let (tx, rx) = mpsc::channel::<Option<Vec<FilePath>>>();

        app.dialog()
            .file()
            .add_filter("Supported Files", &[
                "txt", "md", "html", "css", "js", "ts", "json", "py", "rs",
                "go", "java", "c", "cpp", "h", "hpp", "sh", "yaml", "yml",
                "toml", "xml", "jsx", "tsx",
            ])
            .add_filter("All Files", &["*"])
            .pick_files(move |paths| {
                let _ = tx.send(paths);
            });

        let file_paths = rx
            .recv()?
            .ok_or(AppError::NoSelection)?;

        let mut files = Vec::new();
        for file_path in file_paths {
            let path = match file_path {
                FilePath::Path(p) => p,
                FilePath::Url(u) => {
                    warn!("Skipping URL path: {}", u);
                    continue;
                }
            };

            let content = fs::read_to_string(&path)?;
            let name = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let path_str = path.to_string_lossy().to_string();
            let file_type = FileType::from_path(&path_str);

            files.push(FileInfo {
                path: path_str,
                name,
                content,
                file_type: file_type.to_string(),
            });
        }

        info!("Opened {} files", files.len());
        Ok(files)
    }

    pub fn open_folder(&self, folder_path: &str) -> Result<ApiResponse<FileNode>, AppError> {
        info!("Opening folder: {}", folder_path);
        let path = Path::new(folder_path);
        
        if !path.exists() {
            return Ok(ApiResponse::error("文件夹不存在"));
        }

        if !path.is_dir() {
            return Ok(ApiResponse::error("路径不是文件夹"));
        }

        let node = self.build_file_tree(path)?;
        Ok(ApiResponse::success(node))
    }

    fn build_file_tree(&self, path: &Path) -> Result<FileNode, AppError> {
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        
        let path_str = path.to_string_lossy().to_string();
        
        let metadata = fs::metadata(path)?;
        let size = Some(metadata.len());
        let modified = metadata.modified()
            .ok()
            .and_then(|t| {
                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                Some(datetime.to_rfc3339())
            });

        if path.is_dir() {
            let mut children = Vec::new();
            if let Ok(entries) = fs::read_dir(path) {
                for entry in entries.flatten() {
                    if let Ok(child) = self.build_file_tree(&entry.path()) {
                        children.push(child);
                    }
                }
            }
            
            children.sort_by(|a, b| {
                match (&a.kind, &b.kind) {
                    (FileKind::Directory, FileKind::File) => std::cmp::Ordering::Less,
                    (FileKind::File, FileKind::Directory) => std::cmp::Ordering::Greater,
                    _ => a.name.cmp(&b.name),
                }
            });

            Ok(FileNode {
                name,
                path: path_str,
                kind: FileKind::Directory,
                size,
                modified,
                children: Some(children),
                content: None,
            })
        } else {
            Ok(FileNode {
                name,
                path: path_str,
                kind: FileKind::File,
                size,
                modified,
                children: None,
                content: None,
            })
        }
    }

    pub fn read_file_content(&self, path: &str) -> Result<ApiResponse<FileNode>, AppError> {
        info!("Reading file content: {}", path);
        let file_path = Path::new(path);
        
        if !file_path.exists() {
            return Ok(ApiResponse::error("文件不存在"));
        }

        let content = fs::read_to_string(file_path)?;
        let name = file_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        
        let metadata = fs::metadata(file_path)?;
        let size = Some(metadata.len());
        let modified = metadata.modified()
            .ok()
            .and_then(|t| {
                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                Some(datetime.to_rfc3339())
            });

        Ok(ApiResponse::success(FileNode {
            name,
            path: path.to_string(),
            kind: FileKind::File,
            size,
            modified,
            children: None,
            content: Some(content),
        }))
    }

    pub fn write_file(&self, path: &str, content: &str) -> Result<ApiResponse<FileNode>, AppError> {
        info!("Writing file: {}", path);
        if let Some(parent) = Path::new(path).parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
                info!("Created parent directories: {}", parent.display());
            }
        }
        fs::write(path, content)?;
        
        let file_path = Path::new(path);
        let name = file_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        
        let metadata = fs::metadata(file_path)?;
        let size = Some(metadata.len());
        let modified = metadata.modified()
            .ok()
            .and_then(|t| {
                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                Some(datetime.to_rfc3339())
            });

        Ok(ApiResponse::success(FileNode {
            name,
            path: path.to_string(),
            kind: FileKind::File,
            size,
            modified,
            children: None,
            content: Some(content.to_string()),
        }))
    }
}
