mod commands;
mod error;
mod models;
mod services;
mod utils;

static INIT_FILE_PATH: std::sync::OnceLock<Option<String>> = std::sync::OnceLock::new();

pub fn get_init_file_path() -> Option<String> {
    INIT_FILE_PATH.get().cloned().flatten()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    let init_file = {
        let args: Vec<String> = std::env::args().collect();
        if args.len() > 1 {
            let path = std::path::PathBuf::from(&args[1]);
            if path.exists() && path.extension().map_or(false, |ext| ext == "md") {
                Some(args[1].clone())
            } else {
                None
            }
        } else {
            None
        }
    };
    INIT_FILE_PATH.set(init_file).ok();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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
            commands::file_ops::get_init_file_path_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
