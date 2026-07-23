use std::net::TcpListener;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(unix)]
use std::os::unix::process::CommandExt;

use tauri::{Manager, RunEvent};

#[derive(Default)]
struct EngineState {
    port: u16,
    token: String,
    boot_error: String,
    child: Mutex<Option<Child>>,
}

#[tauri::command]
fn engine_port(state: tauri::State<EngineState>) -> u16 {
    state.port
}

#[tauri::command]
fn engine_token(state: tauri::State<EngineState>) -> String {
    state.token.clone()
}

#[tauri::command]
fn engine_boot_error(state: tauri::State<EngineState>) -> String {
    state.boot_error.clone()
}

// per-launch shared secret so a hostile page loaded in the webview can't drive the engine's
// arbitrary-eval /run endpoint just by guessing the (fixed-range) port — see engine/api.R's
// token check and src/engine/client.ts, which fetches this via invoke before calling the engine.
fn gen_token() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("{:x}{:x}", nanos, std::process::id())
}

// R's binary layout differs by OS. macOS: CRAN's build hardcodes R_HOME in bin/Rscript with no
// self-detection — bin/R is a patched shell script that DOES self-detect (see
// scripts/bundle-r-relocate.sh), so we must launch via bin/R + --file=/--args, never bin/Rscript.
// Windows: R is relocatable and exposes bin/x64/R.exe, which self-detects R_HOME with no patching.
fn r_binary(resource_dir: &std::path::Path) -> std::path::PathBuf {
    let bin = resource_dir.join("r").join("bin");
    #[cfg(windows)]
    {
        bin.join("x64").join("R.exe")
    }
    #[cfg(not(windows))]
    {
        bin.join("R")
    }
}

fn spawn_engine(resource_dir: &std::path::Path, token: &str) -> Option<(u16, Child)> {
    let r_bin = r_binary(resource_dir);
    let start_r = resource_dir.join("engine").join("start.R");
    if !r_bin.exists() || !start_r.exists() {
        log::warn!("bundled R engine not found at {r_bin:?} — running without it");
        return None;
    }

    // plumber/httpuv reject ports outside 1024..49151, unlike the OS's ephemeral range
    // (often 49152+) that binding port 0 would hand out — scan a fixed range instead.
    let port = (8787..8887).find(|p| TcpListener::bind(("127.0.0.1", *p)).is_ok())?;

    // prepend R's own bin dir (parent of the R binary) so it finds its shared libs:
    // r/bin on macOS, r/bin/x64 (holds R.dll) on Windows. PATH separator differs too.
    let r_bin = r_binary(resource_dir);
    let r_bin_dir = r_bin.parent().unwrap_or(resource_dir);
    let sep = if cfg!(windows) { ";" } else { ":" };
    let path = format!(
        "{}{}{}",
        r_bin_dir.display(),
        sep,
        std::env::var("PATH").unwrap_or_default()
    );
    let mut cmd = Command::new(&r_bin);
    cmd.arg("--no-echo")
        .arg("--no-restore")
        .arg(format!("--file={}", start_r.display()))
        .arg("--args")
        .arg(port.to_string())
        .env("CLIMASUS_BUNDLED", "1")
        .env("CLIMASUS_TOKEN", token)
        .env("PATH", path)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());
    // own process group so we can signal R's forked/future workers together on shutdown,
    // instead of leaving them as orphans holding the port after a kill() of just the parent
    #[cfg(unix)]
    cmd.process_group(0);
    let child = cmd
        .spawn()
        .map_err(|e| log::error!("failed to spawn R engine: {e}"))
        .ok()?;

    log::info!("climasus+ R engine spawned on port {port}");
    Some((port, child))
}

#[cfg(unix)]
fn kill_engine(mut child: Child) {
    let pid = child.id() as i32;
    // negative pid targets the whole process group (see process_group(0) above)
    let _ = Command::new("kill").arg("-TERM").arg(format!("-{pid}")).status();
    if child.wait().is_err() {
        let _ = child.kill();
        let _ = child.wait();
    }
}

#[cfg(not(unix))]
fn kill_engine(mut child: Child) {
    let _ = child.kill();
    let _ = child.wait();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            let resource_dir = app.path().resource_dir()?;
            let token = gen_token();
            let r_bin = r_binary(&resource_dir);
            let start_r = resource_dir.join("engine").join("start.R");
            let boot_error = if !r_bin.exists() || !start_r.exists() {
                format!(
                    "Motor embutido não encontrado no bundle. Esperado: {:?} e {:?}.",
                    r_bin, start_r
                )
            } else {
                String::new()
            };
            let state = match spawn_engine(&resource_dir, &token) {
                Some((port, child)) => EngineState { port, token, boot_error, child: Mutex::new(Some(child)) },
                None => EngineState { token, boot_error: if boot_error.is_empty() {
                    "Não foi possível iniciar o motor embutido do climasus+.".into()
                } else {
                    boot_error
                }, ..EngineState::default() },
            };
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![engine_port, engine_token, engine_boot_error])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // ExitRequested fires on a window-close-driven quit; Exit is the last event before
            // the process actually terminates (e.g. Cmd+Q / Dock "Quit" / osascript quit, which
            // don't reliably raise ExitRequested first) — match either so the sidecar is reaped
            // regardless of which path the user quit through.
            if matches!(event, RunEvent::ExitRequested { .. } | RunEvent::Exit) {
                if let Some(state) = app.try_state::<EngineState>() {
                    if let Some(child) = state.child.lock().unwrap().take() {
                        kill_engine(child);
                    }
                }
            }
        });
}
