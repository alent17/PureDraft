use serde::Serialize;
use std::sync::mpsc;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("序列化错误: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("对话框错误: {0}")]
    Dialog(String),

    #[error("未选择文件")]
    NoSelection,

    #[error("URL 路径不支持: {0}")]
    UrlNotSupported(String),

    #[error("{message}")]
    Business { code: u32, message: String },
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;

        let (code, message) = match self {
            AppError::Io(e) => (1, e.to_string()),
            AppError::Serialization(e) => (2, e.to_string()),
            AppError::Dialog(msg) => (3, msg.clone()),
            AppError::NoSelection => (4, "未选择文件".to_string()),
            AppError::UrlNotSupported(url) => (5, format!("URL 路径不支持: {}", url)),
            AppError::Business { code, message } => (*code, message.clone()),
        };

        let mut s = serializer.serialize_struct("AppError", 2)?;
        s.serialize_field("code", &code)?;
        s.serialize_field("message", &message)?;
        s.end()
    }
}

impl From<mpsc::RecvError> for AppError {
    fn from(e: mpsc::RecvError) -> Self {
        AppError::Dialog(e.to_string())
    }
}

impl From<tauri::Error> for AppError {
    fn from(e: tauri::Error) -> Self {
        AppError::Business {
            code: 100,
            message: e.to_string(),
        }
    }
}
