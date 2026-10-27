# Avaliação de especialistas — pipelines do climasus+ Studio

**Data:** 25/10/2026  
**Versão avaliada:** `1.1.0-beta.1` (branch `ux/canvas`)  
**Escopo:** os 21 Modelos de `src/pipelines/templates.ts` e os Estudos de Caso de `src/templates/*`  
**Foco:** pipelines de **Integração** e **Modelagem**, com atenção especial ao alinhamento temporal por desfecho  
**Método:** leitura dos templates, do catálogo (`src/catalog/functions.json`), da documentação técnica (`docs/referencia-tecnica/`) e do código-fonte R do pacote `climasus4r` que o Motor executa. **Não** houve execução dos pipelines com dados reais (downloads DATASUS/INMET); portanto, os achados são de **revisão de desenho e de contrato de função**, não de validação empírica.

---

## 0. Como ler este parecer

Cada pipeline recebe **um especialista titular**, um **veredito** e **achados priorizados**:

| Símbolo | Significado |
|---|---|
| 🔴 | **Requer correção** — pode não executar, produzir exposição inválida ou invalidar a inferência |
| 🟡 | **Aprovado com ressalvas** — executa, mas o desenho padrão induz viés ou interpretação errada se não for ajustado |
| 🟢 | **Adequado ao propósito**, com melhorias menores |

**Severidade dos achados**

| Código | Significado |
|---|---|
| **P0** | bloqueia a execução ou invalida o resultado (ex.: coluna de exposição toda `NA`, modelo com pseudo-replicação, argumento obrigatório ausente) |
| **P1** | viés, perda de poder ou interpretação incorreta provável (ex.: resolução temporal incompatível, denominador ausente, baseline circular) |
| **P2** | melhoria metodológica, documentação ou robustez |

> **Nota de honestidade:** o Studio já tem um bom mecanismo de avisos metodológicos (`[METODOLOGIA]`) e os templates usam `stepRef` corretamente para ramos laterais (ondas de calor/frio). Isso é um ponto forte real. O problema central não é a infraestrutura; é o **desenho epidemiológico padrão**, que hoje trata desfechos muito diferentes (dengue, respiratório pediátrico, cardiovascular, frio) com o mesmo padrão “temperatura + `distributed_lag` de 21–30 dias”.

---

## 1. Sumário executivo

### 1.1 Quadro-resumo dos 21 pipelines

| # | Pipeline (`id`) | Especialista titular | Veredito | Risco principal |
|---:|---|---|:---:|---|
| 1 | `pipeline-importacao-saude` | Engenheiro de dados de saúde / curador DATASUS | 🟡 | Janela 2020–2022 dominada pela COVID; sem controle de qualidade na saída |
| 2 | `pipeline-preparacao-basica` | Epidemiologista de dados / séries temporais | 🟡 | Agregação mensal sem `group_by`; resolução mensal grosseira para desfechos agudos |
| 3 | `pipeline-qualidade-visualizacao` | Bioestatístico / séries temporais | 🟡 | `ts_quality` espera série diária; template aceita qualquer tabela |
| 4 | `clima-inmet` | Climatologista / dados de estação | 🟡 | Sem preenchimento de falhas e sem distância máxima estação–município |
| 5 | `clima-normais` | Climatologista / normais climatológicas | 🟢 | Standalone; não conecta ao cálculo de anomalias |
| 6 | `grid-chirps` | Sensoriamento remoto / hidrometeorologia | 🔴 | Sem `municipalities`, retorna raster/caminhos, não tabela por município |
| 7 | `grid-era5` | Reanálise climática | 🔴 | Sem `municipalities`; `t2m` médio em vez de `t2m_max` para calor; 0,25° grosseiro |
| 8 | `grid-poluicao-pm25` | Epidemiologista de poluição do ar | 🔴 | Sem `municipalities`; CAMS ~0,75° é grosseiro para exposição municipal |
| 9 | `grid-queimadas` | Saúde ambiental / fogo e fumaça | 🔴 | Sem `municipalities`, retorna pontos brutos; foco de queimada ≠ exposição a fumaça |
| 10 | `clima-aggregate-exposicao` | Epidemiologista ambiental / integração clima–saúde | 🔴 | `time_unit='month'` + `window_days=7` + `min_obs=0.7` tende a produzir exposição toda `NA` |
| 11 | `tematico-indices-bioclimaticos` | Biometeorologista / estresse térmico | 🟡 | UTCI/PET/HI são aproximações; não comparar valores absolutos entre estudos |
| 12 | `tematico-ondas-calor` | Epidemiologista de calor | 🟡 | Baseline = série inteira (2010–2023), circular e curto; só método WHO |
| 13 | `tematico-ondas-frio` | Epidemiologista de frio | 🟡 | Percentil 10 na série inteira; limiar pode não fazer sentido no Brasil tropical |
| 14 | `ec-01-respiratorio-pediatrico` | Epidemiologista respiratório pediátrico | 🔴 | Desfecho **mensal** com lags **diários** de 0–30 dias; ~33 parâmetros para 60 observações |
| 15 | `ec-02-dengue-clima` | Epidemiologista de arboviroses / ecologia de vetores | 🔴 | **Sem graus-dia**; janela 0–28 dias curta; sem chuva/umidade; âncora temporal ambígua |
| 16 | `ec-03-cardio-idosos-calor` | Epidemiologista cardiovascular / calor | 🟡 | Referência = mediana, não MMT; sem poluição do ar; onda de calor não entra no modelo |
| 17 | `ec-04-hospitalizacoes-frio` | Epidemiologista de serviços de saúde / frio | 🔴 | ITS em tabela multi-município sem agregação; data de interrupção fictícia; frio não entra no modelo |
| 18 | `mod-dlnm` | Bioestatístico / DLNM | 🟡 | Genérico demais; `outcome_col` fixo; sem `negbin` real; diagnóstico não é passo |
| 19 | `mod-espacial-bayes` | Epidemiologista espacial | 🔴 | Sem `offset` (modela contagem, não taxa/SMR); múltiplas linhas por município viram “áreas” distintas |
| 20 | `mod-casecrossover-its` | Epidemiologista de inferência quase-experimental | 🔴 | `sus_mod_its` sem `interruption_dates` (falha); dois desenhos misturados; pseudo-replicação |
| 21 | `mod-ml-predicao` | Cientista de dados / ML em saúde | 🔴 | Validação cruzada aleatória em série temporal (vazamento); sem features de lag; sem validação externa |

### 1.2 Top 10 achados

1. **Dengue não usa graus-dia.** O template usa `tair_dry_bulb_c` com `distributed_lag` de 28 dias. O catálogo já tem `temporal_strategy='degree_days'` e `temp_base` com recomendação explícita de **11 °C para *Aedes aegypti*** (`sus_climate_aggregate.R`, documentação). É a lacuna mais importante do conjunto.
2. **A janela de 0–28 dias é curta para dengue.** O ciclo biológico relevante (desenvolvimento larval + período de incubação extrínseca + incubação humana + notificação) aponta para **3–12 semanas**, não 0–4.
3. **O template de integração “principal” (`clima-aggregate-exposicao`) tende a produzir exposição `NA`.** A combinação `time_unit='month'` + `window_days=7` + `min_obs=0.7` deixa, no máximo, 1 linha climática mensal dentro de uma janela de 8 dias; `1/8 = 0,125 < 0,7`.
4. **ITS e case-crossover recebem tabelas multi-município sem agregação.** `sus_mod_its()` e `sus_mod_casecrossover()` não agregam por data; cada linha município-dia é tratada como observação independente (pseudo-replicação), ou o lag é deslocado na ordem errada.
5. **`mod-casecrossover-its` não executa como está:** `sus_mod_its` exige `interruption_dates`, e o template não passa esse argumento.
6. **`mod-espacial-bayes` modela contagens, não taxas.** Sem `offset` (população/expected counts), o mapa é dominado pelo tamanho populacional. Além disso, `area_idx = seq_len(nrow(df))` transforma cada linha em uma “área”; se houver vários anos/meses por município, o modelo fica inválido.
7. **Os templates de grade não entregam tabela municipal.** Sem `municipalities`, `sus_grid_chirps()`, `sus_grid_era5()`, `sus_grid_pollution_cams()` e `sus_grid_fires()` retornam raster/caminhos/pontos brutos — o oposto do que a descrição promete.
8. **Respiratório pediátrico mensal com lags diários.** O DLNM vê 31 colunas de lag em dias, mas as observações estão espaçadas em ~30 dias; as janelas de meses adjacentes se sobrepõem quase totalmente. O resultado é colinearidade severa e uma curva de lag que o desfecho mensal não consegue identificar.
9. **Ondas de calor/frio com baseline circular.** `baseline_start=NULL` usa a própria série (2010–2023 ou 2010–2019), e a função avisa que <20 anos é curto. O limiar deve vir de um período de referência externo e fixo.
10. **ML com validação cruzada aleatória.** Em série temporal/municipal, o k-fold aleatório vaza informação do futuro e de municípios vizinhos. O próprio `sus_mod_ml()` tem `id_col` para CV group-aware; o template não usa.

