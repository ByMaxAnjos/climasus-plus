# book/scripts/run-all.R
# Runs the four real-results scripts and writes one log per case.
# Run: Rscript book/scripts/run-all.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
root <- normalizePath(file.path(dirname(script_path), ".."))
setwd(root)
if (!dir.exists("results")) dir.create("results", recursive = TRUE)

cases <- c(
  "01-run-ec01.R",
  "02-run-ec02.R",
  "03-run-ec03.R",
  "04-run-ec04.R"
)

status <- integer(length(cases))
names(status) <- cases
for (s in cases) {
  log <- file.path("results", paste0(sub("\\.R$", "", s), ".log"))
  message("Running ", s, " -> ", log)
  status[[s]] <- system2(
    command = file.path(R.home("bin"), "Rscript"),
    args = file.path("scripts", s),
    stdout = log,
    stderr = log,
    wait = TRUE
  )
}

print(status)
if (any(status != 0L)) {
  warning("Some cases failed; see results/*.log")
} else {
  message("All cases finished. Send the contents of book/results/ and book/images/results/ to integrate the guide.")
}
