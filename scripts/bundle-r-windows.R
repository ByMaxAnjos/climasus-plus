# Windows counterpart of scripts/bundle-r.R. Copies a self-contained R runtime + the exact
# package closure the climasus+ engine needs into src-tauri/resources/r, for embedding in the
# Tauri (NSIS/MSI) installer. Unlike macOS there is NO Mach-O relocation or codesigning step:
# R for Windows is relocatable — copy R_HOME intact and bin/x64/R.exe self-detects R_HOME.
# Run on a Windows machine/runner from repo root: Rscript scripts/bundle-r-windows.R

R_HOME <- R.home()
SCRIPT_DIR <- dirname(sub("--file=", "", grep("--file=", commandArgs(), value = TRUE)))
OUT <- normalizePath(file.path(SCRIPT_DIR, "..", "src-tauri", "resources", "r"), mustWork = FALSE)

# package closure comes from the shared source of truth (also used by the CI install step)
source(file.path(SCRIPT_DIR, "r-packages.R"))
USED <- CLIMASUS_USED

# resolve packages across ALL .libPaths(), not just R_HOME/library — on Windows/CI pak often
# installs into a user library, so a fixed R.home("library") lookup would falsely report them
# missing. installed.packages() spans every lib path and gives each package's real LibPath.
db <- installed.packages()
missing_root <- setdiff(USED, rownames(db))
if (length(missing_root)) stop("Missing, install first: ", paste(missing_root, collapse = ", "))

deps <- unique(unlist(tools::package_dependencies(USED, db = db, which = c("Depends", "Imports", "LinkingTo"), recursive = TRUE)))
all_pkgs <- sort(union(USED, deps))
present <- all_pkgs[all_pkgs %in% rownames(db)]
missing <- setdiff(all_pkgs, present)
if (length(missing)) message("Note: not installed (base/recommended already inside R_HOME): ", paste(missing, collapse = ", "))

# de-dup by name if a package exists in more than one lib path (keep the first .libPaths() hit)
lib_of <- function(p) db[p, "LibPath"][[1]]

cat(length(present), "packages to bundle\n")

unlink(OUT, recursive = TRUE)
dir.create(OUT, recursive = TRUE)

# base runtime: everything in R_HOME except the full library and dev/doc cruft. Tcl dropped
# (tcltk excluded above). etc/, bin/, modules/, share/ etc. are copied as-is.
top_entries <- setdiff(list.files(R_HOME), c("library", "doc", "tests", "Tcl"))
for (e in top_entries) {
  file.copy(file.path(R_HOME, e), OUT, recursive = TRUE, copy.date = TRUE)
}

dir.create(file.path(OUT, "library"), recursive = TRUE)
for (p in present) {
  file.copy(file.path(lib_of(p), p), file.path(OUT, "library"), recursive = TRUE, copy.date = TRUE)
}

writeLines(present, file.path(OUT, "..", "bundled-packages.txt"))
cat("Bundled to", OUT, "\n")
cat("No relocation/signing needed on Windows. Next: npx @tauri-apps/cli build --bundles nsis\n")
