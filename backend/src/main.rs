use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer, middleware};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::ops::Not;
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Clone)]
struct FileNode {
    name: String,
    path: String,
    kind: String, // "file" or "directory"
    size: Option<u64>,
    modified: Option<String>,
    children: Option<Vec<FileNode>>,
    content: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

#[derive(Deserialize)]
struct BatchReadRequest {
    paths: Vec<String>,
}

/// 健康检查
async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "PureDraft Backend API",
        "version": "0.1.0",
        "timestamp": Utc::now().to_rfc3339()
    }))
}

/// 打开文件夹并获取文件树
async fn open_folder(path: web::Path<String>) -> HttpResponse {
    let folder_path = PathBuf::from(path.into_inner());
    
    if !folder_path.exists() {
        let response: ApiResponse<()> = ApiResponse {
            success: false,
            data: None,
            error: Some("Folder does not exist".to_string()),
        };
        return HttpResponse::NotFound().json(response);
    }
    
    if !folder_path.is_dir() {
        let response: ApiResponse<()> = ApiResponse {
            success: false,
            data: None,
            error: Some("Path is not a directory".to_string()),
        };
        return HttpResponse::BadRequest().json(response);
    }
    
    match build_file_tree(&folder_path, 2) {
        Ok(tree) => {
            let response = ApiResponse {
                success: true,
                data: Some(tree),
                error: None,
            };
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            let response: ApiResponse<()> = ApiResponse {
                success: false,
                data: None,
                error: Some(e.to_string()),
            };
            HttpResponse::InternalServerError().json(response)
        }
    }
}

/// 获取文件夹的文件列表（扁平化）
async fn list_files(query: web::Query<ListFilesQuery>) -> HttpResponse {
    let folder_path = PathBuf::from(&query.path);
    let extensions: Vec<&str> = query.extensions.as_ref()
        .map(|s| s.split(',').collect())
        .unwrap_or_else(|| vec!["md", "markdown"]);
    
    if !folder_path.exists() || !folder_path.is_dir() {
        let response: ApiResponse<()> = ApiResponse {
            success: false,
            data: None,
            error: Some("Invalid folder path".to_string()),
        };
        return HttpResponse::BadRequest().json(response);
    }
    
    let files: Vec<FileNode> = WalkDir::new(&folder_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            if !e.file_type().is_file() {
                return false;
            }
            e.path().extension()
                .map_or(false, |ext| extensions.contains(&ext.to_string_lossy().as_ref()))
        })
        .map(|entry| {
            let path = entry.path();
            let metadata = entry.metadata().ok();
            FileNode {
                name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                path: path.to_string_lossy().to_string(),
                kind: "file".to_string(),
                size: metadata.as_ref().map(|m| m.len()),
                modified: metadata.and_then(|m| {
                    m.modified().ok().map(|t| {
                        let datetime: DateTime<Utc> = t.into();
                        datetime.to_rfc3339()
                    })
                }),
                children: None,
                content: None,
            }
        })
        .collect();
    
    let response = ApiResponse {
        success: true,
        data: Some(files),
        error: None,
    };
    HttpResponse::Ok().json(response)
}

#[derive(Deserialize)]
struct ListFilesQuery {
    path: String,
    extensions: Option<String>,
}

/// 批量读取文件内容
async fn batch_read(request: web::Json<BatchReadRequest>) -> HttpResponse {
    let mut results = Vec::new();
    
    for path_str in request.paths.iter() {
        let path = PathBuf::from(path_str);
        if path.exists() && path.is_file() {
            match fs::read_to_string(&path) {
                Ok(content) => {
                    results.push(FileNode {
                        name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                        path: path_str.clone(),
                        kind: "file".to_string(),
                        size: Some(content.len() as u64),
                        modified: None,
                        children: None,
                        content: Some(content),
                    });
                }
                Err(e) => {
                    log::warn!("Failed to read file {}: {}", path_str, e);
                }
            }
        }
    }
    
    let response = ApiResponse {
        success: true,
        data: Some(results),
        error: None,
    };
    HttpResponse::Ok().json(response)
}

