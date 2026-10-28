#!/usr/bin/env Rscript
# =============================================================================
# 01-fit-replicacao.R — Parte V, replicação cidade-específica
#
# Especificação compatível com a literatura:
#   DLNM quasi-Poisson; ns(exposição, 4) × ns(defasagem, 3); 21 dias (diário)
#   ou 3/12 semanas (semanal); ns(tempo, 7/ano); dia da semana e feriados
#   (diário); referência = MMT estimado; AF por simulação (Gasparrini & Leone).
# =============================================================================

suppressPackageStartupMessages({
  library(dlnm); library(splines); library(jsonlite)
})

root <- if (dir.exists("book/data/replicacao")) normalizePath("book") else normalizePath(".")
dat_dir <- file.path(root, "data", "replicacao")
out_dir <- file.path(root, "results", "replicacao")
dir.create(out_dir, recursive = TRUE, showWarnings = FALSE)

HOLIDAYS <- function(d) {
  md <- format(d, "%m-%d")
  md %in% c("01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15",
            "12-24", "12-25", "12-31")
}

fit_dlnm <- function(dat, y, xcols, lag_max, argvar, arglag, time_df,
                     use_dow = FALSE, use_holiday = FALSE, covariates = NULL,
                     label = "", sims = 400L) {
  X <- as.matrix(dat[, xcols, drop = FALSE])
  cb <- crossbasis(X, lag = lag_max, argvar = argvar, arglag = arglag)

  rhs <- "cb + splines::ns(as.numeric(date), df = time_df)"
  if (use_dow)     { dat$dow <- factor(weekdays(dat$date)); rhs <- paste(rhs, "+ dow") }
  if (use_holiday) { dat$hol <- as.integer(HOLIDAYS(dat$date)); rhs <- paste(rhs, "+ hol") }
  if (!is.null(covariates)) rhs <- paste(rhs, "+", paste(covariates, collapse = " + "))

  m <- glm(as.formula(paste(y, "~", rhs)), data = dat, family = quasipoisson())

  x0 <- dat[[xcols[1]]]
  grid <- seq(quantile(x0, .01, na.rm = TRUE), quantile(x0, .99, na.rm = TRUE),
              length.out = 240)

  # MMT restrito ao intervalo central (p10-p90), como na literatura
  g_lo <- quantile(x0, .10, na.rm = TRUE); g_hi <- quantile(x0, .90, na.rm = TRUE)
  grid_mmt <- grid[grid >= g_lo & grid <= g_hi]
  pmed <- crosspred(cb, m, at = grid_mmt, cen = median(x0), cumul = TRUE)
  mmt  <- grid_mmt[which.min(pmed$allRRfit)]

  qs <- quantile(x0, c(.01, .05, .10, .50, .90, .95, .99), na.rm = TRUE)
  pq <- crosspred(cb, m, at = as.numeric(qs), cen = mmt, cumul = TRUE)

  # AF com IC empírico (RR ~ lognormal; SE de crosspred)
  xu <- sort(unique(round(x0, 2)))
  pu <- crosspred(cb, m, at = xu, cen = mmt, cumul = TRUE)
  rr <- as.numeric(pu$allRRfit)
  se <- (log(pmax(as.numeric(pu$allRRhigh), 1e-6)) -
         log(pmax(as.numeric(pu$allRRlow), 1e-6))) / (2 * 1.96)
  se[!is.finite(se)] <- 0
  map <- match(round(x0, 2), xu)
  rr_d <- rr[map]
  yv <- dat[[y]]
  i_all <- seq_along(x0)
  i_heat <- which(x0 >= mmt); i_cold <- which(x0 < mmt)

  af_idx <- function(r, idx) sum((1 - 1 / pmax(r[idx], 1e-6)) * yv[idx]) / sum(yv)

  # IC por simulação dos coeficientes da crossbasis (covariância completa)
  idx_cb <- grep("^cb", names(coef(m)))
  beta <- coef(m)[idx_cb]; V <- vcov(m)[idx_cb, idx_cb, drop = FALSE]
  set.seed(20261027)
  bsim <- MASS::mvrnorm(sims, beta, V)
  rr_sim <- matrix(NA_real_, nrow = length(rr_d), ncol = sims)
  for (b in seq_len(sims)) {
    pu_b <- crosspred(cb, coef = bsim[b, ], vcov = V, at = xu, cen = mmt, cumul = TRUE, model.link = "log")
    rr_sim[, b] <- as.numeric(pu_b$allRRfit)[map]
  }
  af_all <- af_idx(rr_d, i_all)
  af_all_ci <- quantile(apply(rr_sim, 2, af_idx, idx = i_all), c(.025, .975), na.rm = TRUE)
  af_heat <- if (length(i_heat)) af_idx(rr_d, i_heat) else NA_real_
  af_heat_ci <- if (length(i_heat)) quantile(apply(rr_sim, 2, af_idx, idx = i_heat), c(.025, .975), na.rm = TRUE) else c(NA, NA)
  af_cold <- if (length(i_cold)) af_idx(rr_d, i_cold) else NA_real_
  af_cold_ci <- if (length(i_cold)) quantile(apply(rr_sim, 2, af_idx, idx = i_cold), c(.025, .975), na.rm = TRUE) else c(NA, NA)

  get <- function(i) list(fit = unname(pq$allRRfit[i]),
                          lo = unname(pq$allRRlow[i]),
                          hi = unname(pq$allRRhigh[i]))

  list(label = label, n = nrow(dat), events = sum(yv),
       mmt = mmt, mmt_percentile = mean(x0 <= mmt),
       p01 = get(1), p05 = get(2), p10 = get(3), p50 = get(4),
       p90 = get(5), p95 = get(6), p99 = get(7),
       af_total = af_all, af_total_lo = af_all_ci[[1]], af_total_hi = af_all_ci[[2]],
       af_heat = af_heat, af_heat_lo = af_heat_ci[[1]], af_heat_hi = af_heat_ci[[2]],
       af_cold = af_cold, af_cold_lo = af_cold_ci[[1]], af_cold_hi = af_cold_ci[[2]],
       dispersion = summary(m)$dispersion,
       ljung_box_p = Box.test(residuals(m, type = "pearson"), lag = 10,
                              type = "Ljung-Box")$p.value,
       formula = paste(deparse(formula(m)), collapse = ""))
}

