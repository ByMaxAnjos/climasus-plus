# Copies a self-contained R runtime + the exact package closure the climasus+ engine
# needs into src-tauri/resources/r, for embedding in the Tauri installer (macOS/arm64).
# Run from repo root: Rscript scripts/bundle-r.R
# Then strip + codesign with scripts/bundle-r-sign.sh.

R_VERSION_DIR <- Sys.getenv("CLIMASUS_R_VERSION_DIR", "/Library/Frameworks/R.framework/Versions/Current")
SRC_RESOURCES <- file.path(R_VERSION_DIR, "Resources")
SRC_LIB <- file.path(SRC_RESOURCES, "library")
OUT <- normalizePath(file.path(dirname(sub("--file=", "", grep("--file=", commandArgs(), value = TRUE))), "..", "src-tauri", "resources", "r"), mustWork = FALSE)

stopifnot("R.framework not found at expected path" = dir.exists(SRC_RESOURCES))

# package closure comes from the shared source of truth (also used by the Windows bundler
# and the CI install step) — see scripts/r-packages.R.
source(file.path(dirname(sub("--file=", "", grep("--file=", commandArgs(), value = TRUE))), "r-packages.R"))
USED <- CLIMASUS_USED

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
