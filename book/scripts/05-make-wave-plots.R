# book/scripts/05-make-wave-plots.R
# Build static PNGs for the heat/cold wave sections from the saved summary tables.
# The package's plot function returns an interactive HTML widget when save_plot is a .png;
# the guide needs a static figure, so we draw a simple annual bar chart instead.
# Run: Rscript book/scripts/05-make-wave-plots.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
if (!length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  script_path <- normalizePath("book/scripts/05-make-wave-plots.R")
}
source(file.path(dirname(script_path), "00-setup.R"))

pick_station <- function(df, value) {
  df |>
    dplyr::group_by(.data$station_code) |>
    dplyr::summarise(
      n_years = dplyr::n(),
      total = sum(.data[[value]], na.rm = TRUE),
      .groups = "drop"
    ) |>
    dplyr::arrange(dplyr::desc(.data$n_years), dplyr::desc(.data$total)) |>
    dplyr::slice(1L) |>
    dplyr::pull(.data$station_code)
}

make_plot <- function(csv, value, title, ylab, fill, out) {
  df <- readr::read_csv(csv, show_col_types = FALSE)
  st <- pick_station(df, value)
  d <- df |> dplyr::filter(.data$station_code == st) |> dplyr::arrange(.data$year)
  p <- ggplot2::ggplot(d, ggplot2::aes(x = .data$year, y = .data[[value]])) +
    ggplot2::geom_col(fill = fill, width = 0.72) +
    ggplot2::geom_text(ggplot2::aes(label = .data[[value]]), vjust = -0.35, size = 3) +
    ggplot2::labs(
      x = "Ano", y = ylab,
      title = title,
      subtitle = paste("Estação", st, "· método WHO · baseline 2010–2015"),
      caption = "Fonte: INMET / climasus4r."
    ) +
    ggplot2::scale_x_continuous(breaks = sort(unique(d$year))) +
    ggplot2::theme_classic(base_size = 12) +
    ggplot2::theme(axis.text.x = ggplot2::element_text(angle = 45, hjust = 1))
  ggplot2::ggsave(out, p, width = 10, height = 5, dpi = 300, bg = "white")
  invisible(p)
}

make_plot(
  "tables/results/ec03/resumo_calor.csv", "total_days_hw",
  "Dias de onda de calor por ano", "Dias de onda de calor",
  "#D99A2B", "images/results/ec03/ondas_calor.png"
)
make_plot(
  "tables/results/ec04/resumo_frio.csv", "total_days_cw",
  "Dias de onda de frio por ano", "Dias de onda de frio",
  "#2B6CB0", "images/results/ec04/ondas_frio.png"
)
message("wave plots written")
