# climasus+ engine bootstrap: Rscript engine/start.R [port]
port <- as.integer(commandArgs(trailingOnly = TRUE)[1])
if (is.na(port)) port <- 8787L

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
pr <- plumber::plumb(api_file)
# serve artifact files (plots, widgets, report)
pr$mount("/artifact", plumber::PlumberStatic$new(file.path(tempdir(), "climasus-artifacts")))
message("climasus+ engine em http://127.0.0.1:", port)
pr$run(host = "127.0.0.1", port = port, quiet = TRUE)
