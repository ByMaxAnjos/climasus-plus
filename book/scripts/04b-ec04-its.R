# book/scripts/04b-ec04-its.R
# Resume ec-04 from the saved Porto Alegre parquet: choose the longest cold event
# at the Porto Alegre station (A801) and refit the ITS without re-downloading.
# Run: Rscript book/scripts/04b-ec04-its.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
if (!length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  script_path <- normalizePath("book/scripts/04b-ec04-its.R")
}
source(file.path(dirname(script_path), "00-setup.R"))

case <- "ec04"
ensure_case_dirs(case)
parquet <- file.path("data", case, "analytic.parquet")
if (!file.exists(parquet)) stop("Run 04-run-ec04.R first (analytic parquet missing).")

message_step("ec04: reading saved Porto Alegre parquet")
df <- arrow::read_parquet(parquet)
integrado <- climasus4r:::new_climasus_df(
  df,
  list(system = "SIH", stage = "spatial", type = "munic")
)

message_step("ec04: choosing the longest cold event at station A801 (Porto Alegre)")
eventos <- readr::read_csv(file.path("tables", "results", case, "eventos_frio.csv"), show_col_types = FALSE)
poa <- eventos |>
  dplyr::filter(grepl("PORTO ALEGRE", .data$station_name, ignore.case = TRUE)) |>
  dplyr::arrange(dplyr::desc(.data$duration_days), dplyr::desc(.data$severity_index)) |>
  dplyr::slice(1L)
if (nrow(poa) == 0L) stop("No A801 event found in eventos_frio.csv")
poa$dist_km <- 5.54
save_table(poa, file.path("tables", "results", case, "evento_escolhido.csv"))
event_date <- as.character(poa$start_date[[1L]])

message_step("ec04: fitting ITS at ", event_date)
its <- sus_mod_its(
  integrado,
  outcome_col = "n_internacoes",
  interruption_dates = event_date
)
save_table(its$effects, file.path("tables", "results", case, "its_efeitos.csv"))
save_table(its$counterfactual, file.path("tables", "results", case, "its_contrafactual.csv"))
save_table(its$segments, file.path("tables", "results", case, "its_segmentos.csv"))
jsonlite::write_json(its$meta, file.path("tables", "results", case, "its_meta.json"), pretty = TRUE, auto_unbox = TRUE)

message_step("ec04: figures")
p_series <- tryCatch(
  sus_data_plot_aggregate_ts(integrado, value_col = "n_internacoes", plot_type = "epidemic", lang = "pt"),
  error = function(e) { message("series plot skipped: ", conditionMessage(e)); NULL }
)
save_plot(p_series, file.path("images", "results", case, "serie.png"), width = 10, height = 5)

cf <- its$counterfactual
if (!is.null(cf) && nrow(cf) > 0L) {
  p_its <- ggplot2::ggplot(cf, ggplot2::aes(x = .data$date)) +
    ggplot2::geom_ribbon(ggplot2::aes(ymin = .data$cf_lo, ymax = .data$cf_hi), fill = "#0E7C6B", alpha = 0.15) +
    ggplot2::geom_line(ggplot2::aes(y = .data$observed), color = "grey35", linewidth = 0.5) +
    ggplot2::geom_line(ggplot2::aes(y = .data$counterfactual), color = "#0E7C6B", linewidth = 0.8, linetype = "dashed") +
    ggplot2::geom_vline(xintercept = as.Date(event_date), linetype = "dotted", color = "#B23A2E") +
    ggplot2::labs(
      x = "Data", y = "Internações/dia",
      title = "Série observada e contrafactual — Porto Alegre",
      subtitle = paste("Evento de frio:", event_date),
      caption = "Contrafactual: tendência e sazonalidade pré-evento projetadas."
    ) +
    ggplot2::theme_classic(base_size = 12)
  save_plot(p_its, file.path("images", "results", case, "its_contrafactual.png"), width = 10, height = 5)
}

save_meta(
  case,
  params = list(
    system = "SIH-RD", region = "sul", years = "2010:2019", month = "1:12",
    cid = "J09-J18", time_unit = "day", city = "Porto Alegre",
    station = "A801", exposure = "cold event (WHO p10)", event_date = event_date,
    baseline = "2010-01-01/2015-12-31"
  ),
  data = integrado,
  parquet_path = parquet
)

message_step("ec04: resume done")
