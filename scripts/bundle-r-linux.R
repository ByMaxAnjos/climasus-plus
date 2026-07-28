# Linux counterpart of scripts/bundle-r.R / bundle-r-windows.R. Copies a self-contained R
# runtime + the exact package closure the climasus+ engine needs into src-tauri/resources/r,
# for embedding in the Tauri (deb/AppImage) bundle.
# Run on a Linux machine/runner from repo root: Rscript scripts/bundle-r-linux.R
# Then run scripts/bundle-r-relocate-linux.sh (patches bin/R to self-detect R_HOME — Debian/Ubuntu
# R hardcodes an absolute R_HOME_DIR at build time, same issue as the macOS R.framework).

R_HOME <- R.home()
SCRIPT_DIR <- dirname(sub("--file=", "", grep("--file=", commandArgs(), value = TRUE)))
OUT <- normalizePath(file.path(SCRIPT_DIR, "..", "src-tauri", "resources", "r"), mustWork = FALSE)

# package closure comes from the shared source of truth (also used by the Windows/macOS
# bundlers and the CI install steps)
source(file.path(SCRIPT_DIR, "r-packages.R"))
USED <- CLIMASUS_USED

# resolve packages across ALL .libPaths(), not just R_HOME/library — pak may install into a
# user library depending on the runner setup.
db <- installed.packages()
missing_root <- setdiff(USED, rownames(db))
if (length(missing_root)) stop("Missing, install first: ", paste(missing_root, collapse = ", "))

deps <- unique(unlist(tools::package_dependencies(USED, db = db, which = c("Depends", "Imports", "LinkingTo"), recursive = TRUE)))
all_pkgs <- sort(union(USED, deps))
present <- all_pkgs[all_pkgs %in% rownames(db)]
missing <- setdiff(all_pkgs, present)
if (length(missing)) message("Note: not installed (base/recommended already inside R_HOME): ", paste(missing, collapse = ", "))

lib_of <- function(p) db[p, "LibPath"][[1]]

cat(length(present), "packages to bundle\n")

unlink(OUT, recursive = TRUE)
dir.create(OUT, recursive = TRUE)

# base runtime: everything in R_HOME except the full library and dev/doc cruft.
top_entries <- setdiff(list.files(R_HOME), c("library", "doc", "tests"))
for (e in top_entries) {
  file.copy(file.path(R_HOME, e), OUT, recursive = TRUE, copy.date = TRUE)
}

dir.create(file.path(OUT, "library"), recursive = TRUE)
for (p in present) {
  file.copy(file.path(lib_of(p), p), file.path(OUT, "library"), recursive = TRUE, copy.date = TRUE)
}

writeLines(present, file.path(OUT, "..", "bundled-packages.txt"))
cat("Bundled to", OUT, "\n")
cat("Next: bash scripts/bundle-r-relocate-linux.sh, then npx @tauri-apps/cli build --bundles deb,appimage\n")
