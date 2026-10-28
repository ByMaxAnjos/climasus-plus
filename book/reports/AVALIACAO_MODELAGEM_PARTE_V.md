# Reavaliação epidemiológica da Parte V e replicação cidade-específica

**Escopo:** capítulos 7–10 (ec-01 a ec-04) do guia climasus+ Studio.
**Data:** 27 de outubro de 2026.
**Base:** resultados gravados em `book/tables/results/`, dados analíticos em `book/data/`, código do `climasus4r` e literatura publicada.
**Artefatos desta reavaliação:** `book/scripts/90-replicacao/` e `book/results/replicacao/`.
**Status:** resultados integrados aos capítulos 7–10 em 28/10/2026 (seções de Resultados,
Interpretação, tabelas e perguntas de revisão).

---

## 1. Sumário executivo

Os quatro capítulos já tratam os resultados nulos com honestidade — o que é uma virtude editorial. A auditoria, porém, mostra que **em todos os quatro casos o resultado do snapshot é moldado por decisões de pipeline**, em graus diferentes. Em nenhum deles o número gravado pode ser lido como estimativa do efeito do clima na população.

| Caso | O que o livro afirma | O que o modelo realmente estimou | Veredito |
|---|---|---|---|
| **ec-01** respiratório pediátrico | Sudeste, 4 UFs, 2015–2019 | Uma única série semanal somando **715 municípios** (4.765 óbitos), com **lags diários** sobre desfecho semanal | **Não identificável**; nulo por desenho, não por ausência de efeito |
| **ec-02** dengue e GDD | CE, PE, BA, MA; GDD como exposição | Uma série semanal somando **1.358 municípios** (638.616 casos), lags **diários** 0–84 sobre desfecho semanal; GDD em unidade horária | **Inválido para inferência**; pico de lag na borda (84 d) é sintoma |
| **ec-03** cardiovascular e calor | São Paulo **cidade** | Uma série diária somando **645 municípios do Estado** (659 mil óbitos); sem dia da semana; referência = mediana | **Unidade de análise errada**; a replicação cidade-específica reproduz a literatura |
| **ec-04** respiratório e frio | Porto Alegre, ITS | Série correta (1 município), mas ITS com tendência global, 2 harmônicos, sem dia da semana e incluindo 2009 parcial | **Estimativa 0,62 é artefato de tendência**; janela local ±365 d = 1,01 |

**Resultado principal da replicação:** com série **cidade-específica**, estação INMET correta, dia da semana/feriados, lags na unidade do desfecho e referência no **MMT**, o caso ec-03 passa a reproduzir a literatura: MMT 23,1 °C (p76), RR no p99 = **1,21 (1,10–1,33)**, RR no p01 = **1,67 (1,50–1,85)**, AF total **7,9% (5,0–10,8)**, dominada pelo frio (6,8%) e não pelo calor (1,1%). O caso ec-04 também passa a mostrar efeito do frio (RR p01 = 1,52; AF 12,7%), coerente em direção com a literatura nacional.

Os casos ec-01 e ec-02 **não são estimáveis** com os dados atuais: o primeiro tem 757 eventos em 259 semanas e o segundo tem GDD sem sinal positivo após ajuste sazonal em Recife e em Fortaleza. Isso não é fracasso do Studio; é um resultado de **poder e de escolha de exposição** que precisa ser dito no livro.

---

## 2. O que foi modelado, de fato

### 2.1 Agregação silenciosa por data

Em `climasus4r/R/sus_mod_dlnm.R` (linhas 480–492), o modelo agrega **todas as linhas por data**:

```r
df_agg <- df |>
  dplyr::summarise(
    y = sum(y, na.rm = TRUE),
    dplyr::across(all_of(lag_col_names), ~ mean(.x, na.rm = TRUE)),
    .by = date
  )
```

Consequências:

- o desfecho passa a ser a **soma de todos os municípios**;
- a exposição passa a ser a **média das exposições municipais**;
- o modelo deixa de ser “São Paulo cidade” ou “Sudeste” e passa a ser uma **série regional agregada**, sem qualquer termo espacial.

Números observados:

