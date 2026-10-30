# Pipeline de Preparação — espelho R de pipeline-preparacao-basica.climasus.json
# Execute a partir da raiz do livro (book/), com o pacote climasus4r instalado.
library(climasus4r)

dados <- sus_data_import(
  system = "SIM-DO",
  uf = "SP",
  year = 2015:2019,
  parallel = FALSE
) |>
  sus_data_clean_encoding() |>
  sus_data_standardize() |>
  sus_data_filter_cid(disease_group = "respiratory") |>
  sus_data_create_variables(create_calendar_vars = TRUE) |>
  # opcional: recorte demográfico (ex.: menores de 5 anos)
  # sus_data_filter_demographics(age_range = c(0, 5)) |>
  sus_data_aggregate(
    time_unit = "week",
    group_by = "codigo_municipio_residencia",
    complete_dates = TRUE
  )

# Relatório de qualidade: completude, duplicidade e cobertura temporal
sus_data_quality_report(dados)
