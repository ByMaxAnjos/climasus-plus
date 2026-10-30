# Qualidade e visualização — espelho R de pipeline-qualidade-visualizacao.climasus.json
library(climasus4r)

dados <- sus_data_read("caminho/para/dados.parquet")

sus_data_quality_report(dados)
sus_data_ts_quality(dados)
sus_data_plot_aggregate_ts(dados, value_col = "n_obitos")
sus_data_plot_aggregate_map(dados, value_col = "n_obitos")
