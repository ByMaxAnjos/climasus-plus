# book/scripts/06-make-series-plots.R
# Build a daily/weekly total series from a saved analytic parquet. Used to fill
# the ec03 series figure (the full ec03 run timed out before plotting).
# Run: Rscript book/scripts/06-make-series-plots.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
if (!length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  script_path <- normalizePath("book/scripts/06-make-series-plots.R")
}
source(file.path(dirname(script_path), "00-setup.R"))

make_series <- function(case, outcome, title, ylab, fill) {
  parquet <- file.path("data", case, "analytic.parquet")
  if (!file.exists(parquet)) {
    message("skip ", case, ": parquet missing")
    return(invisible(FALSE))
  }
  df <- arrow::read_parquet(parquet)
  if (!all(c("date", outcome) %in% names(df))) {
    message("skip ", case, ": date/outcome missing")
    return(invisible(FALSE))
  }
  weekly <- df |>
    dplyr::mutate(week = lubridate::floor_date(.data$date, "week")) |>
    dplyr::group_by(.data$week) |>
    dplyr::summarise(value = sum(.data[[outcome]], na.rm = TRUE), .groups = "drop") |>
    dplyr::arrange(.data$week) |>
    dplyr::slice(-c(1L, dplyr::n()))
  p <- ggplot2::ggplot(weekly, ggplot2::aes(x = .data$week, y = .data$value)) +
    ggplot2::geom_col(fill = fill, width = 6) +
    ggplot2::labs(
      x = "Data", y = ylab,
      title = title,
      subtitle = paste("Total semanal; n =", nrow(weekly), "semanas"),
      caption = "Fonte: DATASUS / climasus4r."
    ) +
    ggplot2::theme_classic(base_size = 12)
  save_plot(p, file.path("images", "results", case, "serie.png"), width = 10, height = 5)
  invisible(TRUE)
}

make_series(
  "ec03", "n_obitos",
  "Óbitos cardiovasculares em idosos — total semanal em SP",
  "Óbitos/semana", "#2B6CB0"
)
message("series plots written")
