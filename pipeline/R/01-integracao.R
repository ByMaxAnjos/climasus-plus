# Pipeline de Integração — espelho R de clima-aggregate-exposicao.climasus.json
library(climasus4r)

# Ponto de partida: série de saúde já preparada (semanal ou diária)
saude <- sus_data_read("caminho/para/serie_semanal.parquet")
saude <- sus_spatial_join(saude)

# Estações INMET do mesmo território e período
clima <- sus_climate_inmet(years = 2015:2019, uf = "SP")

# Opcional: preencher falhas das estações (remova se a série estiver completa)
clima <- sus_climate_fill_inmet(clima, target_var = "tair_dry_bulb_c")

# Cruzamento com defasagens distribuídas
integrado <- sus_climate_aggregate(
  health_data = saude,
  climate_data = clima,
  climate_var = c("tair_dry_bulb_c", "rh_mean_porc"),
  temporal_strategy = "distributed_lag",
  lag_days = 21
)

sus_climate_plot_aggregate(integrado, plot_type = "timeseries")