### 1.3 O que está bom (e deve ser preservado)

- O catálogo tem **10 estratégias temporais** e variáveis derivadas (`gdd_c`, `cdd_c`, `hdd_c`, `utci_c`, `wbgt_c`), o que permite desenhos melhores do que os templates usam.
- O mecanismo `[METODOLOGIA]` + `MethodWarningBanner` é exatamente o lugar certo para expor riscos estatísticos ao usuário não programador.
- Os templates de caso usam `stepRef` para ramos laterais (ondas de calor/frio) e para consumo direto do `fit` pelo DLNM/AF; isso evita os erros clássicos de encadeamento.
- A documentação técnica é detalhada e, em grande parte, fiel ao comportamento das funções.

### 1.4 Status de implementação (25/10/2026)

Correções **aplicadas** nesta rodada:

- **Dengue:** template reescrito para GDD base 11 °C (teto 35 °C) via `sus_climate_compute_indicators(custom_thresholds=...)`, agregação semanal por `data_primeiros_sintomas`, `complete_dates=TRUE`, lag 0–84 dias e DLNM com `climate_col='gdd_c'`/`dof_per_year=2`; quatro estados (CE, PE, BA, MA) em vez de nove.
- **Motor:** `.aggregate_meteo_data()` em `utils-clim.R` foi alinhado à versão de `sus_climate_aggregate.R` para preservar `gdd_c`, `cdd_c`, `hdd_c` e índices derivados na agregação horária → diária; `sus_data_filter_demographics()` passou a reconhecer `code_muni` (necessário para filtrar após `sus_spatial_join()`); o pacote `climasus4r` foi reinstalado. Sem isso, `gdd_c` era descartado e os filtros municipais pós-join eram ignorados.
- **Integração:** `clima-aggregate-exposicao` passou de `moving_window` mensal (que gerava `NA`) para `distributed_lag` 0–21 dias com clima diário.
- **Respiratório pediátrico:** desfecho mensal → semanal; lag 30 → 21 dias; `dof_per_year=2`.
- **ITS/case-crossover:** `ec-04` agora filtra Porto Alegre (série única) antes do ITS; `mod-casecrossover-its` filtra um município, usa lags 0–3 e passa `interruption_dates` (exemplo COVID-19).
- **Espacial:** `mod-espacial-bayes` agora exige `offset='expected_deaths'` e documenta “uma linha por município”.
- **Grades:** CHIRPS, ERA5, GHAP e queimadas agora recebem `municipalities`; CAMS foi trocado por GHAP no template de poluição.
- **Ondas:** baseline fixo 2010–2016 (temáticos) e 2010–2015 (casos), em vez da série inteira.
- **ML:** `id_col='code_muni'` para validação agrupada e regularização (`max_depth=4`, `min_child_weight=5`).
- **Preparação/importação:** 2020–2022 → 2015–2019; agregação semanal por município com `complete_dates=TRUE`; `sus_data_quality_report()` adicionado à importação, à preparação e ao template de qualidade.
- **Respiratório (humidade):** `ec-01` agora usa `climate_var='all'` (inclui temperatura e umidade) e a humidade entra como covariável (`rh_mean_porc_lag0`) no DLNM.
- **Outros ajustes:** `tematico-indices-bioclimaticos` fixa `region='south'` para RS e declara que UTCI/PET/HI são aproximações; `ec-03` documenta que a referência padrão é a mediana (substituir por MMT) e que PM2.5/O3 não são ajustados; `mod-ml` documenta a necessidade de features de lag; `clima-inmet`/`clima-normais` documentam distância, falhas e códigos de estação.
- **Revisão final dos 21:** todos os `fn`, argumentos, valores de enum, IDs e `stepRef` foram revalidados contra o catálogo e as regras do Inspetor. Vetores em argumentos `enum` (que o Inspetor rejeitaria) foram removidos: `climate_var='all'` no respiratório, `method='WHO'` nas ondas, `vars` padrão no ERA5 e `pollutants='pm25'` no GHAP.
- **Guia (`book/`):** capítulos 2, 3, 4, 6, 7, 8, 9, 10 e 12 e o README foram atualizados; as capturas de dengue, respiratório, frio, cardio, integração, preparação e modelagem foram regeradas a partir do app. O guia HTML foi renderizado com `quarto render --to html`.

Ainda **pendentes** (dependem de decisão de produto ou de mudança no Motor):

- Caminho nativo `degree_days` → DLNM (hoje o workaround é `gdd_c` + `distributed_lag`).
- `sus_climate_fill_gap` no catálogo do Studio.
- Binomial negativa real no `sus_mod_dlnm`.
- `expected_deaths`/população como passo calculado no pipeline espacial.
- MMT/referência explícita no template cardiovascular.
- Separação de `mod-casecrossover-its` em dois templates distintos.
- Correções de documentação (`n_dengue` → `n_casos`, `complete_dates`, `time_unit`, `negbin`).


---

## 2. O ponto central: alinhamento temporal é específico do desfecho

O usuário tem razão: **dengue e doença respiratória não devem usar o mesmo alinhamento temporal**. O erro de desenho é tratar “temperatura + lag” como receita universal. Abaixo, uma matriz de referência — **ponto de partida**, não regra rígida; cada estudo deve justificar sua escolha.

### 2.1 Matriz de alinhamento temporal por desfecho

| Desfecho | Âncora temporal | Resolução da saúde | Exposição primária | Estratégia | Janela/lag inicial | Modelo | Observações |
|---|---|---|---|---|---|---|---|
| **Dengue — casos notificados** | **Primeiros sintomas** (não notificação) | **Semana epidemiológica** (dom–sáb) | **GDD base 11 °C** + chuva acumulada + umidade | `degree_days` ou lag distribuído de `gdd_c` | **3–12 semanas** | DLNM / quasi-Poisson ou negbin + harmônicos | Imunidade, anos epidêmicos, atraso de notificação |
| **Dengue — forma grave/internação** | Sintomas ou admissão (documentar) | Semanal | GDD + chuva | idem | 2–12 semanas | idem | Caso confirmado vs suspeito |
| **Mortalidade respiratória <5 anos** | Data do óbito | **Diária ou semanal** | Temperatura média + umidade + PM2.5 | `distributed_lag` | **0–21 dias** | DLNM quasi-Poisson | Mensal só com lags mensais 0–3 |
| **Internações respiratórias** | Data da internação | Diária | Temperatura + umidade + PM2.5 | `distributed_lag` | 0–14/21 dias | DLNM / ITS só para política | SIH tem sazonalidade e mudança de codificação |
| **Mortalidade cardiovascular 60+** | Data do óbito | Diária | Temperatura média/máx + PM2.5/O3 | `distributed_lag` | Calor 0–3; frio 0–21 dias | DLNM + AF com **MMT** | Referência mediana superestima/atenua componentes |
| **Mortalidade geral — calor** | Data do óbito | Diária | Temperatura máxima | `distributed_lag` | 0–14/21 dias | DLNM + AF | MMT e ondas de calor |
| **Malária** | Primeiros sintomas | Semanal | Chuva + temperatura + umidade | `moving_window` 4–8 semanas | 4–12 semanas | GLM/DLNM | Ciclo do vetor + incubação |
| **Leptospirose** | Primeiros sintomas | Semanal | Chuva acumulada | `moving_window` 1–4 semanas | 1–4 semanas | GLM | Alagamentos, alta variabilidade espacial |
| **Doença diarreica** | Primeiros sintomas | Semanal | Chuva/temperatura | `moving_window` 1–4 semanas | 1–4 semanas | GLM | Água/saneamento |
| **Saúde mental** | Data do evento | Diária/semanal | Temperatura | `distributed_lag` | 0–7/14 dias | DLNM | Efeito agudo e curto |

> **Regra prática:** a resolução do desfecho e a resolução do lag devem ser **compatíveis**. Não se estima um lag em dias com um desfecho mensal; não se estima um efeito cumulativo de 12 semanas com uma janela máxima de 28 dias.

### 2.2 Por que graus-dia para dengue

**Graus-dia de desenvolvimento (GDD)** acumulam energia térmica acima de uma temperatura base:

```
GDD(t) = Σ_{d = t-W}^{t} max( T_média(d) − T_base , 0 )
```

Para *Aedes aegypti*, a literatura e o próprio pacote usam **T_base = 11 °C** (`temp_base` em `sus_climate_aggregate()`; tabela em `vignettes-pt/parte2_clima_agg.Rmd`). O desenvolvimento larval e a incubação extrínseca do vírus dependem dessa acumulação, não apenas da temperatura do dia. Por isso, GDD é mais próximo do mecanismo do que uma curva de temperatura diária com lag.

**Cuidados que o template atual não cobre:**

- **Teto térmico:** acima de ~35 °C o desenvolvimento do vetor cai; `sus_climate_aggregate(degree_days)` usa apenas `pmax(T − base, 0)` e **não aplica teto**. Já `gdd_c` de `sus_climate_compute_indicators()` aplica teto regional (30–35 °C). Para dengue, prefira uma série com teto ou documente a limitação.
- **Água:** GDD sozinho não representa criadouros. Chuva acumulada em 2–6 semanas e umidade relativa são necessárias.
- **Acumulação e autocorrelação:** GDD é cumulativo e altamente autocorrelacionado; use GDD semanal/anomalia de GDD, não GDD diário com lags longos sem checar colinearidade.
- **Sensibilidade:** a base 11 °C é biológica, mas a escolha de janela (21, 28, 42, 56 dias) deve ser testada; não há um “valor calibrado” universal.

