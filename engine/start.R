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

api_file <- file.path(dirname(sub("--file=", "", grep("--file=", commandArgs(), value = TRUE))), "api.R")
resource_dir <- normalizePath(file.path(dirname(api_file), ".."), mustWork = FALSE)
Sys.setenv(CLIMASUS_RESOURCE_DIR = resource_dir)
pr <- plumber::plumb(api_file)
# serve artifact files (plots, widgets, report)
pr$mount("/artifact", plumber::PlumberStatic$new(file.path(tempdir(), "climasus-artifacts")))
message("climasus+ engine em http://127.0.0.1:", port)
pr$run(host = "127.0.0.1", port = port, quiet = TRUE)
