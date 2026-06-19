mod commands;
mod error;
mod models;
mod services;
mod utils;

use tauri::Emitter;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(path) = args.get(1) {
                let p = std::path::PathBuf::from(path);
                if p.exists() && p.extension().is_some_and(|ext| ext == "md") {
                    let _ = app.emit("file-open-requested", path.clone());
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.set_focus();
                    }
                }
            }
        }))
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            if let Some(path) = args.get(1) {
                let p = std::path::PathBuf::from(path);
                if p.exists() && p.extension().is_some_and(|ext| ext == "md") {
                    let handle = app.handle().clone();
                    let path_clone = path.clone();
                    tauri::async_runtime::spawn(async move {
                        let _ = handle.emit("file-open-requested", path_clone);
                    });
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::file_ops::read_file,
            commands::file_ops::save_file,
            commands::file_ops::save_file_as,
            commands::file_ops::open_file_dialog,
            commands::file_ops::open_folder,
            commands::file_ops::read_file_content,
            commands::file_ops::write_file,
            commands::file_assoc::set_as_default_md_editor,
            commands::file_assoc::check_default_md_editor,
            commands::window_ops::minimize_window,
            commands::window_ops::toggle_maximize,
            commands::window_ops::close_window,
            commands::window_ops::is_maximized,
            commands::window_ops::set_acrylic_effect,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            eprintln!("error while running tauri application: {e}");
            std::process::exit(1);
        });
}
