use crate::error::AppError;
use tauri::WebviewWindow;

#[tauri::command]
pub fn minimize_window(window: WebviewWindow) -> Result<(), AppError> {
    window.minimize()?;
    Ok(())
}

#[tauri::command]
pub fn toggle_maximize(window: WebviewWindow) -> Result<bool, AppError> {
    let is_maximized = window.is_maximized()?;
    if is_maximized {
        window.unmaximize()?;
        Ok(false)
    } else {
        window.maximize()?;
        Ok(true)
    }
}

#[tauri::command]
pub fn close_window(window: WebviewWindow) -> Result<(), AppError> {
    window.close()?;
    Ok(())
}

#[tauri::command]
pub fn is_maximized(window: WebviewWindow) -> Result<bool, AppError> {
    Ok(window.is_maximized()?)
}

#[tauri::command]
pub fn set_acrylic_effect(window: WebviewWindow, enabled: bool) -> Result<(), AppError> {
    #[cfg(target_os = "windows")]
    {
        use tauri::window::{Effect, EffectsBuilder};
        if enabled {
            let effects = EffectsBuilder::new().effects(vec![Effect::Acrylic]).build();
            window.set_effects(Some(effects))?;
        } else {
            window.set_effects(None)?;
        }
    }
    Ok(())
}
