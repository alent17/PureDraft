mod commands;
mod error;
mod models;
mod services;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

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
            commands::window_ops::minimize_window,
            commands::window_ops::toggle_maximize,
            commands::window_ops::close_window,
            commands::window_ops::is_maximized,
            commands::window_ops::set_acrylic_effect,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
