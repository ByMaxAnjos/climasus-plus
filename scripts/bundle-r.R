# Copies a self-contained R runtime + the exact package closure the climasus+ engine
# needs into src-tauri/resources/r, for embedding in the Tauri installer (macOS/arm64).
# Run from repo root: Rscript scripts/bundle-r.R
# Then strip + codesign with scripts/bundle-r-sign.sh.

R_VERSION_DIR <- Sys.getenv("CLIMASUS_R_VERSION_DIR", "/Library/Frameworks/R.framework/Versions/Current")
SRC_RESOURCES <- file.path(R_VERSION_DIR, "Resources")
SRC_LIB <- file.path(SRC_RESOURCES, "library")
OUT <- normalizePath(file.path(dirname(sub("--file=", "", grep("--file=", commandArgs(), value = TRUE))), "..", "src-tauri", "resources", "r"), mustWork = FALSE)

stopifnot("R.framework not found at expected path" = dir.exists(SRC_RESOURCES))

# every package the engine or a catalogued sus_* function calls directly (via :: or
# requireNamespace/library), found by: grep -ohE '\\b[a-zA-Z][a-zA-Z0-9._]*::' R/*.R
# plus requireNamespace/library("...") calls, over the climasus4r package source.
# base/recommended packages ship inside library/ on CRAN's mac build too, but aren't
# declared as Imports by anything (R auto-attaches them) — must list them explicitly.
BASE_PKGS <- c("base", "compiler", "datasets", "grDevices", "graphics", "grid", "methods",
  "parallel", "splines", "stats", "stats4", "tools", "utils") # tcltk excluded: needs XQuartz

USED <- c(
  BASE_PKGS,
  "climasus4r", "plumber", "jsonlite", "writexl", "nanoparquet", # engine itself
  "arrow", "CARBayes", "censobr", "cli", "data.table", "DBI", "digest", "dlnm", "dplyr",
  "duckdb", "exactextractr", "fs", "furrr", "future", "future.apply", "geobr", "geocodebr",
  "ggplot2", "ggrepel", "ggsci", "glue", "gt", "htmltools", "htmlwidgets", "httr", "httr2",
  "INLA", "knitr", "lubridate", "magrittr", "MASS", "microdatasus", "mvmeta",
  "parallelly", "patchwork", "plotly", "purrr", "RColorBrewer", "read.dbc", "readxl",
  "rlang", "rstudioapi", "scales", "sf", "sfarrow", "slider", "SpatialEpi", "spatialreg",
  "spdep", "splines", "stringi", "stringr", "strucchange", "survival", "targets", "terra",
  "tibble", "tidyr", "viridisLite",
  # webshot2/chromote: optional PNG snapshot of htmlwidget (map) results — drives whatever
  # Chrome/Chromium/Edge the user already has installed via chromote::find_chrome(); we
  # never bundle a browser, so this silently does nothing when none is found (see api.R).
  "webshot2", "chromote",
  "xgboost", "yaml", "zoo"
)

db <- installed.packages(lib.loc = SRC_LIB)
missing_root <- setdiff(USED, rownames(db))
if (length(missing_root)) stop("Missing from library, install first: ", paste(missing_root, collapse = ", "))

deps <- unique(unlist(tools::package_dependencies(USED, db = db, which = c("Depends", "Imports", "LinkingTo"), recursive = TRUE)))
all_pkgs <- sort(union(USED, deps))
present <- all_pkgs[dir.exists(file.path(SRC_LIB, all_pkgs))]
missing <- setdiff(all_pkgs, present)
if (length(missing)) message("Note: not present in library (base/recommended, ships with R): ", paste(missing, collapse = ", "))

cat(length(present), "packages to bundle\n")

unlink(OUT, recursive = TRUE)
dir.create(OUT, recursive = TRUE)
dir.create(file.path(OUT, "library"), recursive = TRUE)

# base runtime: everything in Resources except the full library and dev-only cruft
base_entries <- setdiff(list.files(SRC_RESOURCES), c("library", "doc", "tests"))
for (e in base_entries) {
  file.copy(file.path(SRC_RESOURCES, e), OUT, recursive = TRUE, copy.date = TRUE)
}

for (p in present) {
  file.copy(file.path(SRC_LIB, p), file.path(OUT, "library"), recursive = TRUE, copy.date = TRUE)
}

writeLines(present, file.path(OUT, "..", "bundled-packages.txt"))
cat("Bundled to", OUT, "\n")
cat("Run scripts/bundle-r-sign.sh next to strip cruft and codesign.\n")
