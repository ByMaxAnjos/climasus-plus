# book/scripts/01-run-ec01.R
# Real results for ec-01: pediatric respiratory mortality and temperature.
# Run: Rscript book/scripts/01-run-ec01.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
if (!length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  script_path <- normalizePath("book/scripts/01-run-ec01.R")
}
source(file.path(dirname(script_path), "00-setup.R"))

case <- "ec01"
ensure_case_dirs(case)
message_step("ec01: importing SIM-DO (SP, RJ, MG, ES; 2015-2019)")

dados <- sus_data_import(
  system = "SIM-DO",
  uf = c("SP", "RJ", "MG", "ES"),
  year = 2015:2019
) |>
  sus_data_clean_encoding() |>
  sus_data_standardize(lang = "pt") |>
  sus_data_filter_cid(disease_group = "respiratory") |>
  sus_data_create_variables(
    age_breaks = c(0, 5, 15, 60, Inf),
    create_calendar_vars = TRUE
  ) |>
  sus_data_filter_demographics(age_range = c(0, 5)) |>
  sus_data_aggregate(
    time_unit = "week",
    group_by = "codigo_municipio_residencia",
    complete_dates = TRUE
  )

message_step("ec01: joining municipality boundaries")
saude <- sus_spatial_join(dados)

message_step("ec01: importing INMET (same states/years)")
clima <- sus_climate_inmet(years = 2015:2019, uf = c("SP", "RJ", "MG", "ES"))

message_step("ec01: integrating health and climate (0-21 day lags)")
integrado <- sus_climate_aggregate(
  health_data = saude,
  climate_data = clima,
  climate_var = c("tair_dry_bulb_c", "rh_mean_porc"),
  temporal_strategy = "distributed_lag",
  lag_days = 21
)

parquet <- write_parquet_safe(integrado, file.path("data", case, "analytic.parquet"))
save_table(head(as.data.frame(drop_geometry(integrado)), 10), file.path("tables", "results", case, "amostra.csv"))
save_table(describe_data(as.data.frame(drop_geometry(saude)), "n_obitos"), file.path("tables", "results", case, "descriptiva.csv"))

write_codebook(case, tibble::tribble(
  ~variable, ~description, ~unit, ~source,
  "date", "Data de referência da semana", "date", "SIM-DO / agregação",
  "code_muni", "Código IBGE do município", "código", "geobr",
  "n_obitos", "Óbitos respiratórios em menores de 5 anos", "contagem", "SIM-DO",
  "tair_dry_bulb_c", "Temperatura do ar (bulbo seco)", "°C", "INMET",
  "rh_mean_porc", "Umidade relativa média", "%", "INMET",
  "rh_mean_porc_lag0", "Umidade relativa na semana do desfecho", "%", "INMET"
))

message_step("ec01: fitting DLNM")
fit <- sus_mod_dlnm(
  integrado,
  outcome_col = "n_obitos",
  climate_col = "tair_dry_bulb_c",
  covariates = "rh_mean_porc_lag0",
  dof_per_year = 2
)

save_table(fit$models, file.path("tables", "results", case, "modelo.csv"))
save_table(fit$exposure_response, file.path("tables", "results", case, "exposicao_resposta.csv"))
save_table(fit$lag_response, file.path("tables", "results", case, "defasagem.csv"))
diag <- fit$diagnostics; diag$autocorr_test <- NULL
jsonlite::write_json(diag, file.path("tables", "results", case, "diagnosticos.json"), pretty = TRUE, auto_unbox = TRUE)
jsonlite::write_json(fit$meta, file.path("tables", "results", case, "meta_modelo.json"), pretty = TRUE, auto_unbox = TRUE)

message_step("ec01: attributable fraction")
af <- sus_mod_af(fit, lang = "pt")
save_table(af$total, file.path("tables", "results", case, "af_total.csv"))
save_table(af$by_quantile, file.path("tables", "results", case, "af_quantis.csv"))
save_table(af$daily, file.path("tables", "results", case, "af_diaria.csv"))

message_step("ec01: figures")
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
    system = "SIM-DO", uf = c("SP", "RJ", "MG", "ES"), years = "2015:2019",
    cid = "respiratory", age_range = "0-5", time_unit = "week",
    exposure = "tair_dry_bulb_c", covariates = "rh_mean_porc_lag0",
    lag_days = 21, dof_per_year = 2
  ),
  data = integrado,
  parquet_path = parquet
)

message_step("ec01: done")