### 2.3 Como implementar graus-dia no Studio **hoje**

Há um descompasso de contrato que precisa ser conhecido:

| Caminho | O que faz | Limite |
|---|---|---|
| `sus_climate_aggregate(temporal_strategy='degree_days')` | Cria **uma** coluna `gdd_w{W}tbase{B}` (ex.: `gdd_w28tbase11`) | **Não cria colunas `_lagN`**; portanto **não alimenta** `sus_mod_dlnm()`, que aborta sem `{climate_col}_lagN` |
| `sus_climate_compute_indicators(custom_thresholds = list(gdd_base = 11, gdd_upper = 35))` → `gdd_c` diário → `sus_climate_aggregate(distributed_lag, climate_var='gdd_c')` → `sus_mod_dlnm(climate_col='gdd_c')` | Cria `gdd_c_lag0..N`, fixa base 11 °C/teto 35 °C e permite DLNM | Depende do Motor preservar `gdd_c` na agregação horária → diária (corrigido nesta rodada em `utils-clim.R`) |
| `degree_days` → `sus_mod_casecrossover(exposure_col='gdd_w28tbase11')` | Funciona para desfecho **diário** | Não serve para dengue semanal; case-crossover diário não é o desenho usual para dengue |

**Recomendação de produto (P0):** permitir que `sus_mod_dlnm()` aceite uma exposição única + especificação de lag e construa a `crossbasis` internamente, **ou** adicionar `temporal_strategy='degree_days_distributed_lag'`, **ou** fazer `degree_days` emitir colunas de lag quando solicitado. Sem isso, o usuário que quer graus-dia fica sem caminho ponta-a-ponta nativo.

**Workaround implementado no template:** usar `gdd_c` com `custom_thresholds` (base 11 °C, teto 35 °C) + `distributed_lag` + DLNM. A base é explícita e a agregação preserva `gdd_c`; o que falta é o atalho nativo `degree_days` → DLNM.

---

## 3. Fichas por pipeline

> As fichas abaixo descrevem o **estado avaliado antes das correções**. O que já foi implementado está na seção 1.4; o que permanece pendente está marcado como tal.

### 3.1 Preparação

#### 1. `pipeline-importacao-saude` — “Etapa 1: importar dados de saúde”

**Especialista:** Engenheiro de dados de saúde pública / curador DATASUS.  
**Veredito:** 🟡 Aprovado com ressalvas.  
**Fluxo:** `sus_data_import(SIM-DO, SP, 2020:2022)`.

**Achados**

- **P1 — Janela 2020–2022 é atípica.** Para um template de primeira impressão, 2020–2022 é o período COVID: a série de óbitos muda de nível e composição. Um usuário iniciante pode concluir que o “padrão” dos dados é aquele. Prefira 2015–2019 ou explique explicitamente o efeito da pandemia.
- **P1 — Sem controle de qualidade na saída.** O template termina no download. Adicione `sus_data_quality_report()` (completude, datas, CID, cobertura geográfica) antes de qualquer análise.
- **P2 — `uf` com aspas internas** (`'"SP"'`) é um detalhe de serialização; funciona, mas é frágil para quem edita o JSON à mão.

**Correção recomendada:** trocar para 2015–2019 (ou manter 2020–2022 com um aviso), adicionar `sus_data_quality_report()` e um passo de `sus_data_export()` para materializar a base baixada.

---

#### 2. `pipeline-preparacao-basica` — “Etapas 2-4: limpar, filtrar e agregar”

**Especialista:** Epidemiologista de dados / analista de séries temporais.  
**Veredito:** 🟡 Aprovado com ressalvas.  
**Fluxo:** import → encoding → standardize → filtro CID respiratório → variáveis de calendário → `sus_data_aggregate(month)`.

**Achados**

- **P1 — Agregação sem `group_by`.** `sus_data_aggregate(time_unit='month')` sem `group_by` colapsa todos os municípios em uma série única. Se o objetivo é preparar para integração espacial, isso destrói a dimensão municipal. Use `group_by='codigo_municipio_residencia'` (ou `code_muni`) e documente.
- **P1 — Resolução mensal para desfecho agudo.** Doença respiratória aguda tem efeito em dias/semanas. Mensal é aceitável para sazonalidade de longo prazo, não para DLNM de exposição aguda. Prefira `week` (ou `day`) e reserve `month` para análises de tendência.
- **P1 — Descrição promete “seleção demográfica”, mas o passo não existe.** O template não inclui `sus_data_filter_demographics()`, apesar de `PREP_SEQUENCE` incluir. Ou adicione, ou ajuste a descrição.
- **P2 — `complete_dates` fica `FALSE`.** O default do código é `FALSE` (a documentação diz `TRUE`). Para séries que vão alimentar modelos, use `TRUE` para não deixar semanas/meses ausentes.
- **P2 — Sem `sus_data_quality_report()`/`sus_data_ts_quality()`** após a agregação.

**Correção recomendada:** `time_unit='week'`, `group_by='codigo_municipio_residencia'`, `complete_dates=TRUE`; incluir `sus_data_filter_demographics` se a faixa etária for parte da pergunta; adicionar quality report.

---

#### 3. `pipeline-qualidade-visualizacao` — “Qualidade e visualização da série agregada”

**Especialista:** Bioestatístico / analista de séries temporais.  
**Veredito:** 🟡 Aprovado com ressalvas.  
**Fluxo:** `sus_data_read(path='')` → `sus_data_ts_quality` → plot série → plot mapa.

**Achados**

- **P1 — `sus_data_ts_quality()` espera série diária.** A documentação fala em “série diária de casos por município”; o template aceita qualquer tabela agregada. Com dados mensais, completude, lacunas e quebras estruturais são calculadas em uma escala errada e podem gerar recomendações falsas.
- **P1 — `path=''` é placeholder.** O template não executa sem o usuário escolher um arquivo. Isso é aceitável em um “modelo didático”, mas deveria estar explícito no título/descrição (“a partir de uma tabela exportada”).
- **P2 — `sus_data_plot_aggregate_map()` pode exigir geometria.** Se a tabela lida não tiver `sf`/`code_muni`, o mapa falha ou é feito por join interno. Documente a entrada mínima.
- **P2 — `value_col`/`outcome_col` não definidos.** A autodetecção pode escolher `n_obitos` quando o desfecho é `n_casos` (ou vice-versa). Em um template de qualidade, seja explícito.

**Correção recomendada:** declarar “use uma tabela diária por município”; definir `outcome_col`; adicionar uma checagem de classe/estrutura antes do `ts_quality`.

---

### 3.2 Clima & ambiente

#### 4. `clima-inmet` — “Clima de estações (INMET)”

**Especialista:** Climatologista / especialista em dados de estação.  
**Veredito:** 🟡 Aprovado com ressalvas.  
**Fluxo:** `sus_climate_inmet(years='2018:2022', uf='"SP"')`.

**Achados**

- **P1 — Sem preenchimento de falhas.** O catálogo do Studio **não inclui** `sus_climate_fill_gap()` (existe no pacote R). Falhas de estação são apenas mascaradas por `min_obs` dentro das janelas de `sus_climate_aggregate()`; a série bruta não é corrigida. Para análises de longo prazo, isso é uma limitação relevante.
- **P1 — Sem distância máxima estação–município.** `sus_climate_aggregate()` calcula a estação mais próxima por distância euclidiana e **informa** a distância máxima, mas **não exclui** municípios distantes. No Nordeste semiárido e na Amazônia, isso pode significar exposição a centenas de km. O usuário precisa inspecionar `distance_km` e definir um corte (ex.: 50–100 km para temperatura; mais para chuva).
- **P2 — 2018–2022 é curto** para normais/anomalias e para eventos extremos raros.
- **P2 — Representatividade urbana.** Estação de aeroporto/ rural não representa ilha de calor urbana; para estudos intra-urbanos, use grade/reanálise ou estações urbanas.

**Correção recomendada:** adicionar um passo de diagnóstico de distância (ou um filtro), documentar falhas, e considerar `sus_grid_era5`/CHIRPS como checagem de sensibilidade.

---

#### 5. `clima-normais` — “Normais climatológicas (1991–2020)”

**Especialista:** Climatologista / normais climatológicas.  
**Veredito:** 🟢 Adequado, com melhoria menor.  
**Fluxo:** `sus_climate_normals(period='1991-2020')`.

**Achados**

- **P2 — Standalone.** O template baixa as normais, mas não mostra o uso com `sus_climate_anomaly()`. Como peça didática, ficaria mais útil se terminasse em uma anomalia de exemplo.
- **P2 — Códigos de estação.** As normais são por estação e `var_code`; sem `sus_climate_normals_meta()` e sem garantir que os códigos batem com `sus_climate_inmet()`, o join de anomalias pode falhar silenciosamente.
- **P2 — Período 1991–2020** é o padrão WMO; correto.

