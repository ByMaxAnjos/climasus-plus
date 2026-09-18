# climasus+ engine bootstrap: Rscript engine/start.R [port]
port <- as.integer(commandArgs(trailingOnly = TRUE)[1])
if (is.na(port)) port <- 8787L

# Windows R's libcurl (schannel) fails the TLS certificate REVOCATION check on networks that
# can't reach an OCSP/CRL endpoint (common on locked-down/corporate machines), reporting it as
# an opaque "cannot open URL" — this breaks every HTTPS download the engine does at runtime
# (geobr boundary polygons, sus_* product downloads). Same fix CI needed for INLA installs
# (see .github/workflows/build-windows-beta.yml); best-effort revocation checking is safe here
# because the download targets (IBGE, DATASUS mirrors) are fixed, trusted endpoints.
if (.Platform$OS.type == "windows") {
  Sys.setenv(R_LIBCURL_SSL_REVOKE_BEST_EFFORT = "TRUE")
  options(download.file.method = "libcurl")
}

# bundled runtime ships every dependency already; its library is read-only and often offline
if (!nzchar(Sys.getenv("CLIMASUS_BUNDLED"))) {
  for (p in c("plumber", "writexl")) {
    if (!requireNamespace(p, quietly = TRUE)) {
      message("Instalando ", p, "…")
      install.packages(p, repos = "https://cloud.r-project.org")
    }
  }
}

# prefer the resource dir Tauri passes directly: commandArgs()'s own --file= path gets
# corrupted by R (spaces become "~+~") whenever the app is installed under a path with a
# space, e.g. "climasus+ Studio.app"
resource_dir <- Sys.getenv("CLIMASUS_RESOURCE_DIR")
# Windows' \\?\ verbatim-path prefix (added by Rust's path canonicalization) forbids "/" inside
# it, which file.path() below always uses — "engine/api.R" then fails to resolve even though the
# file exists. normalizePath() re-resolves through the plain (non-verbatim) API and drops it.
if (nzchar(resource_dir) && .Platform$OS.type == "windows") {
  resource_dir <- normalizePath(resource_dir, winslash = "/", mustWork = FALSE)
}
if (!nzchar(resource_dir)) {
  api_file <- file.path(dirname(sub("--file=", "", grep("--file=", commandArgs(), value = TRUE))), "api.R")
  resource_dir <- normalizePath(file.path(dirname(api_file), ".."), mustWork = FALSE)
  Sys.setenv(CLIMASUS_RESOURCE_DIR = resource_dir)
}
# pre-seed geobr's state-boundary cache from the bundled resource so sus_data_plot_aggregate_map()
# and friends don't need a live download on first use — classroom Windows machines are often
# behind a proxy/firewall that breaks geobr's own metadata download (see engine/api.R history).
seed_file <- file.path(resource_dir, "spatial-seed", "state_.parquet")
cache_file <- path.expand("~/.climasus4r_cache/spatial/state_.parquet")
if (file.exists(seed_file) && !file.exists(cache_file)) {
  dir.create(dirname(cache_file), recursive = TRUE, showWarnings = FALSE)
  file.copy(seed_file, cache_file)
}

api_file <- file.path(resource_dir, "engine", "api.R")
# always logged, even on success — the last failure report ("file does not exist: Path")
# was truncated by the caller's log-tail before the actual path, so print it unambiguously
# up front instead of guessing again from a partial message.
message("CLIMASUS_RESOURCE_DIR=", resource_dir)
message("api_file=", api_file, " exists=", file.exists(api_file))
if (!file.exists(api_file)) {
  stop(sprintf(
    "engine/api.R not found at '%s' (resource_dir='%s', working dir='%s'). CLIMASUS_RESOURCE_DIR raw='%s'.",
    api_file, resource_dir, getwd(), Sys.getenv("CLIMASUS_RESOURCE_DIR")
  ))
}
pr <- plumber::plumb(api_file)
# serve artifact files (plots, widgets, report)
pr$mount("/artifact", plumber::PlumberStatic$new(file.path(tempdir(), "climasus-artifacts")))
message("climasus+ engine em http://127.0.0.1:", port)
pr$run(host = "127.0.0.1", port = port, quiet = TRUE)
