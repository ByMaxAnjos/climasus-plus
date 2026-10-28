# Replicação da Parte V — estudos de caso

Esta pasta contém a reanálise cidade-específica dos quatro estudos de caso do guia
(capítulos 7–10), com especificação compatível com a literatura publicada.

O relatório completo está em [`../../reports/AVALIACAO_MODELAGEM_PARTE_V.md`](../../reports/AVALIACAO_MODELAGEM_PARTE_V.md).
A tabela comparativa está em [`../../results/replicacao/comparacao_literatura.csv`](../../results/replicacao/comparacao_literatura.csv).

## Por que refazer

O snapshot original do Studio:

1. agregava **todos os municípios por data** dentro de `sus_mod_dlnm()`
   (o ec-03 virava Estado de São Paulo, não a capital);
2. usava **lags diários** sobre desfechos **semanais** (ec-01 e ec-02);
3. não incluía **dia da semana** nem feriados nos modelos diários;
4. usava a **mediana** como referência, não o MMT;
5. deixava a capital paulista com **100% de NA** de temperatura em 2010–2017,
   apesar de a estação A701 ter ~99% de cobertura.

## Como reproduzir

A partir da raiz do repositório:

```bash
# 1. extrai A701 (São Paulo), A301 (Recife) e A801 (Porto Alegre) do cache INMET
Rscript book/scripts/90-replicacao/00-build-city-climate.R

# 2. monta as séries cidade-específicas com lags na unidade correta
python3 book/scripts/90-replicacao/prep_city_series.py

# 3. ajusta DLNM/ITS, estima MMT e calcula AF
Rscript book/scripts/90-replicacao/01-fit-replicacao.R
```

Requisitos: R ≥ 4.5 com `dlnm`, `splines`, `jsonlite`, `arrow`, `dplyr`, `MASS`;
cache INMET em `~/.climasus4r_cache/climate/inmet_parquet` (~42 GB).

## Resultados principais

| Caso | Cidade | MMT | RR p99 (calor) | RR p01 (frio) | AF total |
|---|---|---:|---:|---:|---:|
| ec-03 | São Paulo | 23,1 °C | 1,21 (1,10–1,33) | 1,67 (1,50–1,85) | 7,9% (5,0–10,8) |
| ec-04 | Porto Alegre | 22,7 °C | 1,42 (1,16–1,74) | 1,52 (1,24–1,87) | 12,7% (7,3–16,9) |
| ec-01 | São Paulo | 16,6 °C | 1,42 (0,61–3,29) | 0,66 (0,43–1,01) | não interpretável |
| ec-02 | Recife | 97,1 GDD | 0,49 (0,08–2,82) | 2,15 (0,48–9,68) | não interpretável |

O ITS do ec-04 cai de 0,62 (snapshot) para 0,87 (janela total) e 1,01 (janela local
±365 dias), mostrando que o “efeito” original era tendência, não evento.

Em Fortaleza (segunda cidade de dengue), o GDD também não é identificável: MMT no p90,
RR p01 = 10,56 (3,71–30,08) e AF = 62% (43,9–70,2) — números que não descrevem a
transmissão e reforçam que o problema é a exposição, não a cidade.

## Especificação

- DLNM quasi-Poisson; `ns(exposição, 4) × ns(defasagem, 3)`;
- 0–21 dias (diário) ou 0–3 / 0–12 semanas (semanal);
- `ns(tempo, 7/ano)`; dia da semana e feriados nacionais no diário;
- referência = MMT estimado em p10–p90;
- AF por simulação dos coeficientes da crossbasis (400 réplicas);
- diagnóstico de dispersão e Ljung–Box.

## Limitações

Uma cidade por caso; 5–10 anos; sem poluição, influenza, sorotipo ou estratificação
por sexo; modelo ecológico de série temporal, não causal. A replicação demonstra o
efeito das decisões de pipeline, não substitui um estudo multicidade.
