# Single source of truth for the R package closure the climasus+ engine needs.
# Sourced by scripts/bundle-r-windows.R and by .github/workflows/build-windows-beta.yml so
# the CI installs EXACTLY what the bundle step requires — no "missing package" errors.
# (scripts/bundle-r.R for macOS keeps its own inline copy; keep the two in sync.)

# base/recommended packages ship inside R's library/ but aren't declared as Imports by anything
# (R auto-attaches them) — listed explicitly so the bundle copies them, never installed via CRAN.
CLIMASUS_BASE_PKGS <- c("base", "compiler", "datasets", "grDevices", "graphics", "grid", "methods",
  "parallel", "splines", "stats", "stats4", "tools", "utils") # tcltk excluded

# GitHub-only packages (not on CRAN, or archived) — installed by "owner/repo" ref, bundled by
# plain name. read.dbc was archived from CRAN; both climasus4r and microdatasus depend on it and
# microdatasus pins the GitHub source danicat/read.dbc — request it the same way everywhere so
# pak doesn't see a CRAN-vs-GitHub conflict (the failure that aborted the first CI run).
CLIMASUS_GITHUB_PKGS <- c(
  climasus4r   = "ByMaxAnjos/climasus4r",
  microdatasus = "rfsaldanha/microdatasus",
  read.dbc     = "danicat/read.dbc"
)

# every package the engine or a catalogued sus_* function calls directly, plus base.
CLIMASUS_USED <- c(
  CLIMASUS_BASE_PKGS,
  "climasus4r", "plumber", "jsonlite", "writexl", "nanoparquet", # engine itself
  "arrow", "CARBayes", "censobr", "cli", "data.table", "DBI", "digest", "dlnm", "dplyr",
  "duckdb", "exactextractr", "fs", "furrr", "future", "future.apply", "geobr", "geocodebr",
  "ggplot2", "ggrepel", "ggsci", "glue", "gt", "htmltools", "htmlwidgets", "httr", "httr2",
  "INLA", "knitr", "lubridate", "magrittr", "MASS", "microdatasus", "mvmeta",
  "parallelly", "patchwork", "plotly", "purrr", "RColorBrewer", "read.dbc", "readxl",
  "rlang", "rstudioapi", "scales", "sf", "sfarrow", "slider", "SpatialEpi", "spatialreg",
  "spdep", "splines", "stringi", "stringr", "strucchange", "survival", "targets", "terra",
  "tibble", "tidyr", "viridisLite",
  "webshot2", "chromote", # optional PNG snapshot of htmlwidget/map results (needs a browser)
  "xgboost", "yaml", "zoo"
)
