# book/scripts/04-run-ec04.R
# Real results for ec-04: respiratory hospitalizations and a cold event in Porto Alegre.
# Run: Rscript book/scripts/04-run-ec04.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
if (!length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  script_path <- normalizePath("book/scripts/04-run-ec04.R")
}
source(file.path(dirname(script_path), "00-setup.R"))

case <- "ec04"
ensure_case_dirs(case)
message_step("ec04: importing SIH-RD (South; 2010-2019, all months)")

# Filter Porto Alegre BEFORE aggregation: the full South daily series has ~4.5M rows
# and the spatial join runs out of memory. The result for the single-city ITS is identical.
dados_poa <- sus_data_import(
  system = "SIH-RD",
  region = "sul",
  year = 2010:2019,
  month = 1:12
) |>
  sus_data_clean_encoding() |>
  sus_data_standardize(lang = "pt") |>
  sus_data_filter_cid(icd_codes = c("J09", "J18"), match_type = "range") |>
  # SIH-RD metadata is exposed as SIH-SP by sus_data_import; sus_data_create_variables()
  # rejects that label. sus_data_aggregate() detects the date and aggregates without it.
  sus_data_filter_demographics(city = "Porto Alegre") |>
  sus_data_aggregate(
    time_unit = "day",
    group_by = "codigo_municipio_residencia",
    complete_dates = TRUE
  )

message_step("ec04: joining municipality boundaries (Porto Alegre only)")
saude_poa <- sus_spatial_join(dados_poa)

message_step("ec04: importing INMET (South; 2010-2019)")
clima <- sus_climate_inmet(years = 2010:2019, uf = c("PR", "SC", "RS"))

message_step("ec04: detecting cold waves (WHO p10, baseline 2010-2015)")
cw <- sus_climate_compute_coldwaves(
  clima,
  method = "WHO",
  percentile = 10,
  baseline_start = "2010-01-01",
  baseline_end = "2015-12-31"
)
save_table(cw$events, file.path("tables", "results", case, "eventos_frio.csv"))
save_table(cw$summary, file.path("tables", "results", case, "resumo_frio.csv"))
try(sus_climate_plot_coldwaves(cw, interactive = FALSE, save_plot = file.path("images", "results", case, "ondas_frio.png"), lang = "pt"), silent = TRUE)

# Pick a real cold event from the station nearest to Porto Alegre.
pick_event <- function(cw, city_code = "4314902") {
  ev <- cw$events
  if (is.null(ev) || nrow(ev) == 0L) return(NULL)
  poa <- tryCatch(
    geobr::read_municipality(code_muni = city_code, year = 2020, showProgress = FALSE),
    error = function(e) NULL
  )
  if (!is.null(poa) && requireNamespace("sf", quietly = TRUE)) {
    poa_pt <- sf::st_point_on_surface(sf::st_transform(poa, 4326))
    ev_sf <- sf::st_as_sf(ev, coords = c("longitude", "latitude"), crs = 4326, remove = FALSE)
    d <- as.numeric(sf::st_distance(ev_sf, poa_pt))
    ev$dist_km <- d / 1000
    nearest <- ev$station_code[which.min(d)]
    ev <- ev[ev$station_code == nearest, , drop = FALSE]
  } else {
    # geobr may be offline; fall back to the Porto Alegre station by name.
    poa_ev <- ev[grepl("PORTO ALEGRE", ev$station_name, ignore.case = TRUE), , drop = FALSE]
    if (nrow(poa_ev) > 0L) ev <- poa_ev
  }
  ev |>
    dplyr::arrange(dplyr::desc(.data$duration_days), dplyr::desc(.data$severity_index)) |>
    dplyr::slice(1L)
}

evento <- pick_event(cw)
if (is.null(evento) || nrow(evento) == 0L) {
  warning("No cold-wave event found; falling back to 2013-07-23 (placeholder).")
  event_date <- "2013-07-23"
  save_table(tibble::tibble(note = "fallback placeholder"), file.path("tables", "results", case, "evento_escolhido.csv"))
} else {
  event_date <- as.character(evento$start_date[[1L]])
  save_table(evento, file.path("tables", "results", case, "evento_escolhido.csv"))
}

save_table(describe_data(as.data.frame(drop_geometry(saude_poa)), "n_internacoes"), file.path("tables", "results", case, "descriptiva.csv"))
save_table(head(as.data.frame(drop_geometry(saude_poa)), 10), file.path("tables", "results", case, "amostra.csv"))
parquet <- write_parquet_safe(saude_poa, file.path("data", case, "analytic.parquet"))

write_codebook(case, tibble::tribble(
  ~variable, ~description, ~unit, ~source,
  "date", "Dia da internação", "date", "SIH-RD / agregação",
  "code_muni", "Código IBGE do município", "código", "geobr",
  "n_internacoes", "Internações por J09-J18", "contagem", "SIH-RD",
  "event_date", "Início do evento de frio selecionado", "date", "INMET / ondas de frio"
))

message_step("ec04: fitting interrupted time series at ", event_date)
its <- sus_mod_its(
  saude_poa,
  outcome_col = "n_internacoes",
  interruption_dates = event_date
)
save_table(its$effects, file.path("tables", "results", case, "its_efeitos.csv"))
save_table(its$counterfactual, file.path("tables", "results", case, "its_contrafactual.csv"))
save_table(its$segments, file.path("tables", "results", case, "its_segmentos.csv"))
jsonlite::write_json(its$meta, file.path("tables", "results", case, "its_meta.json"), pretty = TRUE, auto_unbox = TRUE)

message_step("ec04: figures")
p_series <- tryCatch(
  sus_data_plot_aggregate_ts(dados_poa, value_col = "n_internacoes", plot_type = "epidemic", lang = "pt"),
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
      title = "Série observada e contrafactual",
      subtitle = paste("Interrupção:", event_date),
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
    exposure = "cold event (WHO p10)", event_date = event_date,
    baseline = "2010-01-01/2015-12-31"
  ),
  data = saude_poa,
  parquet_path = parquet
)

message_step("ec04: done")
