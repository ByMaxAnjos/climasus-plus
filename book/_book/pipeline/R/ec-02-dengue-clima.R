# Caso ec-02 — espelho R de ec-02-dengue-clima.climasus.json
library(climasus4r)

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

saude <- sus_spatial_join(dados)
clima_raw <- sus_climate_inmet(years = 2015:2019, uf = c("CE", "PE", "BA", "MA"))

clima <- sus_climate_compute_indicators(
  clima_raw,
  indicators = "gdd",
  custom_thresholds = list(gdd_base = 11, gdd_upper = 35)
)

integrado <- sus_climate_aggregate(
  health_data = saude,
  climate_data = clima,
  climate_var = "gdd_c",
  temporal_strategy = "distributed_lag",
  lag_days = 84
)

ajuste <- sus_mod_dlnm(
  integrado,
  outcome_col = "n_casos",
  climate_col = "gdd_c",
  dof_per_year = 2
)

sus_mod_plot_dlnm(ajuste)
