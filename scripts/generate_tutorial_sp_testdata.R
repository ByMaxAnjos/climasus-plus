#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(climasus4r)
  library(dplyr)
  library(arrow)
})

out_dir <- file.path("engine", "testdata")
out_path <- file.path(out_dir, "sim_do_sp_2014_2019_respiratory.parquet")

dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

dados <- sus_data_import(
  system = "SIM-DO",
  uf = "SP",
  year = 2014:2019,
  backend = "arrow",
  use_cache = TRUE,
  parallel = FALSE
) |>
  dplyr::filter(substr(CAUSABAS, 1, 1) == "J") |>
  dplyr::collect()

arrow::write_parquet(dados, out_path)

info <- file.info(out_path)
cat("Wrote:", out_path, "\n")
cat("Size:", round(info$size / 1024^2, 3), "MB\n")
cat("Rows:", nrow(dados), "\n")
