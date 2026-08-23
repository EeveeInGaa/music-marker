use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
fn prepare_audio_file(app: tauri::AppHandle, source_path: String) -> Result<bool, String> {
    let path = PathBuf::from(source_path);
    let has_supported_extension = path
        .extension()
        .and_then(|extension| extension.to_str())
        .is_some_and(|extension| {
            matches!(
                extension.to_ascii_lowercase().as_str(),
                "mp3" | "m4a" | "aac" | "wav" | "aiff" | "aif" | "flac" | "ogg" | "opus"
            )
        });

    if !path.is_file() || !has_supported_extension {
        return Ok(false);
    }

    app.asset_protocol_scope()
        .allow_file(&path)
        .map_err(|error| error.to_string())?;

    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![prepare_audio_file])
        .run(tauri::generate_context!())
        .expect("error while running Audio Marker");
}
