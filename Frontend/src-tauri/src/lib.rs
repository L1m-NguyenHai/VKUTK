use std::process::Command;

#[tauri::command]
fn fetch_student_info(python_script_path: String, session_path: String) -> Result<serde_json::Value, String> {
  // Check if file exists first
  if !std::path::Path::new(&python_script_path).exists() {
    return Err(format!("Python script not found at: {}", python_script_path));
  }

  let output = Command::new("python")
    .arg(&python_script_path)
    .arg(&session_path)
    .output()
    .map_err(|e| format!("Failed to execute Python script: {}", e))?;

  if output.status.success() {
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    match serde_json::from_str::<serde_json::Value>(&stdout) {
      Ok(json_data) => Ok(json_data),
      Err(_) => Err("Failed to parse student info as JSON".to_string()),
    }
  } else {
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    Err(format!("Python script error: {}", if stderr.is_empty() { "Unknown error" } else { &stderr }))
  }
}

#[tauri::command]
fn capture_session(python_script_path: String, session_path: String) -> Result<String, String> {
  // Check if file exists first
  if !std::path::Path::new(&python_script_path).exists() {
    return Err(format!("Python script not found at: {}", python_script_path));
  }

  let output = Command::new("python")
    .arg(&python_script_path)
    .arg(&session_path)
    .output()
    .map_err(|e| format!("Failed to execute Python script: {}", e))?;

  if output.status.success() {
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(if stdout.is_empty() {
      "Session captured successfully!".to_string()
    } else {
      stdout
    })
  } else {
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    Err(format!("Python script error: {}", if stderr.is_empty() { "Unknown error" } else { &stderr }))
  }
}

#[tauri::command]
fn check_session_file(session_path: String) -> Result<bool, String> {
  match std::fs::metadata(&session_path) {
    Ok(_) => Ok(true),
    Err(_) => Ok(false),
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![capture_session, check_session_file, fetch_student_info])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