read_city <- function(f) {
  d <- read.csv(file.path(dat_dir, f)); d$date <- as.Date(d$date); d
}

# ── ec03: São Paulo, cardiovascular 60+, diário ────────────────────────────
d3 <- read_city("ec03_sao_paulo_daily.csv")
x3 <- c("tmean_lag0", paste0("tmean_lag", 1:21))
res_ec03 <- fit_dlnm(d3, "y", x3, 21, list(fun = "ns", df = 4),
                     list(fun = "ns", df = 3), time_df = 70,
                     use_dow = TRUE, use_holiday = TRUE,
                     label = "ec03 São Paulo cidade · DLNM 0-21d · DOW+feriados · MMT")

# ── ec01: São Paulo, respiratório <5a, semanal ─────────────────────────────
d1 <- read_city("ec01_sao_paulo_weekly.csv")
x1 <- c("tmean_lag0", "tmean_lag1", "tmean_lag2", "tmean_lag3")
res_ec01 <- fit_dlnm(d1, "y", x1, 3, list(fun = "ns", df = 3),
                     list(fun = "ns", df = 2), time_df = 10,
                     covariates = "rh_lag0",
                     label = "ec01 São Paulo cidade · semanal 0-3s · MMT")

# ── ec02: Recife, dengue, semanal ──────────────────────────────────────────
d2 <- read_city("ec02_recife_weekly.csv")
d2$month <- factor(format(d2$date, "%m"))
x2 <- c("gdd_lag0", paste0("gdd_lag", 1:12))
res_ec02 <- fit_dlnm(d2, "y", x2, 12, list(fun = "ns", df = 3),
                     list(fun = "ns", df = 3), time_df = 15,
                     covariates = "month",
                     label = "ec02 Recife · semanal 0-12s · MMT")
res_ec02_nomonth <- fit_dlnm(d2, "y", x2, 12, list(fun = "ns", df = 3),
                             list(fun = "ns", df = 3), time_df = 15,
                             covariates = NULL,
                             label = "ec02 Recife · semanal 0-12s · sem mês")
# sensibilidade: temperatura em vez de GDD
for (k in 1:12) d2[[paste0("tmean_lag", k)]] <- dplyr::lag(d2$tmean_week, k)
x2t <- c("tmean_lag0", paste0("tmean_lag", 1:12))
res_ec02_temp <- fit_dlnm(d2, "y", x2t, 12, list(fun = "ns", df = 3),
                          list(fun = "ns", df = 3), time_df = 15,
                          covariates = "month",
                          label = "ec02 Recife · temperatura semanal 0-12s · MMT")

