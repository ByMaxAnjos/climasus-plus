# Pipeline de Análise & Modelagem — espelho R de mod-dlnm.climasus.json
library(climasus4r)

integrado <- sus_data_read("caminho/para/tabela_integrada.parquet")

ajuste <- sus_mod_dlnm(
  integrado,
  outcome_col = "n_obitos",
  climate_col = "tair_dry_bulb_c"
)

sus_mod_plot_dlnm(ajuste, type = "overall")
sus_mod_plot_dlnm(ajuste, type = "lag")

af <- sus_mod_af(ajuste)
sus_mod_plot_af(af, type = "bar")