| Caso | Municípios no arquivo analítico | Eventos totais | Série efetivamente modelada |
|---|---:|---:|---|
| ec-01 | 715 | 4.765 óbitos | 258 semanas (soma regional) |
| ec-02 | 1.358 | 638.616 casos | 248 semanas (soma regional) |
| ec-03 | 645 | 659.351 óbitos | 3.631 dias (soma estadual) |
| ec-04 | 1 | 38.349 internações | 3.810 dias (correto) |

O caso ec-03 é o mais grave: o capítulo afirma “São Paulo” e o modelo estima **o Estado de São Paulo inteiro**. O `n_cases` da AF (656.228) confirma a agregação estadual.

### 2.2 Lags diários sobre desfechos semanais

O `sus_climate_aggregate()` foi chamado com `lag_days = 21` (ec-01) e `lag_days = 84` (ec-02) sobre desfechos **semanais**. As colunas `_lag0…_lag21` são dias consecutivos, não semanas.

Para uma série semanal:

- `lag0` = temperatura do dia da semana;
- `lag1` = dia anterior (quase idêntico);
- …
- `lag7` = mesma fase da semana anterior.

Assim, as 21 (ou 84) colunas são **quase duplicatas** da mesma exposição, e as janelas de semanas consecutivas se sobrepõem em 20/21 (ou 83/84). O modelo não estima uma defasagem semanal: estima um emaranhado de dias altamente colineares. O sintoma aparece no ec-02: **pico de lag em 84 dias, exatamente a borda da janela** — um artefato, não um pico biológico.

### 2.3 GDD em unidade horária

`.compute_gdd()` calcula graus-dia a partir da temperatura horária:

```r
.compute_gdd <- function(airT, base_temp = 10, upper_temp = 30)
  round(pmin(pmax(airT, base_temp), upper_temp) - base_temp, 1)
```

Se a agregação diária soma as 24 horas, o resultado é **°C·hora**, não °C·dia. Os valores observados são compatíveis com essa soma: em Teresina, janeiro de 2015, `gdd_c` ≈ 372, quando o valor diário esperado (base 11 °C, Tmean ≈ 27 °C) seria ≈ 16 — um fator de ~24.

Para o RR em contraste percentílico a escala não muda a forma, mas **muda a unidade interpretada** e invalida qualquer limiar operacional em °C·dia.

### 2.4 A capital paulista ficou sem clima

No arquivo analítico do ec-03, a temperatura de São Paulo cidade é **100% ausente em 2010–2017**, 20% em 2018 e 0% em 2019. A estação A701 (Mirante), a 7,5 km do centro, tem **99% de cobertura** em todos os anos de 2010 a 2019 no cache INMET.

Ou seja: o dado existia no cache; o pipeline não o entregou à cidade. A agregação estadual mascarou o problema, porque a média dos 645 municípios continuou preenchida por outras estações. Este é o achado de integridade de dados mais grave da Parte V.

### 2.5 Especificação do modelo diário

A fórmula do DLNM é:

```r
y ~ cb + splines::ns(as.integer(date), df = ns_df) + covariates
```

Não há:

- **dia da semana** (essencial em mortalidade e internações diárias);
- **feriados**;
- correção de autocorrelação (apenas o teste de Ljung–Box, que emite aviso);
- termo de sazonalidade além do spline de tempo.

No ITS (`sus_mod_its.R`), a fórmula inclui tendência linear, degrau, inclinação, harmônicos e covariáveis — mas **não inclui dia da semana**, e o número de harmônicos padrão é 2.

Além disso, o controle sazonal do snapshot é mais pobre que o usual: 4 df/ano no ec-03 (`ns_df = 40`) e 2 df/ano no ec-01/ec-02. A replicação usa 7 df/ano (diário) e 2–3 df/ano (semanal), na faixa recomendada por Bhaskaran et al. (2013).

### 2.6 Referência mediana, não MMT

`sus_mod_dlnm()` usa `ref_value = median(expo_matrix[, 1])` quando o usuário não informa. A AF de `sus_mod_af()` usa esse valor. O livro e a figura de modelagem falam em **MMT**. No snapshot:

- ec-03: referência = 22,61 °C (mediana), não o MMT;
- ec-01: referência = 22,64 °C;
- ec-02: referência = 347,3 (mediana do GDD).

