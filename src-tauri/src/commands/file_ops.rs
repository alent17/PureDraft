use crate::error::AppError;
use crate::models::{FileContent, FileInfo};
use crate::services::FileService;
use tauri::AppHandle;

#[tauri::command]
pub async fn read_file(path: String) -> Result<FileContent, AppError> {
    let service = FileService::new();
    service.read_file(&path)
}

#[tauri::command]
pub async fn save_file(path: String, content: String) -> Result<(), AppError> {
    let service = FileService::new();
    service.save_file(&path, &content)
}

#[tauri::command]
pub async fn save_file_as(
    app: AppHandle,
    content: String,
    default_name: Option<String>,
) -> Result<String, AppError> {
    let service = FileService::new();
    service.save_file_as(&app, &content, default_name.as_deref()).await
}

#[tauri::command]
pub async fn open_file_dialog(app: AppHandle) -> Result<Vec<FileInfo>, AppError> {
    let service = FileService::new();
    service.open_file_dialog(&app).await
}

#[tauri::command]
pub async fn open_folder(path: String) -> Result<crate::models::ApiResponse<crate::models::FileNode>, AppError> {
    let service = FileService::new();
    service.open_folder(&path)
}

#[tauri::command]
pub async fn read_file_content(path: String) -> Result<crate::models::ApiResponse<crate::models::FileNode>, AppError> {
    let service = FileService::new();
    service.read_file_content(&path)
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<crate::models::ApiResponse<crate::models::FileNode>, AppError> {
    let service = FileService::new();
    service.write_file(&path, &content)
}
