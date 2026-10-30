# Importação mínima — espelho R de pipeline-importacao-saude.climasus.json
library(climasus4r)

dados <- sus_data_import(
  system = "SIM-DO",
  uf = "SP",
  year = 2015:2019,
  parallel = FALSE
)

sus_data_quality_report(dados)