A replicação estima o MMT e usa essa referência, como em Gasparrini et al. (2015).

---

## 3. Replicação cidade-específica

### 3.1 Desenho

Para cada caso, uma cidade-sede e a estação INMET mais próxima com cobertura verificada:

| Caso | Cidade | Estação | Série | Eventos |
|---|---|---|---:|---:|
| ec-01 | São Paulo (SP) | A701 Mirante | 259 semanas (2015–2019) | 757 óbitos |
| ec-02 | Recife (PE) | A301 Recife | 217 semanas (2015–2019) | 38.974 casos |
| ec-03 | São Paulo (SP) | A701 Mirante | 3.636 dias (2010–2019) | 184.893 óbitos |
| ec-04 | Porto Alegre (RS) | A801 Porto Alegre | 3.639 dias (2010–2019) | 37.969 internações |

Especificação, seguindo a literatura:

- DLNM quasi-Poisson;
- `ns(exposição, df = 4)` × `ns(defasagem, df = 3)` para séries diárias;
- defasagem 0–21 dias (diário) ou 0–3 / 0–12 **semanas** (semanal);
- `ns(tempo, 7/ano)`;
- dia da semana e feriados nacionais (séries diárias);
- referência = **MMT** estimado no intervalo p10–p90;
- AF por simulação dos coeficientes da crossbasis (400 réplicas), com covariância completa;
- diagnóstico: dispersão e Ljung–Box.

Scripts:

```bash
Rscript book/scripts/90-replicacao/00-build-city-climate.R
python3 book/scripts/90-replicacao/prep_city_series.py
Rscript book/scripts/90-replicacao/01-fit-replicacao.R
```

### 3.2 Resultados

| Caso | MMT (percentil) | RR p99 (calor) | RR p01 (frio) | AF total (IC 95%) | AF frio / calor | Dispersão | Ljung–Box p |
|---|---|---|---:|---:|---:|---:|---:|---:|
| **ec-03** | 23,1 °C (p76) | **1,21 (1,10–1,33)** | **1,67 (1,50–1,85)** | **7,9% (5,0–10,8)** | 6,8% / 1,1% | 1,08 | 0,014 |
| **ec-04** | 22,7 °C (p68) | 1,42 (1,16–1,74) | **1,52 (1,24–1,87)** | **12,7% (7,3–16,9)** | 10,5% / 2,2% | 1,17 | 0,72 |
| ec-01 | 16,6 °C (p10) | 1,42 (0,61–3,29) | 0,66 (0,43–1,01) | 41,6% (28,7–50,4)* | −2,5% / 44,2% | 1,19 | 0,022 |
| ec-02 (GDD) | 97,1 (p29) | 0,49 (0,08–2,82) | 2,15 (0,48–9,68) | 14,8% (−130,5–55,2)* | 2,2% / 12,6% | 7,55 | <0,001 |
| ec-02 (temperatura) | 27,4 °C (p89) | 0,99 (0,97–1,01) | 1,51 (0,30–7,72) | 25,4% (−3,6–39,0)* | — | — | — |
| ec-02 Fortaleza (GDD) | 121,9 (p90) | 3,57 (0,97–13,14) | 10,56 (3,71–30,08) | 62,3% (43,9–70,2)* | — | — | — |

\* AF não interpretável: o modelo não identifica uma curva estável (MMT na borda, dispersão alta, IC muito largo ou sinal invertido).

**Leitura:** apenas ec-03 e ec-04 produzem estimativas estáveis e interpretáveis. ec-01 e ec-02 são apresentados para mostrar **por que o desenho atual não responde à pergunta**, não como evidência de efeito.

### 3.3 O caso ec-04: o ITS era artefato

| Especificação | Razão de nível no evento | IC 95% | p |
|---|---:|---:|---:|
| Snapshot do Studio (tendência global, 2 harmônicos, sem DOW, 2009 incluído) | **0,62** | 0,58–0,66 | <0,001 |
| Replicação — janela total 2010–2019, DOW + 4 harmônicos | **0,87** | 0,82–0,92 | <0,001 |
| Replicação — janela local ±365 dias | **1,01** | 0,83–1,24 | 0,93 |

