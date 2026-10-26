# book/scripts/04c-ec04-window-plot.R
# Zoom the ec-04 counterfactual to a short window around the event. The full
# 9-year projection is not credible (linear trend extrapolation explodes), so the
# guide shows only the event window.
# Run: Rscript book/scripts/04c-ec04-window-plot.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
if (!length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  script_path <- normalizePath("book/scripts/04c-ec04-window-plot.R")
}
source(file.path(dirname(script_path), "00-setup.R"))

case <- "ec04"
cf_path <- file.path("tables", "results", case, "its_contrafactual.csv")
ev_path <- file.path("tables", "results", case, "evento_escolhido.csv")
cf <- readr::read_csv(cf_path, show_col_types = FALSE)
ev <- readr::read_csv(ev_path, show_col_types = FALSE)
event_date <- as.Date(ev$start_date[[1L]])
window <- 180L
d <- cf |>
  dplyr::filter(.data$date >= event_date - window, .data$date <= event_date + window)

save_table(d, file.path("tables", "results", case, "its_janela_180d.csv"))

p <- ggplot2::ggplot(d, ggplot2::aes(x = .data$date)) +
  ggplot2::geom_ribbon(ggplot2::aes(ymin = .data$cf_lo, ymax = .data$cf_hi), fill = "#0E7C6B", alpha = 0.15) +
  ggplot2::geom_line(ggplot2::aes(y = .data$observed), color = "grey30", linewidth = 0.6) +
  ggplot2::geom_line(ggplot2::aes(y = .data$counterfactual), color = "#0E7C6B", linewidth = 0.9, linetype = "dashed") +
  ggplot2::geom_vline(xintercept = event_date, linetype = "dotted", color = "#B23A2E") +
  ggplot2::labs(
    x = "Data", y = "Internações/dia",
    title = "Série observada e contrafactual — Porto Alegre",
    subtitle = paste("Evento de frio:", format(event_date), "· janela de ±180 dias"),
    caption = "Contrafactual: tendência e sazonalidade pré-evento projetadas. A projeção de longo prazo não é mostrada."
  ) +
  ggplot2::theme_classic(base_size = 12)
save_plot(p, file.path("images", "results", case, "its_contrafactual.png"), width = 10, height = 5)
message("ec04 window plot written")