**Correção recomendada:** incluir `sus_climate_normals_meta()` e um exemplo de `sus_climate_anomaly()`.

---

#### 6. `grid-chirps` — “Precipitação em grade (CHIRPS)”

**Especialista:** Sensoriamento remoto / hidrometeorologia.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** `sus_grid_chirps(resolution='monthly', years='2018:2022')`.

**Achados**

- **P0 — Sem `municipalities`, a função retorna raster/caminhos, não tabela municipal.** A descrição promete “agregada por município”, mas `sus_grid_chirps()` só agrega quando recebe um objeto `sf` de polígonos; com `NULL`, devolve `SpatRaster`/paths. O template não passa `municipalities`. Isso é um contrato quebrado entre descrição e execução.
- **P1 — `resolution='monthly'` é grosseiro para dengue.** Para chuva como exposição vetorial, use `daily` e acumule em janelas de 2–6 semanas; mensal serve para análise de longo prazo.
- **P1 — Agregação por área.** Para municípios costeiros/pequenos, pixels de oceano e bordas podem dominar; use agregação ponderada por área e verifique a fração de pixels válidos.
- **P2 — Validação contra INMET.** CHIRPS subestima/superestima em relevo complexo; uma checagem com estações é recomendável.

**Correção recomendada:** passar `municipalities = geobr::read_municipality(...)` (ou o `sf` já existente no pipeline); usar `resolution='daily'` para dengue; documentar a unidade (mm/dia vs mm/mês).

---

#### 7. `grid-era5` — “Temperatura e precipitação em grade (ERA5)”

**Especialista:** Reanálise climática.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** `sus_grid_era5(years='2018:2022', vars='c("t2m","tp")')`.

**Achados**

- **P0 — Sem `municipalities`, retorna caminhos NetCDF**, não uma tabela por município. A descrição diz “por município”; o template não configura isso.
- **P1 — `t2m` é temperatura média; para calor, use `t2m_max`.** O template usa `t2m`; para desfechos de calor, a exposição relevante é a máxima diária (ou média, mas com justificativa). Para vetor, a média pode ser adequada.
- **P1 — Resolução nativa ~0,25° (~31 km)** é grossa para municípios pequenos e para ilhas de calor. A agregação por polígono suaviza demais; declare a limitação e use `raster_area`/ponderação por área.
- **P2 — Unidades:** o pacote converte K→°C e m→mm; isso está documentado e correto. Mas a agregação temporal (dia UTC vs local) deve ser verificada.

**Correção recomendada:** `municipalities` obrigatório; `vars='c("t2m_max","tp")'` para calor; documentar resolução e incerteza.

---

#### 8. `grid-poluicao-pm25` — “Poluição do ar PM2.5 (CAMS)”

**Especialista:** Epidemiologista de poluição do ar.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** `sus_grid_pollution_cams(pollutants='c("pm25","pm10")', years='2018:2022')`.

**Achados**

- **P0 — Sem `municipalities`, retorna caminhos de arquivo**, não exposição municipal.
- **P1 — CAMS reanálise é ~0,75° (~80 km).** Para exposição intra-urbana, é grosseiro; o catálogo tem `sus_grid_pollution_ghap` (GHAP, ~1 km), mais adequado para PM2.5 no Brasil. Use CAMS como fallback/validação.
- **P1 — PM2.5 isolado é insuficiente.** Para saúde respiratória/cardiovascular, considere PM10, O3, NO2 e ajuste para temperatura; evite ajustar para variáveis que são parte do mesmo caminho causal (confundimento intermediário).
- **P2 — `metric='mean'`** é adequado para exposição de 24 h; para picos, use `max`. Mantenha resolução diária para lags.

**Correção recomendada:** usar GHAP para PM2.5 municipal; passar `municipalities`; incluir gases e documentar a resolução.

---

#### 9. `grid-queimadas` — “Focos de queimadas (INPE/FIRMS)”

**Especialista:** Saúde ambiental / sensoriamento remoto de fogo.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** `sus_grid_fires(years='2018:2022', source='inpe')`.

**Achados**

- **P0 — Sem `municipalities`, retorna pontos brutos de fogo**, não contagem por município. A descrição promete “contagem de focos por município”.
- **P1 — Foco de queimada ≠ exposição a fumaça.** Um foco a 100 km pode afetar uma cidade; um foco dentro do município pode não afetar. Sem transporte/dispersão, o proxy é fraco. Use distância ponderada, FRP ou produtos de fumaça (CAMS/GEOS-Chem) como sensibilidade.
- **P2 — Zero-inflação e sazonalidade.** Contagens mensais com muitos zeros pedem modelos zero-inflados ou hurdle; a agregação temporal deve ser compatível com o desfecho.
- **P2 — `source='inpe'` vs FIRMS** tem coberturas e limiares diferentes; documente.

**Correção recomendada:** passar `municipalities`; usar contagem diária/semanal por município; tratar fumaça como exposição separada (não apenas foco).

---

#### 10. `clima-aggregate-exposicao` — “Exposição saúde × clima (`sus_climate_aggregate`)”

**Especialista:** Epidemiologista ambiental / integração clima–saúde.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** `sus_data_read` → `sus_spatial_join` → `sus_climate_inmet` → `sus_climate_aggregate(moving_window, 7 dias, time_unit='month')` → `sus_climate_plot_aggregate`.

**Achados**

- **P0 — A combinação de parâmetros tende a produzir exposição `NA`.** `time_unit='month'` agrega o clima para uma linha por mês (data no início do mês). Em seguida, `moving_window` com `window_days=7` usa uma janela de 8 dias (`window_size = window_days + 1`) e exige `min_obs=0.7`: no máximo 1 linha mensal cai dentro da janela, então `1/8 = 0,125 < 0,7` → `NA`. O passo “chave de integração” não entrega a exposição que promete. **Correção:** manter `time_unit='day'` (o clima diário dentro da janela de 7 dias) ou, se o desfecho é mensal, usar `window_days=30` e clima mensal — mas nunca misturar janela em dias com clima mensal.
- **P1 — Janela de 7 dias é curta para a maioria dos desfechos respiratórios/cardiovasculares.** Use `distributed_lag` 0–21 dias (ou 0–14) para efeitos agudos; `moving_window` 7 dias serve para exposição média recente, não para capturar o efeito acumulado completo.
- **P1 — `sus_data_read(path='')` + `sus_spatial_join` é ambíguo.** Se a tabela lida já tem `code_muni`/geometria, o `sus_spatial_join` pode duplicar/falhar; se não tem, o read não é suficiente. Defina o contrato: “esta tabela deve estar no stage `aggregate`, sem geometria” ou remova o join e comece de `sus_data_import`.
- **P1 — Sem âncora temporal explícita.** `health_data` pode ter `date` de óbito, internação ou notificação; o template não diz qual. Para integrar clima, a âncora é uma decisão epidemiológica, não um detalhe de implementação.
- **P1 — Sem distância máxima e sem preenchimento de falhas** (ver `clima-inmet`).
- **P2 — `climate_var` único (`tair_dry_bulb_c`).** Para respiratório/cardio, adicione umidade e PM2.5; para dengue, chuva e GDD.

**Correção recomendada:** reescrever o template como **duas variantes explícitas** — (a) “exposição aguda diária/semanal” com `distributed_lag`; (b) “exposição cumulativa” com `moving_window` na **mesma unidade** do desfecho. Definir `date_col`, `group_by` e a âncora no texto do template.

---

### 3.3 Temáticos

#### 11. `tematico-indices-bioclimaticos` — “Índices bioclimáticos para saúde pública”

**Especialista:** Biometeorologista / estresse térmico.  
**Veredito:** 🟡 Aprovado com ressalvas.  
**Fluxo:** `sus_climate_inmet` → `sus_climate_compute_indicators`.

**Achados**

- **P1 — UTCI/PET/HI são aproximações.** A própria documentação descreve UTCI como “Fiala-polynomial-inspired multi-term regression” e PET como “MEMI-style approximation”. Isso é aceitável para ranking e análises internas, mas **não** torne valores absolutos comparáveis a estudos que usam UTCI oficial. Declare isso no template.
- **P1 — `region='auto'` pode classificar errado** biomas/transições (ex.: Norte de Minas, Bahia interior). Se o estudo é regional, fixe `region` ou `biome`.
- **P2 — `apply_validity_mask=TRUE` é bom**; mantenha e documente os flags de confiança.
- **P2 — Sem desfecho de saúde.** É um ramo climático; tudo bem, mas o título “para saúde pública” sugere uma ligação que não existe no pipeline.

**Correção recomendada:** adicionar uma nota de “uso relativo, não absoluto”; fixar `region`; opcionalmente, um passo de plot/qualidade.

---

#### 12. `tematico-ondas-calor` — “Ondas de calor: detectar e visualizar”

**Especialista:** Epidemiologista de calor.  
**Veredito:** 🟡 Aprovado com ressalvas.  
**Fluxo:** INMET 2010–2023 → indicadores → `sus_climate_compute_heatwaves(WHO, p90)` → plot.