A série bruta mostra internações **mais altas** nas semanas seguintes ao evento (14,4 → 18,3 → 17,6 por semana), não uma queda. O “efeito” de 0,62 é a distância entre a tendência global e o nível pós-evento; quando se olha apenas a janela local, ele desaparece. O ITS não é o desenho adequado para essa pergunta sem uma tendência bem especificada e uma janela pré-definida.

O DLNM de temperatura no mesmo município mostra um efeito de frio consistente: RR p01 = 1,52 (1,24–1,87), AF total 12,7%. A direção é compatível com a literatura nacional (RR 1,07 para respiratório; 1,17 para cardiovascular), ainda que a magnitude seja maior — plausível para J09–J18 em Porto Alegre.

---

## 4. Comparação com a literatura

### 4.1 Referências usadas

- **Gasparrini et al. (2015), Lancet** — 384 cidades, 13 países, DLNM 0–21 d, MMT, AF. Para São Paulo (todas as causas, 1997–2011): MMT 21,5 °C (p60), AF total 4,62% (frio 3,93%; calor 0,69%). Para Porto Alegre: 7,08% (frio 6,58%; calor 0,50%). Para Recife: 2,10% (frio 0,89%; calor 1,20%).
- **Son et al. (2016), Int J Biometeorol** — São Paulo, 1996–2010: +6,1% (4,7–7,6) no p99 vs p90 (calor) e +8,6% (6,2–11,1) no p1 vs p10 (frio), todas as causas.
- **Gouveia et al. (2003), Int J Epidemiol** — São Paulo, 1991–1994: +2,6%/°C acima de 20 °C e +5,5%/°C abaixo de 20 °C em idosos.
- **Environ Res (2023)** — frio e internações cardiorrespiratórias no Brasil, 2008–2018: RR 1,17 (1,07–1,27) cardiovascular e 1,07 (1,01–1,14) respiratório.
- **Environ Res (2024)** — temperatura e internação por dengue no Brasil, 2010–2019: RR 3,47 (2,88–4,19) no p95 vs mínimo; efeito imediato (lag 0–2).
- **Lowe et al. (2021), Lancet Planet Health** — dengue e hazards hidrometeorológicos no Brasil: RR 1,56 (1,41–1,73) após período muito úmido (1 mês) e 1,43 (1,22–1,67) após seca (4 meses).
- **Campo Grande (2019)** — internações respiratórias: frio RR 1,482 (1,231–1,785) e calor RR 1,509 (1,209–1,883) em idosos, lag 0–25.

### 4.2 O que a replicação mostra

**ec-03 (São Paulo, cardiovascular 60+).** A réplica é qualitativamente consistente com Gasparrini e Son: curva em U, MMT no terço superior da distribuição (23,1 °C; p76), **frio dominante** e calor modesto. A magnitude é maior que a de all-cause porque o desfecho é cardiovascular e restrito a 60+:

- calor: RR p99 1,21 vs +6,1% de Son (p99 vs p90);
- frio: RR p01 1,67 vs +8,6% de Son (p1 vs p10);
- AF: 7,9% vs 4,62% de Gasparrini (all-cause).

**ec-04 (Porto Alegre, respiratório).** A direção do DLNM é consistente com a literatura nacional (frio aumenta internações), mas a magnitude é maior (1,52 vs 1,07). Diferenças plausíveis: recorte J09–J18 (pneumonia/influenza), cidade do Sul com inverno marcado, e desenho em série temporal única. O ITS, como mostrado, não sustenta a leitura de “queda de 38%”.

**ec-02 (Recife e Fortaleza, dengue).** A replicação **não** recupera o sinal positivo esperado entre GDD e dengue. Em Recife, nem o GDD (RR p90 1,07; IC 0,32–3,64) nem a temperatura (RR p90 0,99; IC 0,97–1,01) mostram efeito após ajuste sazonal. Em Fortaleza, segunda cidade testada, o padrão se repete com outro sintoma de instabilidade: MMT no p90, RR alto na cauda fria (10,56; IC 3,71–30,08) e AF de 62% — um resultado que não descreve a transmissão de dengue. A explicação mais provável é epidemiológica, não computacional:

