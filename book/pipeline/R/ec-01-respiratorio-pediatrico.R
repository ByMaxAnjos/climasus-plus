# Caso ec-01 — espelho R de ec-01-respiratorio-pediatrico.climasus.json
library(climasus4r)

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

saude <- sus_spatial_join(dados)
clima <- sus_climate_inmet(years = 2015:2019, uf = c("SP", "RJ", "MG", "ES"))

integrado <- sus_climate_aggregate(
  health_data = saude,
  climate_data = clima,
  climate_var = c("tair_dry_bulb_c", "rh_mean_porc"),
  temporal_strategy = "distributed_lag",
  lag_days = 21
)

ajuste <- sus_mod_dlnm(
  integrado,
  outcome_col = "n_obitos",
  climate_col = "tair_dry_bulb_c",
  covariates = "rh_mean_porc_lag0",
  dof_per_year = 2
)

sus_mod_plot_dlnm(ajuste)
sus_mod_af(ajuste)