**Achados**

- **P1 — Baseline circular e curto.** `baseline_start=NULL` usa a série inteira (2010–2023, 14 anos) para definir o limiar e depois detectar eventos na mesma série. Isso é circular e a função avisa que <20 anos é curto. Use um período de referência fixo (ex.: 1981–2010 ou 1991–2020) e só depois aplique aos anos de interesse.
- **P1 — Só método WHO.** A definição de onda de calor muda drasticamente a carga atribuída (Xu et al., 2016). Rode pelo menos WHO + EHF/INMET e reporte sensibilidade.
- **P2 — `percentile=90` e `min_duration` default** são escolhas; documente e teste 90/95 e 2/3/5 dias.
- **P2 — Sem ligação com mortalidade.** O template termina no clima; para saúde, adicione DLNM/AF ou um modelo com indicador de onda.

**Correção recomendada:** `baseline_start='1981-01-01'`, `baseline_end='2010-12-31'` (ou o período disponível), múltiplos métodos, análise de sensibilidade.

---

#### 13. `tematico-ondas-frio` — “Ondas de frio: detectar e visualizar”

**Especialista:** Epidemiologista de frio.  
**Veredito:** 🟡 Aprovado com ressalvas.  
**Fluxo:** INMET 2010–2023 → indicadores → `sus_climate_compute_coldwaves(WHO, p10)` → plot.

**Achados**

- **P1 — Mesmo problema de baseline** (série inteira, 14 anos, circular).
- **P1 — Percentil 10 pode não ser um bom limiar no Brasil tropical.** “Onda de frio” é relativa; em regiões onde a temperatura raramente cai, o p10 pode selecionar noites amenas. Considere limiares absolutos (ex.: < 10 °C/< 5 °C) ou uma combinação com duração, e reporte sensibilidade.
- **P2 — EHF é, na implementação, “Fator de Excesso de Frio” (ECF)**; a documentação diz isso. Use com cuidado e não compare com EHF de calor.
- **P2 — Sem desfecho de saúde**; idem calor.

**Correção recomendada:** baseline fixo; limiares absolutos + relativos; sensibilidade; ligar a internações/mortalidade.

---

### 3.4 Estudos de caso

#### 14. `ec-01-respiratorio-pediatrico` — “Mortalidade respiratória pediátrica e temperatura (Sudeste)”

**Especialista:** Epidemiologista respiratório pediátrico.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** SIM-DO 2015–2019 → CID J → <5 anos → **agregação mensal** → `sus_spatial_join` → INMET → `sus_climate_aggregate(distributed_lag, lag_days=30)` → DLNM → plot → AF.

**Achados**

- **P0 — Desfecho mensal com lags diários.** O template agrega a saúde por `month`, mas pede `distributed_lag` com `lag_days='30'`. O `crossbasis` recebe 31 colunas de lag em **dias**, enquanto as observações estão espaçadas em ~30 dias. As janelas de meses adjacentes se sobrepõem quase completamente (o lag 30 de um mês é aproximadamente o lag 0 do mês anterior), gerando colinearidade severa e uma curva de lag que o desfecho mensal não identifica. **Correção:** (a) agregar a saúde por **semana/dia** e usar lag 0–21 dias; ou (b) manter mensal e usar **médias mensais** com lags **mensais** 0–3 (sem `distributed_lag` diário); ou (c) usar uma única janela cumulativa (`moving_window` 0–30 dias) e um GLM sazonal.
- **P0/P1 — Overfit.** São 60 meses; `sus_mod_dlnm` calcula `ns_df = max(4, round(4 × anos)) = 20` para tendência, mais `argvar df=4 × arglag df=3 = 12` parâmetros de crossbasis. Com intercepto, ~33 parâmetros para 60 observações. A curva exposição–resposta fica instável. Use `dof_per_year=1–2` (ou `ns_df` 5–10).
- **P1 — Sem umidade, PM2.5, RSV/influenza.** Mortalidade respiratória pediátrica é confundida por sazonalidade viral e poluição; temperatura sozinha é um modelo pobre. Adicione `rh_mean_porc` e PM2.5; discuta RSV/influenza como limitação ou proxy.
- **P1 — Sem denominador populacional.** Mortalidade em contagem vs taxa; use offset/população (o Studio tem `sus_census_join`, mas o template não usa).
- **P1 — Definição de caso.** `disease_group='respiratory'` inclui todo o capítulo J; para doença respiratória aguda pediátrica, J09–J18/J20–J22 pode ser mais específico. Declare a definição.
- **P2 — AF em dados mensais.** A fração atribuível depende da estrutura de lag e da referência; com resolução mensal, a interpretação é frágil.

**Correção recomendada (versão mínima):** agregar por semana, `lag_days=21`, `dof_per_year=2`, adicionar `rh_mean_porc` como covariável, usar população como offset, e declarar a definição CID. Idealmente, um template separado “respiratório agudo — DLNM semanal”.

---

#### 15. `ec-02-dengue-clima` — “Dengue e temperatura (Nordeste)”

**Especialista:** Epidemiologista de arboviroses / ecologia de vetores.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** SINAN-DENGUE Nordeste 2015–2019 → encoding/standardize → calendário → **agregação semanal** → `sus_spatial_join` → INMET 9 estados → `sus_climate_aggregate(distributed_lag, tair, 28 dias)` → DLNM (`n_casos`) → plot.

**Achados**

- **P0 — Não usa graus-dia.** É o achado central. O template usa temperatura do ar com lag distribuído; para dengue, a exposição biologicamente motivada é **GDD base 11 °C** (Aedes), acumulado em 3–12 semanas, e não a temperatura diária isolada. O catálogo já oferece `degree_days` e `temp_base`; o template não usa.
- **P0/P1 — Janela de 0–28 dias é curta.** O ciclo relevante (larva 7–10 dias + EIP 8–12 dias + incubação + notificação) aponta para **3–12 semanas**. Um lag máximo de 28 dias (4 semanas) trunca a cauda e mistura efeitos de curto prazo com o ciclo do vetor. Use 0–84 dias (12 semanas) ou lags semanais 0–12.
- **P1 — Âncora temporal ambígua.** O `date` do SINAN pode ser notificação, não primeiro sintoma. Para alinhar clima e infecção, use `first_symptoms_date`/`data_primeiros_sintomas` (o `sus_data_aggregate` aceita `date_col`) e discuta atraso de notificação. Sem isso, a exposição é deslocada.
- **P1 — Só temperatura.** Dengue depende de **chuva** (criadouros) e **umidade**; um modelo só com temperatura omite um determinante maior. Adicione chuva acumulada em 2–6 semanas (CHIRPS diário ou estações) e RH; considere amplitude térmica.
- **P1 — Agregação de 9 estados em uma série.** O DLNM agrega o desfecho por data (soma) e a exposição por média entre municípios (`sus_mod_dlnm.R`, Step 2). Isso é uma análise ecológica regional, não municipal. A transmissão é heterogênea (CE/PE/BA/MA vs interior), e a imunidade varia. Faça por estado/município e combine com `sus_mod_pool()` (duas etapas), ou pelo menos estratifique.
- **P1 — Período 2015–2019 inclui a epidemia de 2015–2016 e a ressurgência de 2019.** Imunidade de rebanho e anos epidêmicos dominam a série; sem indicadores de ano/epidemia, o efeito da temperatura pode capturar imunidade. Adicione termos de ano/epidemia ou estratifique.
- **P1 — Overdispersão.** O default é `quasipoisson`; o `negbin` do `sus_mod_dlnm` é **redirecionado para quasi-Poisson com aviso** (não é uma verdadeira binomial negativa). Para dengue, isso é uma limitação; reporte dispersão e faça sensibilidade com quasi-Poisson/negbin em R, ou implemente negbin real.
- **P1 — Semanas ausentes.** `sus_data_aggregate(complete_dates=FALSE)` (default do código) não preenche semanas sem casos; o DLNM assume espaçamento regular. Use `complete_dates=TRUE`.
- **P2 — `n_casos` vs documentação `n_dengue`.** O template está correto (`SINAN` → `n_casos` em PT), mas a documentação do DLNM lista `n_dengue`. Corrija a documentação para evitar erro do usuário.
- **P2 — Janela “ilustrativa”.** O texto já admite que 28 dias é ilustrativo; isso é bom, mas o padrão ainda é o que o usuário leigo vai rodar. Troque o default por uma faixa defendida (ex.: 42–84 dias) e ofereça 14/28/42/84 como sensibilidade.

**Correção recomendada (duas versões)**

**Versão A — biologicamente preferida (requer mudança no Motor):** `degree_days` com `window_days=28` e `temp_base=11`, gerando `gdd_w28tbase11`; depois DLNM sobre GDD (ou GLM com GDD + chuva). Hoje isso não é possível ponta-a-ponta porque `degree_days` não cria colunas `_lagN`.

**Versão B — workaround com o Motor atual (recomendado no curto prazo):**