- em Recife a temperatura é alta e pouco limitante durante todo o ano;
- a sazonalidade da dengue é modulada por **chuva, umidade, sorotipo e imunidade de rebanho**;
- um DLNM de cidade única com 217 semanas e 12 semanas de defasagem não tem poder para separar esses fatores.

O desenho publicado que recupera o sinal (Lowe 2021) usa **PDSI/chuva**, 558 microrregiões e um modelo espaço-temporal bayesiano — não GDD em cidade única. O problema, portanto, não é específico de Recife: é a exposição e a escala de análise.

**ec-01 (São Paulo, respiratório pediátrico).** Com 757 óbitos em 259 semanas, o modelo não identifica uma curva estável: o MMT cai no p10, o RR no p50 sobe a 2,49 e a AF de 41,6% é um artefato. O snapshot original (4.765 óbitos em 715 municípios) parecia ter poder, mas o poder vinha da **soma de populações com exposições diferentes** — uma exposição média que não corresponde a nenhum território real. O resultado nulo do livro, portanto, não deve ser lido como “não há efeito”; é **não estimável com este desenho**.

---

## 5. Achados críticos, por ordem de gravidade

| # | Achado | Evidência | Gravidade |
|---|---|---|---|
| F1 | `sus_mod_dlnm()` agrega todos os municípios por data, sem aviso | `summarise(.by = date)`; 645 municípios no ec-03 | **Crítica** |
| F2 | Lags diários aplicados a desfechos semanais (ec-01, ec-02) | 21/84 colunas diárias; pico no limite 84 | **Crítica** |
| F3 | São Paulo cidade com 100% de NA em 2010–2017, apesar de A701 ter 99% de cobertura | arquivo analítico vs cache INMET | **Crítica** |
| F4 | ITS do ec-04 é artefato de tendência global | 0,62 → 0,87 (janela total) → 1,01 (±365 d) | **Alta** |
| F5 | Ausência de dia da semana e feriados no DLNM diário e no ITS | fórmula do GLM | **Alta** |
| F6 | Referência = mediana, não MMT; AF relativa à mediana | `ref_value <- median(...)` | **Alta** |
| F7 | GDD em °C·hora (24×), não °C·dia | valores ~372 vs esperado ~16/dia | **Média** |
| F8 | Sem pool multicidade, sem heterogeneidade espacial; dengue sem chuva | desenho de cidade única | **Média** |

---

## 6. Recomendações para o `climasus4r`

1. **`sus_mod_dlnm()` deve exigir uma unidade de análise.** Adicionar `by = NULL` (coluna de estrato) e:
   - se houver mais de um município por data e `by` for `NULL`, **abortar** com mensagem clara, em vez de agregar silenciosamente;
   - se `by` for informado, ajustar um modelo por estrato e devolver uma lista para `sus_mod_pool()`.
2. **Validar a unidade dos lags.** Se o desfecho é semanal, `lag_max` deve ser em semanas; converter `_lagN` diários em semanas ou abortar.
3. **Adicionar `dow = TRUE` e `holidays = TRUE`** ao DLNM diário e ao ITS; documentar o padrão.
4. **Adicionar `ref = "mmt"`** (padrão) e calcular o MMT no intervalo p10–p90; manter `ref_value` para compatibilidade.
5. **Corrigir a unidade do GDD**: °C·dia por dia, com soma diária (não horária); documentar base e teto.
6. **Relatório de cobertura por município** em `sus_climate_aggregate()`: % de dias com estação, distância e código da estação; abortar se a capital tiver >20% de NA.
7. **ITS**: exigir `dow`, permitir `window` e reportar sensibilidade local; excluir anos parciais por padrão.
8. **Diagnósticos**: além de Ljung–Box, oferecer correção (AR1/robust SE) e gráfico de autocorrelação; alertar quando o MMT cair na borda.
9. **Template de replicação**: um pipeline que recebe uma estimativa publicada (RR, IC, exposição, lag) e devolve a comparação com o resultado local.

## 7. Recomendações para o livro

**Status:** itens 1–4 e 6 (rótulo da figura) aplicados em 28/10/2026; o item 5 (caixa de
métodos) permanece como próximo passo editorial.

