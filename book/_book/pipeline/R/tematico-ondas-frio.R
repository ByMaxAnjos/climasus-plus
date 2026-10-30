# Ondas de frio — espelho R de tematico-ondas-frio.climasus.json
library(climasus4r)

clima <- sus_climate_inmet(years = 2010:2019, uf = c("PR", "SC", "RS"))
clima <- sus_climate_fill_inmet(
  clima,
  target_var = c("tair_dry_bulb_c", "tair_max_c", "tair_min_c", "rh_mean_porc")
)
clima <- sus_climate_compute_indicators(clima)

frio <- sus_climate_compute_coldwaves(
  clima,
  method = "WHO",
  percentile = 10,
  baseline_start = "2010-01-01",
  baseline_end = "2015-12-31"
)
sus_climate_plot_coldwaves(frio, interactive = FALSE)