1. `sus_data_import(SINAN-DENGUE, região/UF, 2015:2019)`.
2. `clean_encoding` → `standardize`.
3. `sus_data_create_variables(create_calendar_vars=TRUE)`.
4. `sus_data_aggregate(time_unit='week', group_by='codigo_municipio_residencia', complete_dates=TRUE, date_col='first_symptoms_date')`.
5. `sus_spatial_join`.
6. `sus_climate_inmet` (estados/anos) + `sus_climate_compute_indicators` (para obter `gdd_c` diário).
7. `sus_climate_aggregate(health_data=..., climate_data=..., temporal_strategy='distributed_lag', climate_var='gdd_c', lag_days='84')`.
8. `sus_mod_dlnm(outcome_col='n_casos', climate_col='gdd_c', dof_per_year=2)`.
9. `sus_mod_plot_dlnm(fit=...)`.
10. Adicionar chuva acumulada como segunda exposição/covariável (ou um segundo modelo).

**Declare no template:** `gdd_c` é calculado com `custom_thresholds` (base 11 °C, teto 35 °C); o atalho nativo `degree_days` → DLNM ainda não existe, então a exposição é montada via `sus_climate_compute_indicators` + `distributed_lag`.

---

#### 16. `ec-03-cardio-idosos-calor` — “Mortalidade cardiovascular em idosos e ondas de calor (SP)”

**Especialista:** Epidemiologista cardiovascular / calor.  
**Veredito:** 🟡 Aprovado com ressalvas.  
**Fluxo:** SIM-DO SP 2010–2019 → CID I → 60+ → agregação diária → `sus_spatial_join` → INMET → ondas de calor (ramo lateral) → `sus_climate_aggregate(distributed_lag, 21 dias)` → DLNM → AF → plot AF.

**Achados**

- **P1 — Referência = mediana, não MMT.** `sus_mod_dlnm` usa `ref_value = median(exposure)` quando `ref_value=NULL`; `sus_mod_af` usa esse valor como limiar. Para carga atribuível, a referência preferida é a **temperatura de mortalidade mínima (MMT)** ou um valor pré-especificado. A mediana pode deslocar a divisão calor/frio e inflar/atenua a AF. Defina `ref_value`/`threshold`.
- **P1 — Sem poluição do ar.** Calor e PM2.5/O3 são correlacionados e podem confundir/modificar o efeito cardiovascular. Adicione PM2.5 (GHAP) e O3 como covariáveis ou em modelo de sensibilidade.
- **P1 — Onda de calor não entra no modelo.** O template detecta ondas de calor em um ramo lateral e depois ajusta um DLNM de temperatura contínua. A narrativa sugere “efeito de onda de calor”, mas o modelo não tem indicador de onda. Ou modele o indicador, ou deixe claro que a onda é apenas descritiva.
- **P1 — Sem estratificação.** Idosos 60+ são heterogêneos (sexo, raça, renda, comorbidades). `sus_mod_sensitivity` existe; use por sexo/faixa etária/estrato socioeconômico.
- **P2 — `ns_df` automático = 40 para 10 anos**, ok para 3.650 dias, mas verifique sobreajuste e autocorrelação residual.
- **P2 — Janela de 21 dias** é razoável; para calor, inspecione 0–3 dias; para frio, 0–21. A curva de lag deve ser reportada.

**Correção recomendada:** definir MMT (ou `ref_value`), adicionar PM2.5/O3, separar “onda de calor” de “temperatura contínua”, rodar sensibilidade por subgrupo.

---

#### 17. `ec-04-hospitalizacoes-frio` — “Hospitalizações respiratórias e ondas de frio (Sul)”

**Especialista:** Epidemiologista de serviços de saúde / frio.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** SIH-RD Sul 2010–2019 → CID J09–J18 → agregação **diária por município** → `sus_spatial_join` → INMET → ondas de frio (ramo lateral) → plot → **ITS** com data `2013-07-23`.

**Achados**

- **P0 — ITS recebe tabela multi-município sem agregação.** `frio-spatial` tem uma linha por município-dia; `sus_mod_its()` **não agrega por data** e trata cada linha como observação independente. Isso infla `n`, encolhe os erros-padrão e produz pseudo-replicação. Agregue a série por data (soma regional) antes do ITS, ou ajuste um modelo por município.
- **P0 — `interruption_dates='2013-07-23'` é fictícia.** O próprio texto diz que é exemplo. Um ITS com data fictícia produz resultados sem sentido. Além disso, **ITS é para um evento/política específica**, não para ondas de frio recorrentes; use um indicador de onda de frio em uma série temporal (ou DLNM) para o efeito de exposição.
- **P1 — O frio não entra no modelo.** A detecção de ondas de frio é um ramo terminal; o ITS usa apenas a série de internações (sem temperatura/onda como regressor). O título promete “hospitalizações e ondas de frio”, mas o modelo não estima esse efeito.
- **P1 — Sem exposição climática integrada.** Não há `sus_climate_aggregate`; não é possível separar frio de sazonalidade/ tendência.
- **P1 — Sem denominador populacional.** Internações em contagem vs taxa; idosos e cobertura hospitalar variam.
- **P2 — Harmônicos = 2** pode não capturar sazonalidade respiratória; teste 3–4.
- **P2 — SIH-RD** tem mudanças de codificação e disponibilidade mensal; documente.

**Correção recomendada:** (a) agregar por data antes do ITS; (b) usar uma data real de evento/política, se o desenho for ITS; ou (c) trocar por um modelo de série temporal com indicador de onda de frio/temperatura abaixo do limiar e defasagens; (d) adicionar população como offset.

---

### 3.5 Modelagem

#### 18. `mod-dlnm` — “Modelagem DLNM a partir de dados preparados”

**Especialista:** Bioestatístico / DLNM.  
**Veredito:** 🟡 Aprovado com ressalvas.  
**Fluxo:** `sus_data_read` → `sus_mod_dlnm(outcome='n_obitos')` → plot → AF → plot AF.

**Achados**

- **P1 — Contrato de entrada não verificado.** `sus_mod_dlnm` exige colunas `{climate_col}_lagN` produzidas por `distributed_lag`; se a tabela veio de `moving_window`/`exact`, aborta. O template deveria dizer isso explicitamente e/ou adicionar um passo de checagem.
- **P1 — `outcome_col='n_obitos'` fixo.** Para dengue (`n_casos`) ou SIH (`n_internacoes`), o usuário recebe erro ou, pior, modela a coluna errada se houver `n_obitos` por engano. Parametrize.
- **P1 — `ns_df` automático = 4/ano.** Em séries curtas (5 anos), isso pode sobreajustar. Exponha `dof_per_year` e recomende 1–2 para séries curtas.
- **P1 — Sem binomial negativa real.** `family='negbin'` redireciona para `quasipoisson` com aviso. Para contagens overdispersas (dengue, internações), isso é uma limitação; reporte dispersão e faça sensibilidade.
- **P2 — Diagnósticos não são passo.** A função calcula dispersão e Ljung-Box, mas o template não mostra um “diagnóstico” no grafo. Adicione um nó de relatório/qualidade.
- **P2 — Sem sensibilidade/pool.** `sus_mod_sensitivity` e `sus_mod_pool` existem; um template de modelagem deveria mostrar pelo menos uma análise de sensibilidade.

**Correção recomendada:** tornar `outcome_col`/`climate_col` explícitos; validar `distributed_lag`; expor `dof_per_year`; adicionar diagnóstico e sensibilidade.

---

#### 19. `mod-espacial-bayes` — “Modelo Bayesiano espacial (por município)”

**Especialista:** Epidemiologista espacial.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** `sus_mod_spatial_weights(RN)` → `sus_data_read` → `sus_mod_spatial_bayes(outcome='n_obitos', W)` → `sus_mod_plot_spatial_bayes(RN)`.

**Achados**

- **P0 — Sem `offset`: modela contagens, não taxas/SMR.** `sus_mod_spatial_bayes` aceita `offset` (expected counts/população) e usa `log(offset)`; sem ele, o mapa reflete tamanho populacional, não risco. Adicione população/expected counts (o `sus_census_join` pode ajudar) e use SMR.
- **P0 — Múltiplas linhas por município viram “áreas” distintas.** A função faz `area_idx = seq_len(nrow(df))` e `n_areas = nrow(df)`. Se a tabela lida tem vários anos/meses por município, cada linha é uma “área” e a matriz W (municípios) não corresponde ao grafo. Agregue para **uma linha por município** (total do período) ou use `sus_mod_spacetime_bayes` para dados repetidos.
- **P1 — W e plot hardcoded para RN.** Se o usuário muda a UF na tabela, precisa mudar W **e** o plot; o template só comenta em W. Use o mesmo objeto `municipalities` nos dois passos.
- **P1 — Sem padronização por idade nem covariáveis.** Para mortalidade, padronize por idade (SMR) e inclua determinantes socioeconômicos/climáticos; a função suporta `covariates`.
- **P1 — Convergência MCMC não é checada.** `n_iter=10000`, `burnin=2000`, `thin=10` podem ser insuficientes; verifique Rhat/ESS, traceplots e sensibilidade de priors.
- **P2 — Ilhas/grafo desconexo.** Municípios ilha ou com vizinhança vazia podem quebrar o CAR/BYM; trate `zero.policy`/componentes.

