# book/scripts/00-setup.R
# Common helpers for the guide's real-results scripts.
# Run from the repository root, e.g.:
#   Rscript book/scripts/02-run-ec02.R

if (!exists("script_path") || !length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  args <- commandArgs(trailingOnly = FALSE)
  file_arg <- args[grep("^--file=", args)]
  if (length(file_arg)) {
    script_path <- normalizePath(sub("^--file=", "", file_arg[[1L]]))
  } else {
    candidates <- c("book/scripts/00-setup.R", "scripts/00-setup.R", "00-setup.R")
    candidates <- candidates[file.exists(candidates)]
    if (!length(candidates)) stop("Cannot locate 00-setup.R; run from the repository root.")
    script_path <- normalizePath(candidates[[1L]])
  }
}
GUIDE_ROOT <- normalizePath(file.path(dirname(script_path), ".."))
setwd(GUIDE_ROOT)

suppressPackageStartupMessages({
  library(climasus4r)
  library(dplyr)
  library(readr)
  library(ggplot2)
  library(jsonlite)
})

`%||%` <- function(a, b) if (is.null(a)) b else a

ensure_case_dirs <- function(case) {
  for (d in c(
    file.path("data", case),
    file.path("images", "results", case),
    file.path("tables", "results", case),
    "results"
  )) {
    if (!dir.exists(d)) dir.create(d, recursive = TRUE)
  }
  invisible(TRUE)
}

drop_geometry <- function(df) {
  if (inherits(df, "sf")) df <- sf::st_drop_geometry(df)
  geom_cols <- intersect(c("geom", "geometry"), names(df))
  if (length(geom_cols)) df[geom_cols] <- NULL
  df
}

write_parquet_safe <- function(df, path) {
  df <- as.data.frame(drop_geometry(df))
  if (requireNamespace("arrow", quietly = TRUE)) {
    ok <- tryCatch({
      arrow::write_parquet(df, path)
      TRUE
    }, error = function(e) {
      message("Parquet export failed: ", conditionMessage(e), "; falling back to CSV.")
      FALSE
    })
    if (isTRUE(ok)) return(path)
  }
  csv <- sub("\\.parquet$", ".csv", path)
  readr::write_csv(df, csv)
  csv
}

save_table <- function(df, path) {
  readr::write_csv(as.data.frame(df), path)
  invisible(path)
}

save_plot <- function(p, path, width = 8, height = 5) {
  if (is.null(p)) return(invisible(FALSE))
  if (inherits(p, "htmlwidget")) {
    if (requireNamespace("htmlwidgets", quietly = TRUE)) {
      htmlwidgets::saveWidget(p, path, selfcontained = TRUE)
      return(invisible(TRUE))
    }
    return(invisible(FALSE))
  }
  if (inherits(p, "ggplot") || inherits(p, "patchwork") || inherits(p, "gg")) {
    ggplot2::ggsave(path, plot = p, width = width, height = height, dpi = 300, bg = "white")
    return(invisible(TRUE))
  }
  invisible(FALSE)
}

describe_data <- function(df, outcome, group_col = "code_muni") {
  if (!group_col %in% names(df)) group_col <- "codigo_municipio_residencia"
  if (!group_col %in% names(df)) group_col <- NA_character_
  tibble::tibble(
    n_rows = nrow(df),
    n_municipalities = if (is.na(group_col)) NA_integer_ else dplyr::n_distinct(df[[group_col]], na.rm = TRUE),
    date_min = min(df$date, na.rm = TRUE),
    date_max = max(df$date, na.rm = TRUE),
    n_periods = dplyr::n_distinct(df$date, na.rm = TRUE),
    outcome_total = sum(df[[outcome]], na.rm = TRUE),
    outcome_mean = mean(df[[outcome]], na.rm = TRUE),
    outcome_max = max(df[[outcome]], na.rm = TRUE),
    outcome_missing = sum(is.na(df[[outcome]]))
  )
}

save_meta <- function(case, params, data, parquet_path, extra = list()) {
  dir.create("results", showWarnings = FALSE)
  meta <- c(list(
    case = case,
    generated_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z"),
    studio_version = "1.1.0-beta.1",
    climasus4r_version = as.character(utils::packageVersion("climasus4r")),
    r_version = R.version.string,
    params = params,
    n_records = nrow(data),
    data_file = parquet_path,
    data_checksum = if (file.exists(parquet_path)) unname(tools::md5sum(parquet_path)) else NA_character_
  ), extra)
  jsonlite::write_json(meta, file.path("results", paste0(case, ".json")), pretty = TRUE, auto_unbox = TRUE)
  utils::capture.output(utils::sessionInfo(), file = file.path("results", paste0(case, "-session-info.txt")))
  invisible(meta)
}

write_codebook <- function(case, rows) {
  path <- file.path("data", case, "codebook.csv")
  readr::write_csv(tibble::as_tibble(rows), path)
  invisible(path)
}

message_step <- function(...) message("[", format(Sys.time(), "%H:%M:%S"), "] ", ...)
