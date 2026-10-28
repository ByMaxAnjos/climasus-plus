#!/usr/bin/env Rscript
# Extrai séries diárias das estações INMET usadas na replicação.
# A701 São Paulo (Mirante), A301 Recife, A801 Porto Alegre.
# Corrige o join municipal que deixou a capital paulista com 100% de NA em 2010-2017.

suppressPackageStartupMessages({ library(arrow); library(dplyr) })

base <- path.expand("~/.climasus4r_cache/climate/inmet_parquet")
out  <- if (dir.exists("book/data/replicacao")) "book/data/replicacao" else "data/replicacao"
dir.create(out, recursive = TRUE, showWarnings = FALSE)

stations <- c("A701", "A301", "A801", "A305")
res <- list()

for (y in 2010:2019) {
  f <- file.path(base, paste0("year=", y), "part-0.parquet")
  if (!file.exists(f)) next
  x <- read_parquet(f, col_select = c("date", "tair_dry_bulb_c", "tair_max_c",
                                      "tair_min_c", "rh_mean_porc", "station_code")) %>%
    filter(station_code %in% stations) %>% collect()
  if (!nrow(x)) next
  x$day <- as.Date(x$date)
  res[[as.character(y)]] <- x %>%
    group_by(station_code, day) %>%
    summarise(tmean = mean(tair_dry_bulb_c, na.rm = TRUE),
              tmax  = max(tair_max_c, na.rm = TRUE),
              tmin  = min(tair_min_c, na.rm = TRUE),
              rh    = mean(rh_mean_porc, na.rm = TRUE),
              .groups = "drop")
}

all <- bind_rows(res) %>% arrange(station_code, day)
for (s in stations) {
  z <- all %>% filter(station_code == s) %>%
    mutate(across(c(tmean, tmax, tmin, rh), ~ ifelse(is.nan(.x), NA, .x)))
  write.csv(z, file.path(out, paste0("climate_", s, "_daily.csv")), row.names = FALSE)
  cat(s, "dias", nrow(z), "NA tmean", sum(is.na(z$tmean)), "\n")
}