**Correção recomendada:** uma linha por município; `offset` = população × taxa global (expected counts); W e plot com o mesmo `sf`; covariáveis; diagnóstico de convergência.

---

#### 20. `mod-casecrossover-its` — “Case-crossover e série temporal interrompida”

**Especialista:** Epidemiologista de inferência quase-experimental.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** `sus_data_read` → `sus_mod_casecrossover(exposure='tair_dry_bulb_c', lag=0)` → `sus_mod_its(data=read)`.

**Achados**

- **P0 — `sus_mod_its` sem `interruption_dates`.** O argumento é obrigatório e o template não o passa; a execução falha. Adicione uma data explícita (mesmo que placeholder, como em `ec-04`) ou remova o passo.
- **P0 — ITS em tabela multi-município sem agregação.** Como em `ec-04`, `sus_mod_its` não agrega por data; cada linha município-dia é tratada como observação independente. Agregue por data ou ajuste por município.
- **P0/P1 — Case-crossover com múltiplos municípios e `stratum='month'`.** O modelo condicional usa o mês como estrato, mas não inclui o município; com várias linhas por mês/município, ele compara municípios entre si, não dias de caso/controle dentro do mesmo município. Além disso, `make_lag_vec()` desloca a coluna inteira; se as linhas estão intercaladas por município, `lag > 0` fica errado. Ajuste por município (estrato = município × mês) ou agregue.
- **P1 — `lag=0` é insuficiente.** Efeitos agudos de calor/frio usualmente precisam de 0–3/0–21 dias; a função aceita vetor de lags, mas o template não usa.
- **P1 — Dois desenhos em um template.** Case-crossover e ITS respondem a perguntas diferentes (exposição aguda vs evento/política). Misturar confunde o usuário. Separe em dois templates.
- **P1 — `outcome_col` default `n_obitos`.** Se a tabela é de dengue/internações, falha ou modela errado.
- **P2 — `conditional_poisson` vs `clogit`** devem ser escolhidos pelo tipo de desfecho; documente.

**Correção recomendada:** separar; agregar por data; adicionar `interruption_dates` real; usar `stratum` por município; lags 0–3/0–21; definir `outcome_col`.

---

#### 21. `mod-ml-predicao` — “Machine learning para predição”

**Especialista:** Cientista de dados / ML em saúde.  
**Veredito:** 🔴 Requer correção.  
**Fluxo:** `sus_data_read` → `sus_mod_ml(outcome='n_obitos')` → `sus_mod_plot_ml`.

**Achados**

- **P0/P1 — Validação cruzada aleatória em série temporal.** `sus_mod_ml` usa k-fold; sem `id_col`, as dobras misturam municípios e tempos, vazando informação do futuro/vizinhos. O próprio argumento `id_col` existe para CV group-aware; use `id_col='codigo_municipio_residencia'` (ou `code_muni`). Idealmente, validação temporal bloqueada (treino no passado, teste no futuro).
- **P1 — Sem features de lag.** `sus_mod_ml` usa as colunas numéricas existentes; se a tabela é saúde + clima contemporâneo, o modelo não vê o efeito defasado. Adicione lags/rolling features (ou alimente uma tabela de `distributed_lag`, mas então selecione as colunas).
- **P1 — Sem validação externa/calibração.** OOF CV não é validação temporal; reporte calibração, RMSE/MAE por período e por município.
- **P1 — Importância de variável ≠ efeito causal.** XGBoost é preditivo; não use importância para afirmar risco causal. Combine com DLNM/análise de sensibilidade.
- **P1 — Contagens sem offset.** `count:poisson` modela contagens; para taxas, é preciso offset/base_margin (não exposto no template). Use população como feature ou modele taxas.
- **P2 — n pequeno vs 500 árvores/depth 6.** Com 5 anos e poucos municípios, regularize (depth 2–4, `min_child_weight` maior) e use CV temporal.

**Correção recomendada:** `id_col`, features de lag, validação temporal, calibração, e um alerta de que o ML é complementar ao DLNM, não substituto.

---

## 4. Achados transversais

### 4.1 O desenho temporal não é parametrizado pelo desfecho

O mesmo padrão (`tair_dry_bulb_c` + `distributed_lag` 21–30 dias) aparece em respiratório, dengue e cardiovascular. Isso é conveniente para a UI, mas epidemiologicamente incorreto. A matriz da seção 2.1 deveria virar **presets por desfecho** no Centro de Pipelines: ao escolher “Dengue”, o Studio propõe GDD/chuva/semanal; ao escolher “Respiratório”, propõe temperatura/umidade/PM2.5/diário; ao escolher “Cardiovascular”, propõe temperatura/MMT/poluição.

### 4.2 Exposição só de temperatura

Quase todos os templates usam apenas `tair_dry_bulb_c`. Faltam:

- **Dengue:** chuva, umidade, GDD.
- **Respiratório:** umidade, PM2.5, O3, RSV/influenza (proxy).
- **Cardiovascular:** PM2.5, O3.
- **Frio:** temperatura mínima, velocidade do vento, umidade.

O catálogo tem as variáveis; o problema é o desenho padrão.

### 4.3 Resolução do desfecho vs resolução do lag

- Mensal + lag diário (respiratório pediátrico) → colinearidade/identificação.
- Semanal + lag diário (dengue) → funciona, mas a janela biológica é truncada.
- Diário + lag diário (cardio/frio) → correto.
- Mensal + janela de 7 dias (integração) → exposição `NA`.

**Regra:** a unidade da janela/lag deve ser a mesma do desfecho, ou o desfecho deve ser reamostrado para a unidade da exposição.

### 4.4 Pseudo-replicação em modelos de série única

`sus_mod_dlnm` agrega por data; `sus_mod_its` e `sus_mod_casecrossover` **não**. Qualquer template que passe uma tabela multi-município para ITS/case-crossover está errado. Ou agregue por data (série regional) ou ajuste por município (modelo estratificado/pool).

### 4.5 Denominadores e offsets

- Mortalidade: use população/expected counts (SMR) no espacial e offset no modelo de contagem.
- Internações: idem, e considere cobertura hospitalar.
- Dengue: incidência por 100 mil, não contagem bruta; a população muda a interpretação entre municípios.

### 4.6 Qualidade da exposição

- Estações: distância máxima, falhas, representatividade urbana.
- Grade: resolução, agregação por área, unidades, cobertura de pixels.
- Fogo: foco ≠ fumaça; transporte/dispersão.
- Poluição: CAMS grosseiro; GHAP melhor para PM2.5.

### 4.7 Baselines de ondas

`baseline_start=NULL` usa a série inteira. Isso é circular e, com 10–14 anos, curto. Fixe um período de referência externo (1981–2010/1991–2020), documente a disponibilidade e faça sensibilidade.

### 4.8 Diagnósticos e sensibilidade não são passos

O Motor calcula dispersão, Ljung-Box, DIC etc., mas os templates não mostram um nó de diagnóstico. Um “Pipeline de modelagem responsável” deveria terminar com: diagnóstico + sensibilidade + (se multi-cidade) pool. `sus_mod_sensitivity`, `sus_mod_pool`, `sus_mod_metaregression` existem no catálogo e não são usados.

### 4.9 Inconsistências de documentação/catálogo

| Item | Onde | Problema |
|---|---|---|
| `n_dengue` vs `n_casos` | `docs/referencia-tecnica/05-etapa-analise-modelagem.qmd` e `arg-docs.ts` | O SINAN em PT produz `n_casos`; a doc lista `n_dengue`. |
| `complete_dates` | `sus_data_aggregate` | Doc diz default `TRUE`; código usa `FALSE`. |
| `time_unit` | `sus_climate_aggregate` | Doc diz “só relevante quando os dados são horários”; o código agrega sempre que `time_unit != 'day'`. |
| `negbin` | `sus_mod_dlnm` | O enum oferece `negbin`, mas ele é redirecionado para `quasipoisson` com aviso. |
| `sus_climate_fill_gap` | catálogo do Studio | Existe no pacote R, mas não no catálogo; não há nó de preenchimento de falhas. |

### 4.10 Placeholders apresentados como pipelines

Vários templates começam com `sus_data_read(path='')` ou usam datas fictícias. Isso é aceitável como “modelo didático”, mas o usuário não programador pode clicar em Executar e receber um erro opaco. O Studio deveria marcar visualmente “requer configuração” e explicar o que falta.

---

## 5. Backlog priorizado

### P0 — corrigir antes de divulgar como “pipeline”

1. **Dengue:** criar o caminho GDD (base 11 °C) + chuva + janela 3–12 semanas + âncora em primeiros sintomas + `complete_dates=TRUE` + `dof_per_year=2`.
2. **`clima-aggregate-exposicao`:** corrigir `time_unit`/`window_days`/`min_obs` para não gerar `NA`; separar “exposição aguda” de “exposição cumulativa”.
3. **ITS/case-crossover:** agregar por data ou estratificar por município; corrigir o lag por município; adicionar `interruption_dates` ao `mod-casecrossover-its`.
4. **`ec-04`:** agregar a série para ITS; substituir a data fictícia; modelar frio como exposição (não apenas ramo lateral).
5. **`mod-espacial-bayes`:** `offset` (expected counts/SMR) + uma linha por município + W/plot coerentes.
6. **Grids:** exigir `municipalities` (ou deixar claro que o retorno é raster/paths) em CHIRPS, ERA5, CAMS e queimadas.
7. **Respiratório pediátrico:** resolver a incompatibilidade mensal × lag diário; reduzir `ns_df`.

