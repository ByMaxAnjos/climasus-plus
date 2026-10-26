# book/scripts/03b-ec03-af.R
# Resume ec-03 from the saved analytic parquet: refit the DLNM and compute AF
# with a lighter Monte Carlo budget (200 simulations) for the guide.
# Run: Rscript book/scripts/03b-ec03-af.R
args <- commandArgs(trailingOnly = FALSE)
script_path <- normalizePath(sub("--file=", "", args[grep("--file=", args)]))
if (!length(script_path) || is.na(script_path) || !nzchar(script_path)) {
  script_path <- normalizePath("book/scripts/03b-ec03-af.R")
}
source(file.path(dirname(script_path), "00-setup.R"))

case <- "ec03"
ensure_case_dirs(case)
parquet <- file.path("data", case, "analytic.parquet")
if (!file.exists(parquet)) stop("Run 03-run-ec03.R first (analytic parquet missing).")

message_step("ec03: reading saved analytic parquet")
df <- arrow::read_parquet(parquet)
integrado <- climasus4r:::new_climasus_df(
  df,
  list(system = "SIM", stage = "climate", type = "distributed_lag")
)

message_step("ec03: refitting DLNM")
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

message_step("ec03: attributable fraction (nsim = 200)")
af <- sus_mod_af(fit, nsim = 200, lang = "pt")
save_table(af$total, file.path("tables", "results", case, "af_total.csv"))
save_table(af$by_quantile, file.path("tables", "results", case, "af_quantis.csv"))
save_table(af$daily, file.path("tables", "results", case, "af_diaria.csv"))

message_step("ec03: figures")
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
    heatwave_baseline = "2010-01-01/2015-12-31",
    af_nsim = 200
  ),
  data = integrado,
  parquet_path = parquet
)

message_step("ec03: resume done")
