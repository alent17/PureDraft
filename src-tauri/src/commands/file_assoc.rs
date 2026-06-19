use crate::error::AppError;
use winreg::enums::*;
use winreg::RegKey;

const PROG_ID: &str = "PureDraft.md";
const APP_NAME: &str = "PureDraft";

#[link(name = "shell32")]
extern "system" {
    fn SHChangeNotify(wEventId: i32, uFlags: u32, dwItem1: *const std::ffi::c_void, dwItem2: *const std::ffi::c_void);
}

fn notify_shell() {
    const SHCNE_ASSOCCHANGED: i32 = 0x08000000;
    const SHCNF_IDLIST: u32 = 0;
    unsafe {
        SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, std::ptr::null(), std::ptr::null());
    }
}

fn register_app_paths(exe_path: &str) -> Result<(), AppError> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let exe_name = std::path::Path::new(exe_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let (app_paths_key, _) = hkcu
        .create_subkey(format!("Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\{}", exe_name))
        .map_err(|e| AppError::Business {
            code: 5020,
            message: format!("创建 App Paths 注册表项失败: {}", e),
        })?;
    app_paths_key.set_value("", &exe_path).map_err(|e| AppError::Business {
        code: 5021,
        message: format!("设置 App Paths 默认值失败: {}", e),
    })?;
    if let Some(parent) = std::path::Path::new(exe_path).parent() {
        app_paths_key.set_value("Path", &parent.to_string_lossy().to_string()).ok();
    }
    Ok(())
}

fn register_application(exe_path: &str) -> Result<(), AppError> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let command_line = format!("\"{}\" \"%1\"", exe_path);

    let exe_filename = std::path::Path::new(exe_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let (apps_key, _) = hkcu
        .create_subkey(format!("Software\\Classes\\Applications\\{}\\shell\\open\\command", exe_filename))
        .map_err(|e| AppError::Business {
            code: 5022,
            message: format!("创建 Applications 注册表项失败: {}", e),
        })?;
    apps_key.set_value("", &command_line).map_err(|e| AppError::Business {
        code: 5023,
        message: format!("设置 Applications 打开命令失败: {}", e),
    })?;

    Ok(())
}

fn register_open_with_list(exe_path: &str) -> Result<(), AppError> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let exe_name = std::path::Path::new(exe_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let (open_with_key, _) = hkcu
        .create_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\.md\\OpenWithList")
        .map_err(|e| AppError::Business {
            code: 5024,
            message: format!("创建 OpenWithList 注册表项失败: {}", e),
        })?;

    let current: String = open_with_key.get_value("MRUList").unwrap_or_default();
    if current.is_empty() {
        open_with_key.set_value("MRUList", &"a".to_string()).ok();
        open_with_key.set_value("a", &exe_name).ok();
    }

    Ok(())
}

fn register_capabilities(_exe_path: &str) -> Result<(), AppError> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let (cap_key, _) = hkcu
        .create_subkey(format!("Software\\{}\\Capabilities", APP_NAME))
        .map_err(|e| AppError::Business {
            code: 5025,
            message: format!("创建 Capabilities 注册表项失败: {}", e),
        })?;

    cap_key
        .set_value("ApplicationName", &APP_NAME)
        .map_err(|e| AppError::Business {
            code: 5026,
            message: format!("设置 ApplicationName 失败: {}", e),
        })?;
    cap_key
        .set_value("ApplicationDescription", &"一款极简丝滑的桌面 Markdown 编辑器")
        .map_err(|e| AppError::Business {
            code: 5027,
            message: format!("设置 ApplicationDescription 失败: {}", e),
        })?;

    let (file_assoc_key, _) = cap_key
        .create_subkey("FileAssociations")
        .map_err(|e| AppError::Business {
            code: 5028,
            message: format!("创建 FileAssociations 注册表项失败: {}", e),
        })?;
    file_assoc_key
        .set_value(".md", &PROG_ID)
        .map_err(|e| AppError::Business {
            code: 5029,
            message: format!("设置 FileAssociations .md 失败: {}", e),
        })?;

    let (reg_apps_key, _) = hkcu
        .create_subkey("Software\\RegisteredApplications")
        .map_err(|e| AppError::Business {
            code: 5030,
            message: format!("创建 RegisteredApplications 注册表项失败: {}", e),
        })?;
    reg_apps_key
        .set_value(APP_NAME, &format!("Software\\{}\\Capabilities", APP_NAME))
        .map_err(|e| AppError::Business {
            code: 5031,
            message: format!("注册 RegisteredApplications 失败: {}", e),
        })?;

    Ok(())
}

#[tauri::command]
pub fn set_as_default_md_editor() -> Result<(), AppError> {
    if cfg!(debug_assertions) {
        return Err(AppError::Business {
            code: 5000,
            message: "开发模式下无法设置默认打开程序，请先打包为 exe 后再设置".to_string(),
        });
    }

    let exe_path = std::env::current_exe()
        .map_err(|e| AppError::Business {
            code: 5001,
            message: format!("获取程序路径失败: {}", e),
        })?
        .to_string_lossy()
        .to_string();

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
    let (open_with_progids_key, _) = classes_key
        .create_subkey(".md\\OpenWithProgIds")
        .map_err(|e| AppError::Business {
            code: 5004,
            message: format!("创建 OpenWithProgIds 注册表项失败: {}", e),
        })?;
    open_with_progids_key.set_value(PROG_ID, &"").ok();

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

    register_app_paths(&exe_path)?;
    register_application(&exe_path)?;
    register_open_with_list(&exe_path)?;
    register_capabilities(&exe_path)?;

    notify_shell();

    tracing::info!("已将 PureDraft 设为 .md 文件默认打开程序");
    Ok(())
}

#[tauri::command]
pub fn check_default_md_editor() -> Result<bool, AppError> {
    if cfg!(debug_assertions) {
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
