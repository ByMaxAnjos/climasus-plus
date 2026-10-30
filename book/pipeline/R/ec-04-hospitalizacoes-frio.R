# Caso ec-04 — espelho R de ec-04-hospitalizacoes-frio.climasus.json
library(climasus4r)

dados <- sus_data_import(
  system = "SIH-RD",
  region = "sul",
  year = 2010:2019,
  month = 1:12
) |>
  sus_data_clean_encoding() |>
  sus_data_standardize(lang = "pt") |>
  sus_data_filter_cid(icd_codes = c("J09", "J18"), match_type = "range") |>
  sus_data_create_variables() |>
  sus_data_aggregate(
    time_unit = "day",
    group_by = "codigo_municipio_residencia",
    complete_dates = TRUE
  )

saude <- sus_spatial_join(dados)
clima <- sus_climate_inmet(years = 2010:2019, uf = c("PR", "SC", "RS"))

frio <- sus_climate_compute_coldwaves(
  clima,
  method = "WHO",
  percentile = 10,
  baseline_start = "2010-01-01",
  baseline_end = "2015-12-31"
)
sus_climate_plot_coldwaves(frio, interactive = FALSE)

poa <- sus_data_filter_demographics(saude, city = "Porto Alegre")

its <- sus_mod_its(
  poa,
  outcome_col = "n_internacoes",
  interruption_dates = "2011-07-03"
)

its$effects