### P1 — corrigir na próxima iteração

8. Ondas de calor/frio: baseline fixo e externo; múltiplos métodos; sensibilidade.
9. Cardio: MMT/referência explícita; PM2.5/O3; separar onda de calor de temperatura contínua.
10. ML: `id_col`, features de lag, validação temporal, calibração.
11. DLNM: `outcome_col`/`climate_col` explícitos; validar `distributed_lag`; diagnóstico no grafo.
12. Estações: distância máxima, preenchimento de falhas, representatividade.
13. Denominadores/offsets em todos os modelos de contagem.
14. Adicionar `sus_climate_fill_gap` ao catálogo do Studio (se o Motor suportar).

### P2 — documentação e robustez

15. Corrigir `n_dengue`→`n_casos`, `complete_dates`, `time_unit`, `negbin` na documentação.
16. Marcar templates com placeholders como “requer configuração”.
17. Adicionar notas de “aproximação” para UTCI/PET/HI.
18. Adicionar um template de “diagnóstico + sensibilidade + pool”.
19. Revisar textos que prometem “por município” quando o passo não agrega.

---

## 6. Templates novos recomendados

### 6.1 “Dengue — graus-dia e chuva (semanal)”

- Import SINAN-DENGUE (UF/região, 2015–2022).
- Clean/standardize; calendário; `date_col='first_symptoms_date'`.
- Agregação semanal por município, `complete_dates=TRUE`.
- `sus_spatial_join`.
- INMET + indicadores (`gdd_c`) + CHIRPS diário (chuva acumulada).
- `sus_climate_aggregate(distributed_lag, climate_var='gdd_c', lag_days='84')`.
- `sus_mod_dlnm(outcome_col='n_casos', climate_col='gdd_c', dof_per_year=2)`.
- Plot DLNM; sensibilidade 28/56/84; pool por estado.

### 6.2 “Respiratório agudo — DLNM semanal”

- SIM/SIH, CID J09–J18/J20–J22, <5 anos (ou 60+ para outra pergunta).
- Agregação semanal por município, `complete_dates=TRUE`.
- Temperatura + umidade + PM2.5.
- `distributed_lag` 0–21 dias.
- DLNM com `dof_per_year=2`; offset populacional.

### 6.3 “Calor — DLNM diário com MMT e poluição”

- Mortalidade diária, temperatura máxima/média, PM2.5/O3.
- `distributed_lag` 0–21; `ref_value` = MMT.
- AF com `threshold` explícito; sensibilidade por subgrupo.

### 6.4 “Frio — exposição a ondas de frio (série temporal)”

- Internações/mortalidade diária; indicador de onda de frio (ou temperatura abaixo do limiar).
- Modelo com harmônicos + tendência + defasagens; ITS **somente** se houver um evento/política específica.

### 6.5 “Multicidade — DLNM em duas etapas”

- Ajustar DLNM por cidade/estado; `sus_mod_pool`; `sus_mod_plot_pool`.
- Reportar heterogeneidade (I²) e BLUPs.

### 6.6 “Espacial — SMR/BYM com offset”

- Uma linha por município; expected counts; W; BYM/BYM2; convergência; mapa de RR.

---

## 7. Quadro de especialistas

| Especialista | Pipelines | Competência central |
|---|---|---|
| Engenheiro de dados de saúde / curador DATASUS | 1 | Contratos, completude, codificação, qualidade |
| Epidemiologista de dados / séries temporais | 2, 3 | Agregação, resolução, completude |
| Climatologista / estações | 4, 5 | Falhas, representatividade, normais |
| Sensoriamento remoto / hidrometeorologia | 6 | CHIRPS, escala, agregação por área |
| Reanálise climática | 7 | ERA5, unidades, resolução |
| Epidemiologista de poluição do ar | 8 | CAMS/GHAP, exposição, confundimento |
| Saúde ambiental / fogo | 9 | Focos, fumaça, transporte |
| Epidemiologista ambiental / integração | 10 | Estratégias temporais, janelas |
| Biometeorologista | 11 | UTCI/WBGT/HI, validade |
| Epidemiologista de calor | 12, 16 | Ondas, MMT, carga |
| Epidemiologista de frio | 13, 17 | Ondas, limiares, ITS |
| Epidemiologista respiratório pediátrico | 14 | Sazonalidade viral, poluição, idade |
| Epidemiologista de arboviroses / vetores | 15 | GDD, chuva, imunidade, ciclos |
| Bioestatístico / DLNM | 18 | Crossbasis, df, overdispersion |
| Epidemiologista espacial | 19 | BYM, SMR, offset, convergência |
| Inferência quase-experimental | 20 | Case-crossover, ITS, estratos |
| Cientista de dados / ML em saúde | 21 | CV temporal, leakage, calibração |

---

## 8. Referências de apoio (métodos)

- Gasparrini A, Armstrong B, Kenward MG. Distributed lag non-linear models. *Statistics in Medicine*. 2010;29(21):2224–2234.
- Gasparrini A. Distributed lag linear and non-linear models in R: the package dlnm. *Journal of Statistical Software*. 2011;43(8):1–20.
- Guo Y, et al. Global variation in the effects of ambient temperature on mortality: a systematic evaluation. *Epidemiology*. 2014;25(6):781–789.
- Anderson BG, Bell ML. Weather-related mortality: how heat, cold, and heat waves affect mortality in the United States. *Epidemiology*. 2009;20(2):205–213.
- Xu Z, et al. Impact of heatwave on mortality under different heatwave definitions: a systematic review and meta-analysis. *Environment International*. 2016;89–90:193–203.
- Nairn JR, Fawcett RJB. The excess heat factor: a metric for heatwave intensity and its use in classifying heatwave severity. *International Journal of Environmental Research and Public Health*. 2015;12(1):227–253.
- Rothfusz LP. The heat index equation. *NWS Technical Attachment SR/SSD 90-23*. 1990.
- Bhatt S, et al. The global distribution and burden of dengue. *Nature*. 2013;496:504–507.
- Brady OJ, et al. Modelling adult *Aedes aegypti* and *Aedes albopictus* survival at different temperatures in laboratory and field settings. *Parasites & Vectors*. 2013;6:351.
- Mordecai EA, et al. Detecting the impact of temperature on transmission of Zika, dengue, and chikungunya using mechanistic models. *PLoS Neglected Tropical Diseases*. 2017;11(4):e0005568.
- Lowe R, et al. Combined effects of hydrometeorological hazards and urbanisation on dengue risk in Brazil: a spatiotemporal modelling study. *The Lancet Planetary Health*. 2021;5(4):e209–e219.
- WHO. Heatwaves and health: guidance on warning-system development. Geneva: World Health Organization; 2015 (e atualizações).

> As referências acima sustentam os **princípios de desenho** (DLNM, lag, GDD, ondas, MMT). Elas não foram usadas para calibrar parâmetros específicos deste parecer; os valores citados (ex.: 11 °C para Aedes, 3–12 semanas) são faixas biológicas/usual practice e devem ser justificados caso a caso.

---

## 9. Limitações deste parecer

- **Não houve execução** dos pipelines com dados reais. Os achados de “tende a `NA`”, “aborta” e “pseudo-replicação” vêm da leitura do código R e dos contratos das funções; recomenda-se um teste de fumaça com um recorte pequeno (ex.: RN, 1 ano) para confirmar cada P0.
- **O código R pode mudar** independentemente do Studio; a avaliação reflete a versão disponível em `/Users/co2map/Documents/2026/CLIMASUS4r/climasus4r` na data.
- **Escolhas de parâmetro** (janelas, bases, limiares) são pontos de partida; a literatura específica de cada desfecho deve prevalecer.
- **Não foi feita revisão de UI/UX**, apenas de desenho epidemiológico e contrato de função.

---

### Apêndice — como reproduzir a auditoria

1. Listar os templates: `src/pipelines/templates.ts` e `src/templates/*.ts`.
2. Conferir cada `fn`/`values` contra `src/catalog/functions.json`.
3. Para funções críticas, ler o R correspondente:
   - `R/sus_climate_aggregate.R` (`.join_moving_window`, `.join_distributed_lag`, `.join_degree_days`, `.match_spatial`).
   - `R/sus_mod_dlnm.R` (agregação por data, `ns_df`, `family`).
   - `R/sus_mod_its.R` e `R/sus_mod_casecrossover.R` (ausência de agregação/estratos).
   - `R/sus_mod_spatial_bayes.R` (`area_idx`, `offset`).
   - `R/sus_mod_ml.R` (`id_col`, CV).
4. Teste de fumaça sugerido: um recorte de 1 UF e 1 ano, com `complete_dates=TRUE`, para cada P0.