/// 读取单个文件
async fn read_file(path: web::Path<String>) -> HttpResponse {
    let file_path = PathBuf::from(path.into_inner());
    
    if !file_path.exists() || !file_path.is_file() {
        let response: ApiResponse<()> = ApiResponse {
            success: false,
            data: None,
            error: Some("File not found".to_string()),
        };
        return HttpResponse::NotFound().json(response);
    }
    
    match fs::read_to_string(&file_path) {
        Ok(content) => {
            let response = ApiResponse {
                success: true,
                data: Some(FileNode {
                    name: file_path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                    path: file_path.to_string_lossy().to_string(),
                    kind: "file".to_string(),
                    size: Some(content.len() as u64),
                    modified: None,
                    children: None,
                    content: Some(content),
                }),
                error: None,
            };
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            let response: ApiResponse<()> = ApiResponse {
                success: false,
                data: None,
                error: Some(e.to_string()),
            };
            HttpResponse::InternalServerError().json(response)
        }
    }
}

/// 写入文件
async fn write_file(request: web::Json<WriteFileRequest>) -> HttpResponse {
    let file_path = PathBuf::from(&request.path);
    
    // 确保父目录存在
    if let Some(parent) = file_path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            let response: ApiResponse<()> = ApiResponse {
                success: false,
                data: None,
                error: Some(format!("Failed to create parent directory: {}", e)),
            };
            return HttpResponse::InternalServerError().json(response);
        }
    }
    
    match fs::write(&file_path, &request.content) {
        Ok(_) => {
            let response = ApiResponse {
                success: true,
                data: Some(FileNode {
                    name: file_path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                    path: request.path.clone(),
                    kind: "file".to_string(),
                    size: Some(request.content.len() as u64),
                    modified: None,
                    children: None,
                    content: Some(request.content.clone()),
                }),
                error: None,
            };
            HttpResponse::Ok().json(response)
        }
        Err(e) => {
            let response: ApiResponse<()> = ApiResponse {
                success: false,
                data: None,
                error: Some(e.to_string()),
            };
            HttpResponse::InternalServerError().json(response)
        }
    }
}

#[derive(Deserialize)]
struct WriteFileRequest {
    path: String,
    content: String,
}

/// 构建文件树（递归）
fn build_file_tree(dir: &PathBuf, max_depth: usize) -> std::io::Result<FileNode> {
    build_file_tree_recursive(dir, dir, 0, max_depth)
}

fn build_file_tree_recursive(
    root: &PathBuf,
    current: &PathBuf,
    current_depth: usize,
    max_depth: usize,
) -> std::io::Result<FileNode> {
    let metadata = fs::metadata(current)?;
    let is_dir = metadata.is_dir();
    
    let mut node = FileNode {
        name: current.file_name().unwrap_or_default().to_string_lossy().to_string(),
        path: current.to_string_lossy().to_string(),
        kind: if is_dir { "directory".to_string() } else { "file".to_string() },
        size: if is_dir { None } else { Some(metadata.len()) },
        modified: metadata.modified().ok().map(|t| {
            let datetime: DateTime<Utc> = t.into();
            datetime.to_rfc3339()
        }),
        children: None,
        content: None,
    };
    
    if is_dir && current_depth < max_depth {
        let mut children = Vec::new();
        
        if let Ok(entries) = fs::read_dir(current) {
            let mut entries: Vec<_> = entries
                .filter_map(|e| e.ok())
                .filter(|e| {
                    // 过滤隐藏文件和目录
                    e.file_name()
                        .to_string_lossy()
                        .starts_with('.')
                        .not()
                })
                .collect();
            
            // 目录优先
            entries.sort_by(|a, b| {
                let a_is_dir = a.file_type().map_or(false, |ft| ft.is_dir());
                let b_is_dir = b.file_type().map_or(false, |ft| ft.is_dir());
                
                match (a_is_dir, b_is_dir) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.file_name().cmp(&b.file_name()),
                }
            });
            
            for entry in entries {
                let entry_path = entry.path();
                if let Ok(child_node) = build_file_tree_recursive(
                    root,
                    &entry_path,
                    current_depth + 1,
                    max_depth,
                ) {
                    children.push(child_node);
                }
            }
        }
        
        node.children = Some(children);
    }
    
    Ok(node)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));
    
    log::info!("Starting PureDraft Backend API server at http://localhost:8080");
    
    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);
        
        App::new()
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .route("/api/health", web::get().to(health_check))
            .route("/api/folders/open/{path}", web::get().to(open_folder))
            .route("/api/folders/files", web::get().to(list_files))
            .route("/api/files/batch-read", web::post().to(batch_read))
            .route("/api/files/read/{path}", web::get().to(read_file))
            .route("/api/files/write", web::post().to(write_file))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
