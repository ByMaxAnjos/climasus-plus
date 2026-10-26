# book/scripts/02-run-ec02.R
# Real results for ec-02: dengue and growing degree days (GDD).
# Run: Rscript book/scripts/02-run-ec02.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
if (!length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  script_path <- normalizePath("book/scripts/02-run-ec02.R")
}
source(file.path(dirname(script_path), "00-setup.R"))

case <- "ec02"
ensure_case_dirs(case)
message_step("ec02: importing SINAN-DENGUE (CE, PE, BA, MA; 2015-2019)")

dados <- sus_data_import(
  system = "SINAN-DENGUE",
  uf = c("CE", "PE", "BA", "MA"),
  year = 2015:2019
) |>
  sus_data_clean_encoding() |>
  sus_data_standardize(lang = "pt") |>
  sus_data_create_variables(create_calendar_vars = TRUE) |>
  sus_data_aggregate(
    time_unit = "week",
    group_by = "codigo_municipio_residencia",
    complete_dates = TRUE,
    date_col = "data_primeiros_sintomas"
  )

message_step("ec02: joining municipality boundaries")
saude <- sus_spatial_join(dados)

message_step("ec02: importing INMET (same states/years)")
clima_raw <- sus_climate_inmet(years = 2015:2019, uf = c("CE", "PE", "BA", "MA"))

message_step("ec02: computing GDD (base 11 C, upper 35 C)")
clima <- sus_climate_compute_indicators(
  clima_raw,
  indicators = "gdd",
  custom_thresholds = list(gdd_base = 11, gdd_upper = 35)
)

message_step("ec02: integrating health and GDD (0-84 day lags)")
integrado <- sus_climate_aggregate(
  health_data = saude,
  climate_data = clima,
  climate_var = "gdd_c",
  temporal_strategy = "distributed_lag",
  lag_days = 84
)

parquet <- write_parquet_safe(integrado, file.path("data", case, "analytic.parquet"))
save_table(head(as.data.frame(drop_geometry(integrado)), 10), file.path("tables", "results", case, "amostra.csv"))
save_table(describe_data(as.data.frame(drop_geometry(saude)), "n_casos"), file.path("tables", "results", case, "descriptiva.csv"))

write_codebook(case, tibble::tribble(
  ~variable, ~description, ~unit, ~source,
  "date", "Semana epidemiológica (primeiro dia)", "date", "SINAN / agregação",
  "code_muni", "Código IBGE do município", "código", "geobr",
  "n_casos", "Casos notificados de dengue", "contagem", "SINAN-DENGUE",
  "gdd_c", "Graus-dia de desenvolvimento (base 11 °C, teto 35 °C)", "°C·dia", "INMET / indicadores",
  "gdd_c_lag0", "GDD no dia da semana do desfecho", "°C·dia", "integração",
  "data_primeiros_sintomas", "Data dos primeiros sintomas", "date", "SINAN-DENGUE"
))

message_step("ec02: fitting DLNM")
fit <- sus_mod_dlnm(
  integrado,
  outcome_col = "n_casos",
  climate_col = "gdd_c",
  dof_per_year = 2
)

save_table(fit$models, file.path("tables", "results", case, "modelo.csv"))
save_table(fit$exposure_response, file.path("tables", "results", case, "exposicao_resposta.csv"))
save_table(fit$lag_response, file.path("tables", "results", case, "defasagem.csv"))
diag <- fit$diagnostics; diag$autocorr_test <- NULL
jsonlite::write_json(diag, file.path("tables", "results", case, "diagnosticos.json"), pretty = TRUE, auto_unbox = TRUE)
jsonlite::write_json(fit$meta, file.path("tables", "results", case, "meta_modelo.json"), pretty = TRUE, auto_unbox = TRUE)

message_step("ec02: figures")
p_series <- tryCatch(
  sus_data_plot_aggregate_ts(dados, value_col = "n_casos", plot_type = "epidemic", lang = "pt"),
  error = function(e) { message("series plot skipped: ", conditionMessage(e)); NULL }
)
save_plot(p_series, file.path("images", "results", case, "serie.png"), width = 10, height = 5)

p_map <- tryCatch(
  sus_data_plot_aggregate_map(saude, value_col = "n_casos", map_type = "choropleth", rate_per_100k = FALSE, lang = "pt"),
  error = function(e) { message("map skipped: ", conditionMessage(e)); NULL }
)
save_plot(p_map, file.path("images", "results", case, "mapa.png"), width = 8, height = 7)

try(sus_mod_plot_dlnm(fit, type = "overall", save_plot = file.path("images", "results", case, "dlnm_overall.png"), lang = "pt"), silent = TRUE)
try(sus_mod_plot_dlnm(fit, type = "lag", save_plot = file.path("images", "results", case, "dlnm_lag.png"), lang = "pt"), silent = TRUE)
try(sus_mod_plot_dlnm(fit, type = "contour", save_plot = file.path("images", "results", case, "dlnm_contour.png"), lang = "pt"), silent = TRUE)

save_meta(
  case,
  params = list(
    system = "SINAN-DENGUE", uf = c("CE", "PE", "BA", "MA"), years = "2015:2019",
    time_unit = "week", date_anchor = "data_primeiros_sintomas",
    exposure = "gdd_c", gdd_base = 11, gdd_upper = 35,
    lag_days = 84, dof_per_year = 2
  ),
  data = integrado,
  parquet_path = parquet
)

message_step("ec02: done")
