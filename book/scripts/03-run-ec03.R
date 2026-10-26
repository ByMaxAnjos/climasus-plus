# book/scripts/03-run-ec03.R
# Real results for ec-03: cardiovascular mortality in older adults and heatwaves.
# Run: Rscript book/scripts/03-run-ec03.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
if (!length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  script_path <- normalizePath("book/scripts/03-run-ec03.R")
}
source(file.path(dirname(script_path), "00-setup.R"))

case <- "ec03"
ensure_case_dirs(case)
message_step("ec03: importing SIM-DO (SP; 2010-2019)")

dados <- sus_data_import(
  system = "SIM-DO",
  uf = "SP",
  year = 2010:2019
) |>
  sus_data_clean_encoding() |>
  sus_data_standardize(lang = "pt") |>
  sus_data_filter_cid(icd_codes = "I", match_type = "chapter") |>
  sus_data_create_variables(
    age_breaks = c(0, 60, Inf),
    create_calendar_vars = TRUE
  ) |>
  sus_data_filter_demographics(age_range = c(60, Inf)) |>
  sus_data_aggregate(
    time_unit = "day",
    group_by = "codigo_municipio_residencia",
    complete_dates = TRUE
  )

message_step("ec03: joining municipality boundaries")
saude <- sus_spatial_join(dados)

message_step("ec03: importing INMET (SP; 2010-2019)")
clima <- sus_climate_inmet(years = 2010:2019, uf = "SP")

message_step("ec03: detecting heatwaves (WHO p90, baseline 2010-2015)")
hw <- sus_climate_compute_heatwaves(
  clima,
  method = "WHO",
  percentile = 90,
  baseline_start = "2010-01-01",
  baseline_end = "2015-12-31"
)
save_table(hw$events, file.path("tables", "results", case, "eventos_calor.csv"))
save_table(hw$summary, file.path("tables", "results", case, "resumo_calor.csv"))
try(sus_climate_plot_heatwaves(hw, interactive = FALSE, save_plot = file.path("images", "results", case, "ondas_calor.png"), lang = "pt"), silent = TRUE)

message_step("ec03: integrating health and temperature (0-21 day lags)")
integrado <- sus_climate_aggregate(
  health_data = saude,
  climate_data = clima,
  climate_var = "tair_dry_bulb_c",
  temporal_strategy = "distributed_lag",
  lag_days = 21
)

parquet <- write_parquet_safe(integrado, file.path("data", case, "analytic.parquet"))
save_table(head(as.data.frame(drop_geometry(integrado)), 10), file.path("tables", "results", case, "amostra.csv"))
save_table(describe_data(as.data.frame(drop_geometry(saude)), "n_obitos"), file.path("tables", "results", case, "descriptiva.csv"))

write_codebook(case, tibble::tribble(
  ~variable, ~description, ~unit, ~source,
  "date", "Dia do óbito", "date", "SIM-DO / agregação",
  "code_muni", "Código IBGE do município", "código", "geobr",
  "n_obitos", "Óbitos cardiovasculares em pessoas de 60+ anos", "contagem", "SIM-DO",
  "tair_dry_bulb_c", "Temperatura do ar (bulbo seco)", "°C", "INMET",
  "tair_dry_bulb_c_lag0", "Temperatura no dia do desfecho", "°C", "integração"
))

message_step("ec03: fitting DLNM")
fit <- sus_mod_dlnm(
  integrado,
  outcome_col = "n_obitos",
  climate_col = "tair_dry_bulb_c",
  dof_per_year = 4
)

save_table(fit$models, file.path("tables", "results", case, "modelo.csv"))
save_table(fit$exposure_response, file.path("tables", "results", case, "exposicao_resposta.csv"))
save_table(fit$lag_response, file.path("tables", "results", case, "defasagem.csv"))
diag <- fit$diagnostics; diag$autocorr_test <- NULL
jsonlite::write_json(diag, file.path("tables", "results", case, "diagnosticos.json"), pretty = TRUE, auto_unbox = TRUE)
jsonlite::write_json(fit$meta, file.path("tables", "results", case, "meta_modelo.json"), pretty = TRUE, auto_unbox = TRUE)

message_step("ec03: attributable fraction")
af <- sus_mod_af(fit, nsim = 200, lang = "pt")
save_table(af$total, file.path("tables", "results", case, "af_total.csv"))
save_table(af$by_quantile, file.path("tables", "results", case, "af_quantis.csv"))
save_table(af$daily, file.path("tables", "results", case, "af_diaria.csv"))

message_step("ec03: figures")
p_series <- tryCatch(
  sus_data_plot_aggregate_ts(dados, value_col = "n_obitos", plot_type = "epidemic", lang = "pt"),
  error = function(e) { message("series plot skipped: ", conditionMessage(e)); NULL }
)
save_plot(p_series, file.path("images", "results", case, "serie.png"), width = 10, height = 5)

p_map <- tryCatch(
  sus_data_plot_aggregate_map(saude, value_col = "n_obitos", map_type = "choropleth", rate_per_100k = FALSE, lang = "pt"),
  error = function(e) { message("map skipped: ", conditionMessage(e)); NULL }
)
save_plot(p_map, file.path("images", "results", case, "mapa.png"), width = 8, height = 7)

try(sus_mod_plot_dlnm(fit, type = "overall", save_plot = file.path("images", "results", case, "dlnm_overall.png"), lang = "pt"), silent = TRUE)
try(sus_mod_plot_dlnm(fit, type = "lag", save_plot = file.path("images", "results", case, "dlnm_lag.png"), lang = "pt"), silent = TRUE)
try(sus_mod_plot_dlnm(fit, type = "contour", save_plot = file.path("images", "results", case, "dlnm_contour.png"), lang = "pt"), silent = TRUE)
try(sus_mod_plot_af(af, type = "bar", save_plot = file.path("images", "results", case, "af_bar.png"), lang = "pt"), silent = TRUE)
try(sus_mod_plot_af(af, type = "forest", save_plot = file.path("images", "results", case, "af_forest.png"), lang = "pt"), silent = TRUE)

save_meta(
  case,
  params = list(
    system = "SIM-DO", uf = "SP", years = "2010:2019",
    cid = "I", age_range = "60+", time_unit = "day",
    exposure = "tair_dry_bulb_c", lag_days = 21, dof_per_year = 4,
    heatwave_method = "WHO", heatwave_percentile = 90,
    heatwave_baseline = "2010-01-01/2015-12-31"
  ),
  data = integrado,
  parquet_path = parquet
)

message_step("ec03: done")