1. **ec-03**: substituir o contraste p75 (0,98) pelo contraste de cauda (p99 1,21; p01 1,67) e pela AF com MMT. A narrativa “dominado pelo frio” passa a ter suporte.
2. **ec-04**: apresentar o ITS como **exercício de especificação** (0,62 → 0,87 → 1,01), não como efeito do frio; usar o DLNM como resultado principal.
3. **ec-02**: reposicionar o GDD como hipótese para análise **multicidade/espaço-temporal com chuva**, não como exposição principal de cidade única. O capítulo já sugere pooling; falta dizer que o resultado atual é inválido, não apenas instável.
4. **ec-01**: declarar explicitamente “não estimável” e propor o desenho de pooling entre capitais; retirar a AF negativa como se fosse um achado.
5. **Métodos**: incluir uma caixa sobre unidade de análise, unidade do lag, MMT e dia da semana — os quatro pontos que explicam os resultados.
6. **Figuras**: a figura de modelagem deve dizer “referência” (mediana ou MMT), não “MMT” fixo; a figura do ec-04 deve mostrar a sensibilidade da janela.

---

## 8. Limitações da replicação

- Uma cidade por caso (duas para dengue), 5–10 anos; sem pool multicidade.
- Sem poluição do ar, sem influenza/gravidade sazonal, sem sorotipo de dengue, sem estratificação por sexo/idade além do recorte.
- Modelo ecológico de série temporal; não é desenho causal.
- A estação única representa a cidade, não a heterogeneidade intraurbana.
- A AF por simulação assume a especificação do modelo; não incorpora incerteza de seleção de modelo.
- O cache INMET é local; a replicação exige ~42 GB e os scripts 00–01.

---

## 9. Reprodutibilidade

```
book/scripts/90-replicacao/00-build-city-climate.R
book/scripts/90-replicacao/prep_city_series.py
book/scripts/90-replicacao/01-fit-replicacao.R
book/results/replicacao/replicacao.json
book/results/replicacao/comparacao_literatura.csv
```

O script 00 extrai A701/A301/A801 do cache INMET; o prep monta as séries cidade-específicas com lags na unidade correta; o script 01 ajusta os DLNMs, estima o MMT e calcula a AF com IC por simulação.

---

## 10. Referências

- Gasparrini A, Guo Y, Hashizume M, et al. Mortality risk attributable to high and low ambient temperature: a multicountry observational study. *Lancet*. 2015;386(9991):369–375. doi:10.1016/S0140-6736(14)62114-0.
- Son JY, Gouveia N, Bravo MA, de Freitas CU, Bell ML. The impact of temperature on mortality in a subtropical city: effects of cold, heat, and heat waves in São Paulo, Brazil. *Int J Biometeorol*. 2016;60(1):113–121. doi:10.1007/s00484-015-1009-7.
- Gouveia N, Hajat S, Armstrong B. Socioeconomic differentials in the temperature–mortality relationship in São Paulo, Brazil. *Int J Epidemiol*. 2003. PMID: 12777425.
- Low ambient temperature and hospitalization for cardiorespiratory diseases in Brazil. *Environ Res*. 2023;116231. doi:10.1016/j.envres.2023.116231.
- Ambient temperature and dengue hospitalization in Brazil. *Environ Res*. 2024. PMC11688019.
- Lowe R, Lee SA, O'Reilly KM, et al. Combined effects of hydrometeorological hazards and urbanisation on dengue risk in Brazil: a spatiotemporal modelling study. *Lancet Planet Health*. 2021;5(4):e209–e219. doi:10.1016/S2542-5196(20)30292-8.
- The effects of hot and cold temperatures on hospital admissions for respiratory diseases in Campo Grande, MS, Brazil. *Gaia*. 2019.
- Efeitos da temperatura no ciclo de vida, exigências térmicas e estimativas do número de gerações anuais de *Aedes aegypti*. *Rev Bras Entomol*. 2009. doi:10.1590/S0073-47212009000200004.
- Bhaskaran K, Gasparrini A, Hajat S, Smeeth L, Armstrong B. Time series regression studies in environmental epidemiology. *Int J Epidemiol*. 2013;42(4):1187–1195. doi:10.1093/ije/dyt092.
