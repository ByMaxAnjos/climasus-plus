#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Séries cidade-específicas da replicação da Parte V.

Usa as estações INMET A701 (São Paulo), A301 (Recife) e A801 (Porto Alegre)
extraídas por 00-build-city-climate.R, em vez das colunas de clima do snapshot
original — que deixaram a capital paulista com 100% de NA em 2010-2017 e
usavam lags diários sobre desfechos semanais.
"""
import os
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
BOOK = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(BOOK, "data", "replicacao")


def load_health(case, muni, col, date_col="date"):
    d = pd.read_parquet(os.path.join(BOOK, "data", case, "analytic.parquet"),
                        columns=[date_col, "code_muni", col])
    d = d[d.code_muni.astype(str) == muni].copy()
    d[date_col] = pd.to_datetime(d[date_col])
    return d.rename(columns={date_col: "date", col: "y"})[["date", "y"]].sort_values("date")


def weekly_climate(path, start, end, agg="mean"):
    c = pd.read_csv(path, parse_dates=["day"])
    c = c[(c.day >= start) & (c.day <= end)].set_index("day")
    if agg == "sum":
        s = c.tmean.resample("W-SUN").sum(min_count=5)
    else:
        s = c.tmean.resample("W-SUN").mean()
        rh = c.rh.resample("W-SUN").mean()
    out = s.rename("tmean").reset_index().rename(columns={"day": "date"})
    if agg != "sum":
        out["rh"] = rh.values
    return out


# ── ec01: São Paulo, respiratório <5a, semanal ─────────────────────────────
h = load_health("ec01", "355030", "n_obitos")
c = weekly_climate(os.path.join(OUT, "climate_A701_daily.csv"),
                   "2014-12-01", "2019-12-31")
d = h.merge(c, on="date", how="left").sort_values("date")
for k in range(1, 4):
    d[f"tmean_lag{k}"] = d.tmean.shift(k)
    d[f"rh_lag{k}"] = d.rh.shift(k)
d["tmean_lag0"] = d.tmean
d["rh_lag0"] = d.rh
d = d.dropna(subset=["tmean_lag0", "tmean_lag1", "tmean_lag2", "tmean_lag3"]).reset_index(drop=True)
d.to_csv(os.path.join(OUT, "ec01_sao_paulo_weekly.csv"), index=False)
print("ec01", d.shape, "eventos", int(d.y.sum()),
      "temp semanal", round(d.tmean.min(), 1), "-", round(d.tmean.max(), 1))

# ── ec02: Recife, dengue, semanal ──────────────────────────────────────────
h = load_health("ec02", "261160", "n_casos")
c = pd.read_csv(os.path.join(OUT, "climate_A301_daily.csv"), parse_dates=["day"])
c = c[(c.day >= "2014-12-01") & (c.day <= "2020-01-31")].copy()
c["gdd_day"] = np.minimum(np.maximum(c.tmean, 11), 35) - 11
c = c.set_index("day")
g = c.gdd_day.resample("W-SUN").sum(min_count=5).rename("gdd_week")
t = c.tmean.resample("W-SUN").mean().rename("tmean_week")
c = pd.concat([g, t], axis=1).reset_index().rename(columns={"day": "date"})
d = h.merge(c, on="date", how="left").sort_values("date")
for k in range(1, 13):
    d[f"gdd_lag{k}"] = d.gdd_week.shift(k)
d["gdd_lag0"] = d.gdd_week
d["tmean_lag0"] = d.tmean_week
d = d.dropna(subset=[f"gdd_lag{k}" for k in range(13)]).reset_index(drop=True)
d.to_csv(os.path.join(OUT, "ec02_recife_weekly.csv"), index=False)
print("ec02", d.shape, "casos", int(d.y.sum()),
      "GDD/semana", round(d.gdd_week.min(), 1), "-", round(d.gdd_week.max(), 1))

# ── ec02b: Fortaleza (CE), dengue, semanal — segunda cidade ────────────────
h = load_health("ec02", "230440", "n_casos")
c = pd.read_csv(os.path.join(OUT, "climate_A305_daily.csv"), parse_dates=["day"])
c = c[(c.day >= "2014-12-01") & (c.day <= "2020-01-31")].copy()
c["gdd_day"] = np.minimum(np.maximum(c.tmean, 11), 35) - 11
c = c.set_index("day")
g = c.gdd_day.resample("W-SUN").sum(min_count=5).rename("gdd_week")
t = c.tmean.resample("W-SUN").mean().rename("tmean_week")
c = pd.concat([g, t], axis=1).reset_index().rename(columns={"day": "date"})
d = h.merge(c, on="date", how="left").sort_values("date")
for k in range(1, 13):
    d[f"gdd_lag{k}"] = d.gdd_week.shift(k)
d["gdd_lag0"] = d.gdd_week
d["tmean_lag0"] = d.tmean_week
d = d.dropna(subset=[f"gdd_lag{k}" for k in range(13)]).reset_index(drop=True)
d.to_csv(os.path.join(OUT, "ec02_fortaleza_weekly.csv"), index=False)
print("ec02 Fortaleza", d.shape, "casos", int(d.y.sum()),
      "GDD/semana", round(d.gdd_week.min(), 1), "-", round(d.gdd_week.max(), 1))

# ── ec03: São Paulo, cardiovascular 60+, diário ────────────────────────────
h = load_health("ec03", "355030", "n_obitos")
c = pd.read_csv(os.path.join(OUT, "climate_A701_daily.csv"), parse_dates=["day"])
c = c[(c.day >= "2010-01-01") & (c.day <= "2019-12-31")][["day", "tmean"]].rename(columns={"day": "date"})
d = h.merge(c, on="date", how="left").sort_values("date")
for k in range(0, 22):
    d[f"tmean_lag{k}"] = d.tmean.shift(k)
d = d.dropna(subset=["tmean"]).reset_index(drop=True)
d.to_csv(os.path.join(OUT, "ec03_sao_paulo_daily.csv"), index=False)
print("ec03", d.shape, "óbitos", int(d.y.sum()),
      "temp", round(d.tmean.min(), 1), "-", round(d.tmean.max(), 1))

# ── ec04: Porto Alegre, respiratório, diário ───────────────────────────────
h = load_health("ec04", "431490", "n_internacoes")
c = pd.read_csv(os.path.join(OUT, "climate_A801_daily.csv"), parse_dates=["day"])
c = c[(c.day >= "2010-01-01") & (c.day <= "2019-12-31")][["day", "tmean"]].rename(columns={"day": "date"})
d = h.merge(c, on="date", how="left").sort_values("date")
for k in range(0, 22):
    d[f"tmean_lag{k}"] = d.tmean.shift(k)
d = d.dropna(subset=["tmean"]).reset_index(drop=True)
d.to_csv(os.path.join(OUT, "ec04_porto_alegre_daily.csv"), index=False)
print("ec04", d.shape, "internações", int(d.y.sum()),
      "temp", round(d.tmean.min(), 1), "-", round(d.tmean.max(), 1))
