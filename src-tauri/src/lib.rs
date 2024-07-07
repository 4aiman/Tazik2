use tauri_plugin_log::{Target, TargetKind};
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new()
            .targets([
                Target::new(TargetKind::Stdout),
                Target::new(TargetKind::LogDir { file_name: None }),
                Target::new(TargetKind::Webview),
            ])
            .build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![send_request])
        // .invoke_handler(tauri::generate_handler![api_post_req])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

//===========================

#[tauri::command]
fn send_request(url: &str) -> String {
    format!("You've tried to access this URL: {}.", url)
}


// use reqwest::{redirect::Policy};


// #[tauri::command]
// async fn api_post_req(url: &str) -> String {

//     let client = reqwest::Client::new();
//     let u = url;
//     let res = client.get("http://httpbin.org/post").send();
//     return "".to_string();//res.wait().is_ok().to_string();
// }