# ── ec02b: Fortaleza, dengue, semanal (segunda cidade) ─────────────────────
d2f <- read_city("ec02_fortaleza_weekly.csv")
d2f$month <- factor(format(d2f$date, "%m"))
x2f <- c("gdd_lag0", paste0("gdd_lag", 1:12))
res_ec02_fort <- fit_dlnm(d2f, "y", x2f, 12, list(fun = "ns", df = 3),
                          list(fun = "ns", df = 3), time_df = 15,
                          covariates = "month",
                          label = "ec02 Fortaleza · semanal 0-12s · MMT")

# ── ec04a: Porto Alegre, ITS ───────────────────────────────────────────────
fit_its <- function(d, event, label, window = NULL) {
  if (!is.null(window)) d <- d[d$date >= event - window & d$date <= event + window, ]
  d$t <- as.numeric(d$date - min(d$date))
  d$step <- as.numeric(d$date >= event)
  d$slope <- pmax(0, d$t - as.numeric(event - min(d$date)))
  d$dow <- factor(weekdays(d$date))
  doy <- as.numeric(format(d$date, "%j"))
  for (k in 1:4) {
    d[[paste0("sin", k)]] <- sin(2 * pi * k * doy / 365.25)
    d[[paste0("cos", k)]] <- cos(2 * pi * k * doy / 365.25)
  }
  m <- glm(y ~ t + step + slope + dow + sin1 + cos1 + sin2 + cos2 +
             sin3 + cos3 + sin4 + cos4, data = d, family = quasipoisson())
  b <- coef(m); v <- vcov(m); lr <- unname(b["step"]); se <- sqrt(v["step", "step"])
  list(label = label, level_ratio = exp(lr), lo = exp(lr - 1.96 * se),
       hi = exp(lr + 1.96 * se), p = 2 * pnorm(-abs(lr / se)),
       slope_annual = exp(unname(b["slope"]) * 365.25), n = nrow(d),
       window = ifelse(is.null(window), "full", as.character(window)),
       dispersion = summary(m)$dispersion)
}

d4 <- read_city("ec04_porto_alegre_daily.csv")
ev <- as.Date("2011-07-03")
res_ec04_its      <- fit_its(d4, ev, "ec04 Porto Alegre · ITS · DOW + 4 harmônicos")
res_ec04_its_local <- fit_its(d4, ev, "ec04 Porto Alegre · ITS janela ±365d", 365)

# ── ec04b: Porto Alegre, DLNM frio ─────────────────────────────────────────
x4 <- c("tmean_lag0", paste0("tmean_lag", 1:21))
res_ec04_dlnm <- fit_dlnm(d4, "y", x4, 21, list(fun = "ns", df = 4),
                          list(fun = "ns", df = 3), time_df = 70,
                          use_dow = TRUE, use_holiday = TRUE,
                          label = "ec04 Porto Alegre · DLNM 0-21d · DOW+feriados · MMT")

# ── saída ─────────────────────────────────────────────────────────────────
res <- list(meta = list(date = as.character(Sys.Date()), r = R.version.string,
                        dlnm = as.character(packageVersion("dlnm"))),
            ec03 = res_ec03, ec01 = res_ec01, ec02 = res_ec02,
            ec02_nomonth = res_ec02_nomonth, ec02_temp = res_ec02_temp,
            ec02_fortaleza = res_ec02_fort,
            ec04_its = res_ec04_its, ec04_its_local = res_ec04_its_local,
            ec04_dlnm = res_ec04_dlnm)
write_json(res, file.path(out_dir, "replicacao.json"),
           pretty = TRUE, auto_unbox = TRUE, digits = 5)

cat("\n=== RESUMO ===\n")
for (nm in c("ec03", "ec01", "ec02", "ec02_nomonth", "ec02_temp", "ec02_fortaleza", "ec04_dlnm")) {
  z <- res[[nm]]
  cat(sprintf("%-8s n=%d eventos=%d MMT=%.2f (p%.0f) RRp99=%.2f [%.2f-%.2f] RRp01=%.2f [%.2f-%.2f] AF=%.1f%% [%.1f-%.1f]\n",
              nm, z$n, z$events, z$mmt, 100 * z$mmt_percentile,
              z$p99$fit, z$p99$lo, z$p99$hi, z$p01$fit, z$p01$lo, z$p01$hi,
              100 * z$af_total, 100 * z$af_total_lo, 100 * z$af_total_hi))
}
cat(sprintf("ec04 ITS level=%.2f [%.2f-%.2f]\n", res_ec04_its$level_ratio,
            res_ec04_its$lo, res_ec04_its$hi))
cat("\nOK:", file.path(out_dir, "replicacao.json"), "\n")
