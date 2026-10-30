# Caso ec-03 — espelho R de ec-03-cardio-idosos-calor.climasus.json
library(climasus4r)

dados <- sus_data_import(
  system = "SIM-DO",
  uf = "SP",
  year = 2010:2019
) |>
  sus_data_clean_encoding() |>
  sus_data_standardize(lang = "pt") |>
  sus_data_filter_cid(icd_codes = "I", match_type = "chapter") |>
  sus_data_create_variables(age_breaks = c(0, 60, Inf)) |>
  sus_data_filter_demographics(age_range = c(60, Inf)) |>
  sus_data_aggregate(
    time_unit = "day",
    group_by = "codigo_municipio_residencia",
    complete_dates = TRUE
  )

saude <- sus_spatial_join(dados)
clima <- sus_climate_inmet(years = 2010:2019, uf = "SP")

ondas <- sus_climate_compute_heatwaves(
  clima,
  method = "WHO",
  percentile = 90,
  baseline_start = "2010-01-01",
  baseline_end = "2015-12-31"
)
sus_climate_plot_heatwaves(ondas, interactive = FALSE)

integrado <- sus_climate_aggregate(
  health_data = saude,
  climate_data = clima,
  climate_var = "tair_dry_bulb_c",
  temporal_strategy = "distributed_lag",
  lag_days = 21
)

ajuste <- sus_mod_dlnm(
  integrado,
  outcome_col = "n_obitos",
  climate_col = "tair_dry_bulb_c",
  dof_per_year = 4
)

sus_mod_plot_dlnm(ajuste, type = "overall")
af <- sus_mod_af(ajuste, nsim = 200)
sus_mod_plot_af(af, type = "bar")
