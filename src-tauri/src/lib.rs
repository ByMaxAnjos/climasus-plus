use std::fs::File;
use std::net::TcpListener;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(unix)]
use std::os::unix::process::CommandExt;
#[cfg(windows)]
use std::os::windows::process::CommandExt;

// tells CreateProcess not to allocate a console for the child — without it, spawning the
// console-subsystem R.exe from this GUI-subsystem app makes Windows pop up a visible terminal
// window (the one users keep asking about), and closing that window kills the R process with it.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

use tauri::{Manager, RunEvent};

#[derive(Default)]
struct EngineState {
    port: u16,
    token: String,
    boot_error: String,
    log_path: Option<PathBuf>,
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
    if !state.boot_error.is_empty() {
        return state.boot_error.clone();
    }
    if let Some(child) = state.child.lock().unwrap().as_mut() {
        match child.try_wait() {
            Ok(Some(status)) => {
                let detail = state
                    .log_path
                    .as_ref()
                    .and_then(|path| std::fs::read(path).ok())
                    .map(|bytes| {
                        let output = String::from_utf8_lossy(&bytes);
                        output
                            .lines()
                            .rev()
                            .take(40)
                            .collect::<Vec<_>>()
                            .into_iter()
                            .rev()
                            .collect::<Vec<_>>()
                            .join("\n")
                    })
                    .filter(|output| !output.is_empty())
                    .unwrap_or_else(|| "Nenhuma saída do R foi registrada.".into());
                let location = state
                    .log_path
                    .as_ref()
                    .map(|path| path.display().to_string())
                    .unwrap_or_else(|| "indisponível".into());
                return format!("O motor R encerrou ({status}).\n{detail}\nLog: {location}");
            }
            Err(error) => return format!("Não foi possível verificar o processo R: {error}"),
            Ok(None) => {}
        }
    }
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
// Windows: use the bundled bin/Rscript.exe launcher, as verified from the installed app.
fn r_binary(resource_dir: &std::path::Path) -> std::path::PathBuf {
    let bin = resource_dir.join("r").join("bin");
    #[cfg(windows)]
    {
        bin.join("Rscript.exe")
    }
    #[cfg(not(windows))]
    {
        bin.join("R")
    }
}

fn spawn_engine(
    resource_dir: &std::path::Path,
    token: &str,
    log_file: Option<&std::path::Path>,
) -> Result<(u16, Child), String> {
    let r_bin = r_binary(resource_dir);
    let start_r = resource_dir.join("engine").join("start.R");
    if !r_bin.exists() || !start_r.exists() {
        return Err(format!("Motor embutido não encontrado: {r_bin:?} ou {start_r:?}"));
    }

    // plumber/httpuv reject ports outside 1024..49151, unlike the OS's ephemeral range
    // (often 49152+) that binding port 0 would hand out — scan a fixed range instead.
    let port = (8787..8887)
        .find(|p| TcpListener::bind(("127.0.0.1", *p)).is_ok())
        .ok_or_else(|| "Nenhuma porta disponível entre 8787 e 8886.".to_string())?;

    // Keep both the Windows launcher directory and its x64 DLL directory on PATH.
    let r_bin_dir = r_bin.parent().unwrap_or(resource_dir);
    let sep = if cfg!(windows) { ";" } else { ":" };
    let extra_bin = if cfg!(windows) {
        format!("{}{}", resource_dir.join("r/bin/x64").display(), sep)
    } else {
        String::new()
    };
    let path = format!(
        "{}{}{}{}",
        extra_bin,
        r_bin_dir.display(),
        sep,
        std::env::var("PATH").unwrap_or_default()
    );
    let mut cmd = Command::new(&r_bin);
    cmd.current_dir(resource_dir);
    #[cfg(windows)]
    cmd.arg(".\\engine\\start.R").arg(port.to_string());
    #[cfg(not(windows))]
    cmd.arg("--no-echo")
        .arg("--no-restore")
        .arg("--file=engine/start.R")
        .arg("--args")
        .arg(port.to_string());
    cmd
        .env("CLIMASUS_BUNDLED", "1")
        .env("CLIMASUS_TOKEN", token)
        .env("CLIMASUS_RESOURCE_DIR", resource_dir)
        .env("PATH", path);
    // stdin must be a real, valid handle here: this GUI-subsystem app has no console of its own,
    // so plain Stdio::inherit() (the implicit default) hands R an invalid stdin handle once
    // CREATE_NO_WINDOW (below) stops Windows from auto-allocating a console to paper over that —
    // R can then fail to start at all. Stdio::null() gives it a valid, empty handle.
    cmd.stdin(Stdio::null());
    // R's own stdout/stderr (boot messages, warnings, crash output) — captured to a file instead
    // of inherited so the Windows console stays hidden but the diagnostics aren't just lost.
    match log_file.and_then(|p| File::create(p).ok()).and_then(|out| out.try_clone().ok().map(|err| (out, err))) {
        Some((out, err)) => {
            cmd.stdout(Stdio::from(out)).stderr(Stdio::from(err));
        }
        None => {
            // no writable log dir — still must not be Stdio::inherit() here: combined with
            // CREATE_NO_WINDOW below, inherited (invalid, GUI-parent) handles are exactly what
            // broke the engine on Windows. Stdio::null() is a real, valid handle either way.
            cmd.stdout(Stdio::null()).stderr(Stdio::null());
        }
    }
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
    // Linux R is dynamically linked against libR.so via the system loader path (unlike macOS,
    // where bundle-r-relocate.sh rewrites Mach-O install names) — point it at the bundled lib.
    #[cfg(target_os = "linux")]
    cmd.env("LD_LIBRARY_PATH", resource_dir.join("r").join("lib"));
    // own process group so we can signal R's forked/future workers together on shutdown,
    // instead of leaving them as orphans holding the port after a kill() of just the parent
    #[cfg(unix)]
    cmd.process_group(0);
    let child = cmd.spawn().map_err(|e| format!("Falha ao abrir {}: {e}", r_bin.display()))?;

    log::info!("climasus+ R engine spawned on port {port}");
    Ok((port, child))
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
            // tauri's resource_dir() canonicalizes and comes back \\?\-prefixed on Windows;
            // dunce::simplified() strips that prefix wherever the path is short enough (always,
            // for an app install path) so every downstream use (env var, current_dir, R's own
            // "/"-joined file.path()) sees an ordinary path instead of a verbatim one.
            let resource_dir = dunce::simplified(&app.path().resource_dir()?).to_path_buf();
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
            // R's stdout/stderr are captured here instead of shown in a console window (see
            // spawn_engine) — kept on disk so a failed boot is still diagnosable.
            let log_path = app.path().app_log_dir().ok().and_then(|dir| {
                std::fs::create_dir_all(&dir).ok()?;
                Some(dir.join("r-engine.log"))
            });
            let state = match spawn_engine(&resource_dir, &token, log_path.as_deref()) {
                Ok((port, child)) => EngineState { port, token, boot_error, log_path, child: Mutex::new(Some(child)) },
                Err(error) => EngineState { token, boot_error: if boot_error.is_empty() { error } else { boot_error }, log_path, ..EngineState::default() },
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

#[cfg(all(test, windows))]
mod tests {
    // regression test for the real failure: tauri's resource_dir() canonicalizes on Windows,
    // which prefixes \\?\ — a form R's "/"-joined file.path() can't resolve into ("File does
    // not exist" for a file that's really there). dunce::simplified() must strip it whenever
    // the path is a plain, short local path (always true for an app install directory).
    #[test]
    fn dunce_strips_verbatim_prefix_from_canonicalized_path() {
        let dir = std::env::temp_dir().join(format!("climasus-dunce-test-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let canonical = std::fs::canonicalize(&dir).unwrap();
        assert!(
            canonical.to_string_lossy().starts_with(r"\\?\"),
            "test assumption failed: std::fs::canonicalize should verbatim-prefix on Windows"
        );
        let simplified = dunce::simplified(&canonical);
        assert!(
            !simplified.to_string_lossy().starts_with(r"\\?\"),
            "dunce::simplified left the \\\\?\\ prefix in place: {simplified:?}"
        );
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
