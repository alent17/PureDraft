use crate::error::AppError;
use winreg::enums::*;
use winreg::RegKey;

const PROG_ID: &str = "PureDraft.md";

fn is_dev_mode(exe_path: &str) -> bool {
    exe_path.contains("\\target\\debug\\") || exe_path.contains("\\target\\release\\")
}

#[tauri::command]
pub fn set_as_default_md_editor() -> Result<(), AppError> {
    let exe_path = std::env::current_exe()
        .map_err(|e| AppError::Business {
            code: 5001,
            message: format!("获取程序路径失败: {}", e),
        })?
        .to_string_lossy()
        .to_string();

    if is_dev_mode(&exe_path) {
        return Err(AppError::Business {
            code: 5000,
            message: "开发模式下无法设置默认打开程序，请先打包为 exe 后再设置".to_string(),
        });
    }

    let command_line = format!("\"{}\" \"%1\"", exe_path);

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let (classes_key, _) = hkcu
        .create_subkey("Software\\Classes")
        .map_err(|e| AppError::Business {
            code: 5002,
            message: format!("访问注册表 Classes 失败: {}", e),
        })?;

    let (ext_key, _) = classes_key.create_subkey(".md").map_err(|e| AppError::Business {
        code: 5003,
        message: format!("创建 .md 注册表项失败: {}", e),
    })?;
    ext_key
        .set_value("", &PROG_ID)
        .map_err(|e| AppError::Business {
            code: 5004,
            message: format!("设置 .md 默认值失败: {}", e),
        })?;

    let (prog_key, _) = classes_key
        .create_subkey(PROG_ID)
        .map_err(|e| AppError::Business {
            code: 5005,
            message: format!("创建 ProgID 注册表项失败: {}", e),
        })?;
    prog_key
        .set_value("", &"PureDraft Markdown 文件")
        .map_err(|e| AppError::Business {
            code: 5006,
            message: format!("设置 ProgID 描述失败: {}", e),
        })?;

    let (icon_key, _) = prog_key
        .create_subkey("DefaultIcon")
        .map_err(|e| AppError::Business {
            code: 5007,
            message: format!("创建 DefaultIcon 注册表项失败: {}", e),
        })?;
    let icon_value = format!("{},0", exe_path);
    icon_key
        .set_value("", &icon_value)
        .map_err(|e| AppError::Business {
            code: 5008,
            message: format!("设置图标路径失败: {}", e),
        })?;

    let (shell_key, _) = prog_key
        .create_subkey("shell\\open\\command")
        .map_err(|e| AppError::Business {
            code: 5009,
            message: format!("创建 shell\\open\\command 注册表项失败: {}", e),
        })?;
    shell_key
        .set_value("", &command_line)
        .map_err(|e| AppError::Business {
            code: 5010,
            message: format!("设置打开命令失败: {}", e),
        })?;

    tracing::info!("已将 PureDraft 设为 .md 文件默认打开程序");
    Ok(())
}

#[tauri::command]
pub fn check_default_md_editor() -> Result<bool, AppError> {
    let exe_path = std::env::current_exe()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    if is_dev_mode(&exe_path) {
        return Ok(false);
    }

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let classes_key = hkcu
        .open_subkey("Software\\Classes")
        .map_err(|_| AppError::Business {
            code: 5011,
            message: "无法访问注册表 Classes".to_string(),
        })?;

    let ext_key = classes_key.open_subkey(".md").map_err(|_| AppError::Business {
        code: 5012,
        message: "无法读取 .md 注册表项".to_string(),
    })?;

    let default_value: String = ext_key.get_value("").unwrap_or_default();

    Ok(default_value == PROG_ID)
}
