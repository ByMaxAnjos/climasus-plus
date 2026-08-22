# Auditoria pré-remoção do "(Beta)" — climasus+ Studio v1.0.0

Consolidação das Fases 1–3 (mapeamento de arquitetura, levantamento de bugs, verificação adversarial). Todos os itens da seção 2 passaram por reabertura de código e foram marcados `CONFIRMED` por um segundo agente; os itens da seção 5 foram descartados na mesma verificação.

## 1. Resumo executivo

- **127 bugs confirmados** (verificados adversarialmente contra o código real, não apenas relatados), **7 bugs refutados** (mecanismo não se sustenta — ver apêndice), **1 correção já aplicada e confirmada presente** (TLS Windows em `engine/start.R`, com lacuna residual documentada).
- Distribuição por severidade (contagem aproximada dos itens confirmados): **4 critical**, **~60 high**, **~45 medium**, **~18 low**.
- Distribuição por plataforma: a grande maioria (~85%) é **"all"** — bugs de lógica em TypeScript/React (catálogo, Inspector, serializador `toR()`) ou em R puro, sem nenhuma condicional de SO. Um subconjunto real e recorrente (~15 itens) é **Windows-specific**, quase todo do mesmo tipo: downloads que passam por `httr2`/pacote `curl` ou por `curl.exe`/`wget.exe` externos, que **não são cobertos** pelo fix de TLS revocation já aplicado em `engine/start.R` (esse fix cobre apenas `download.file()`/`url()` de R base).
- **Recomendação: NO-GO para remover o "(Beta)" no estado atual.** Os 4 bugs critical e a maior parte dos ~60 high são da mesma família estrutural — o **modelo de pipeline do Studio suporta apenas uma cadeia linear com uma entrada por passo**, mas várias famílias de funções do climasus4r (climático, modelagem espaço-temporal, modelagem Bayesiana, SWOT, pooling multi-cidade) exigem **dois ou mais objetos de entrada**. Isso torna nós inteiros do catálogo — incluindo praticamente toda a família `sus_mod_spatial_*`, `sus_mod_spacetime_*`, `sus_mod_pool`, `sus_mod_burden`, `sus_mod_swot`, `sus_grid_join` — **inutilizáveis pela UI visual** hoje, não apenas com bugs cosméticos. Corrigir isso exige uma mudança de arquitetura (mecanismo de fan-in/referência a variável de outro passo), não patches pontuais.

## 2. Bugs confirmados

### 2.1 Critical

**A. Modelo de pipeline de entrada única bloqueia toda função que exige 2+ objetos** — *todas as plataformas*
O grafo do Studio (`src/store/pipeline.ts::buildSteps()`) rastreia uma única variável aberta (`openVar`) por vez, e `pipeArg()` (`src/catalog/index.ts:74-77`) só reconhece o **primeiro** argumento de uma função como encadeável. Qualquer argumento adicional que precise ser um objeto R (não um literal) cai num `<input>` de texto livre; o serializador `toR()` (`pipeline.ts:375-382`) envolve qualquer identificador digitado em aspas, transformando-o numa string R em vez de uma referência ao objeto. O R então rejeita a string com `inherits(x, "classe") == FALSE`.
Funções afetadas (uma amostra representativa, não exaustiva): `sus_climate_aggregate` (climate_data), `sus_climate_anomaly` (normals), `sus_mod_burden`/`sus_mod_pool`/`sus_mod_sensitivity`/`sus_mod_metaregression` (fits, lista nomeada de vários fits), `sus_mod_spacetime_bayes` (W), `sus_mod_spatial_bayes`/`sus_mod_spatial_moran`/`sus_mod_spatial_reg`/`sus_mod_spatial_scan` (W ou municipalities), `sus_mod_plot_spatial_bayes`/`sus_mod_plot_spacetime`/`sus_mod_plot_spatial_moran`/`sus_mod_plot_spatial_scan` (municipalities), `sus_mod_swot` (af/burden/dlnm/sensitivity), `sus_mod_vulnerability_index` (sensitivity_df/adaptive_capacity_df/fits), `sus_grid_join` (grid_data), `sus_grid_chirps`/`sus_grid_era5`/`sus_grid_pdsi`/`sus_grid_prodes`/`sus_grid_smvi` (municipalities sf), `sus_mod_spatial_weights` (saída não consumível por nenhum passo seguinte).
**Correção:** introduzir um tipo de argumento "referência a passo anterior" no `ArgSpec` e um mecanismo de fan-in no grafo (nó pode ter N entradas nomeadas, não só uma); serializar como identificador R puro (sem aspas) quando o valor referenciar um passo existente.

**B. `sus_data_export`: `switch()` com caso duplicado sempre falha para `.parquet` quando `format=NULL`** — *todas as plataformas*
`R/sus_data_export.R:184-190`: `switch(ext, "rds"="rds", "parquet"="arrow", "parquet"="parquet", ...)` — o R usa o **primeiro** caso que casa, então `"parquet"` resolve para `"arrow"`, que não está em `valid_formats` (linha 207) e sempre aborta. Como o Inspetor não pré-preenche defaults (campo fica vazio até o usuário digitar), este é o caminho padrão de uso.
**Correção:** remover o caso `"parquet"="arrow"` duplicado/morto do `switch()`.

**C. `sus_mod_spatial_reg`: `formula` sempre citada como string, função nunca roda pela UI** — *todas as plataformas*
`toR()` só deixa um valor sem aspas se ele começar com `~` ou contiver parênteses. O único exemplo documentado (`deaths ~ mean_temp + precip`) não começa com `~` e não tem parênteses, então é sempre enviado como string `"deaths ~ ..."`; a função valida `inherits(formula, "formula")` e aborta sempre.
**Correção:** em `toR()`, também tratar como código R bruto qualquer string que contenha `~` em qualquer posição (não só no início).

**D. `sus_mod_plot_spatial_bayes` / `sus_mod_plot_spatial_moran`: catálogo corrompe `municipalities` num enum com valores do argumento `type`** — *todas as plataformas*
`functions.json` lista `municipalities` (que deve ser um objeto `sf`) como `type: "enum"`, `options: ["uncertainty","both"]` (spatial_bayes) / `["map","both"]` (spatial_moran) — claramente vazados do argumento vizinho `type`. Combinado com o bug A, não existe **nenhum** valor que o usuário possa colocar nesse campo que funcione — nem mesmo digitando manualmente.
**Correção:** corrigir o gerador de catálogo para não vazar `options` entre argumentos vizinhos, e retipar `municipalities` como `text` (ou o novo tipo "referência a passo", ver item A) em ambas as funções.

### 2.2 High

**Catálogo confunde exemplos ilustrativos do roxygen (`e.g., "x", "y"`) com um enum fechado**, bloqueando qualquer valor real fora dos 2–4 exemplos citados na documentação. É o padrão de bug mais frequente do audit (raiz provável: heurística do gerador de catálogo que extrai qualquer string entre aspas próxima ao `@param`). Ocorre em:
`sus_data_aggregate` (value_col), `sus_data_filter_cid` (icd_codes), `sus_data_filter_demographics` (sex — só 2 de 8 valores válidos; city — só 4 de 5000+ municípios), `sus_data_import` (city), `sus_data_plot_aggregate_ts` (group_col), `sus_data_quality_report` (output_file — opções erradas "markdown"/"html" em vez de um caminho), `sus_climate_plot_coldwaves` (method — só EHF/INMET de 7 valores válidos), `sus_climate_plot_aggregate` (outcome_col), `sus_mod_casecrossover` (exposure_col/outcome_col), `sus_mod_dlnm` (outcome_col), `sus_mod_its` (covariates — bloqueia inclusive múltiplos covariáveis), `sus_mod_spacetime_exceedance` (aggregate_time — oferece 2 valores que a função rejeita), `sus_mod_spatial_bayes` (outcome), `sus_mod_spatial_moran` (outcome), `sus_grid_koppen` (koppen_sf — deveria ser objeto sf, não string "Af"/"Am").
**Correção (comum a todos):** retipar esses argumentos como `text` no catálogo, ou adicionar ao Inspector um modo "enum aberto" (combobox com sugestões + entrada livre).

**`raster_area` tipado como `boolean`, escondendo os modos válidos "código de UF" / objeto `sf`** — todas as plataformas. Afeta `sus_grid_chirps`, `sus_grid_era5`, `sus_grid_pdsi`, `sus_grid_pollution_ghap`, `sus_grid_pollution_merra2`. O Inspetor renderiza booleanos como `<select>` fixo TRUE/FALSE, ignorando `arg.options`.
**Correção:** novo tipo de arg (`union`/`text-or-boolean`) no catálogo + Inspector.

**Gap de TLS/rede no Windows não coberto pelo fix já aplicado** — *Windows*. `engine/start.R` (linhas 11-14, confirmado presente) seta `R_LIBCURL_SSL_REVOKE_BEST_EFFORT` apenas para o backend libcurl embutido em `download.file()`/`url()` de R base. Qualquer download que passe por `httr2`/pacote `curl` (binding libcurl separado) ou por binários externos `curl.exe`/`wget.exe` **não é coberto**: `sus_climate_inmet` (fallback httr2/httr/curl-bin/wget-bin), `sus_data_filter_demographics` (download do `municipio_meta.parquet` via leitor remoto do Arrow), `sus_data_import` (microdatasus usa pacote `curl` diretamente), `sus_grid_fires` (httr2 para INPE/FIRMS), `sus_grid_pollution_merra2` (httr2/curl.exe), `sus_grid_prodes` (httr2 para WFS). Este é muito provavelmente a causa raiz do bug relatado pelo tester em `tests.md` ("nenhum produto/camada baixava" no Windows).
**Correção:** ou (a) confirmar experimentalmente se o pacote `curl` honra a env var nessa versão e, se não, replicar a configuração via `curl::handle_setopt()`/opção equivalente antes de cada chamada httr2/curl nessas 6 funções; ou (b) documentar como limitação conhecida do Beta e resolver antes do GA.

**Crashes/erros de baixo nível em vez de mensagens claras (dado de entrada válido no fluxo normal, sem cli_abort):**
- `sus_data_standardize`: `translations` nunca é atribuído no backend tibble para sistema de saúde não reconhecido (`UNKNOWN`) → `object 'translations' not found`.
- `sus_data_import`: `available_muni_codes` referenciado mas nunca definido no backend tibble → `object not found` num cenário de 0 linhas após filtro por município.
- `sus_data_ts_quality`: datas `NA` numa série silenciam para `if(NA)` → `missing value where TRUE/FALSE needed`.
- `sus_mod_excess`: `study_period` sem correspondência → `which.max()` num vetor vazio → erro genérico do R.
- `sus_mod_ml`: `nfold` reduzido localmente dentro do helper de CV não propaga para o loop externo → `subscript out of bounds` depois de já ter pago o custo computacional do `xgb.cv`.
- `sus_mod_plot_swot` e `sus_mod_plot_vulnerability`: `output_type="all"` retorna uma `list()` simples que o classificador de artefatos do motor (`engine/api.R::classify()`) não reconhece — cai no fallback de texto genérico, sem plot/tabela nenhum.
- `sus_mod_plot_dlnm`: branch de salvar (`save_plot`) decide `ggsave()` vs `saveWidget()` pela **extensão do arquivo**, não pela classe real do objeto — `type="surface"` com `interactive=TRUE` só produz plotly, então salvar com extensão `.png` chama `ggsave()` num objeto plotly e falha.
**Correção comum:** adicionar guardas explícitas (`is.na`, checagem de comprimento zero, checagem de classe) antes das operações que assumem dado bem formado, convertendo para `cli_abort()` com mensagem localizada; no caso do classify(), adicionar um branch para `list` genérica contendo `$plot`/`$table`.

**Bugs de wiring adicionais de severidade high** (mesma família do item A, mas cada um com uma manifestação específica que vale registrar): `sus_grid_chirps`/`sus_grid_join`/`sus_grid_prodes`/`sus_grid_smvi`/`sus_mod_spatial_weights`/`sus_mod_pool`/`sus_mod_burden`/`sus_mod_swot`/`sus_mod_vulnerability_index`/`sus_mod_spacetime_bayes` — ver item A para a causa raiz comum.

**Outros high isolados:**
- `sus_data_cid_select` e `sus_socio_list_indicators`: como o primeiro argumento não é um "df" reconhecido (`lang`), o gerador de passos (`buildSteps`) trata a função como uma **nova fonte de dados**, silenciosamente sequestrando a variável da cadeia para qualquer passo seguinte da mesma família — corrompe o pipeline sem aviso.
- `sus_grid_plot`: `layer="all"` (modo de facetar documentado) é catalogado como `type: "number"`; a validação de UI rejeita "all" como `invalidNumber`, bloqueando o Run.
- `sus_data_plot_demographics`: `interactive=TRUE` é ignorado silenciosamente quando `type="dashboard"` — sempre produz imagem estática mesmo pedindo interativo.
- `sus_data_filter_demographics`: download crítico de metadados espaciais via leitor remoto do Arrow sem `tryCatch` — falha de rede sobe como erro bruto, e o fallback arrow→tibble repete o mesmo download falho antes do erro final.
- Vários casos Windows-específicos de caminho com backslash não escapado em `toR()` (`sus_climate_inmet` cache_dir, `sus_data_plot_demographics` save_path) — R rejeita `\U`/`\m` como escape inválido.

### 2.3 Medium

Agrupados por tema (lista de funções afetadas entre parênteses):
- **Vetores/fórmulas exigem sintaxe R crua em campo de texto livre**, sem validação — silenciosamente citados como string pelo serializador se o usuário não usar `c(...)`/parênteses (`sus_climate_aggregate` offset_days/lag_days, `sus_mod_its` interruption_dates, `sus_mod_casecrossover` covariates/lag).
- **Argumentos numéricos catalogados como `text`** (por causa do sufixo `L` no default, ex. `"1000L"`) — perdem a validação numérica que já existe para `type: "number"`, e digitar o próprio placeholder gera erro de coerção silenciosa ou crash (`sus_mod_af` nsim, `sus_mod_ml` nrounds/max_depth/nfold/early_stopping/seed, `sus_mod_pool` n_grid, `sus_mod_plot_ml` n_top, `sus_mod_plot_pool`/`sus_mod_plot_sensitivity` base_size, `sus_mod_spatial_weights` snap).
- **Validação condicional ausente**: argumentos obrigatórios apenas sob certas combinações de outros argumentos não são bloqueados no Run (`sus_climate_aggregate` window_days/lag_days/offset_days/threshold_value conforme temporal_strategy).
- **Avisos de fallback/degradação só aparecem no console R, não na UI** (contorno de mapa ausente por falha do geobr; `no2`/`so2` descartado em `sus_grid_pollution_ghap`/`merra2`; método de match_type "chapter"/"fuzzy" caindo silenciosamente para "starts_with" em `sus_data_filter_cid`; subtítulo/legenda perdidos no fallback bubble map de `sus_data_plot_aggregate_map`).
- **Windows-specific**: orphan de processos filhos (`curl.exe`/`wget.exe`/workers `future`) não mortos ao fechar o app em `sus_climate_uniplu`, `sus_data_read` (parallel=TRUE); `sus_data_quality_report` grava relatório no cwd herdado do processo, sem tratamento se não for gravável.
- **Outros**: `sus_climate_normals` deixa `options(HTTPUserAgent=...)` global sem restaurar (afeta downloads não relacionados na mesma sessão); `sus_climate_uniplu` faz `collect()` antes de filtrar (carrega dataset nacional de 140 anos inteiro em RAM); `sus_data_aggregate` tem dead code no backend tibble que deveria filtrar `geo_col` (inconsistente com o backend arrow); `sus_data_export` tem enum de `format` com valores errados/faltantes (`"arrow"`/`"GeoPackage"` em vez de `"parquet"`/`"gpkg"`); `sus_mod_metaregression` mistura mensagens de erro traduzidas e hardcoded em inglês, ignorando `lang`.

### 2.4 Low

Principalmente ruído de geração de catálogo sem efeito funcional hoje (arrays `options` órfãos em argumentos `boolean`/`text`, onde o Inspector já ignora `options` para esses tipos — `sus_climate_inmet`, `sus_grid_era5`, `sus_grid_join`, `sus_mod_dlnm`), inconsistências de i18n (`sus_data_clean_encoding` mensagem truncada por assinatura errada de `cli_alert_warning()`; `sus_mod_plot_ml` placeholder de gráfico hardcoded em inglês; `sus_socio_compute_indicators` token literal `"[%s]"` no histórico por confundir `glue()` com `sprintf()`), e limitações documentadas mas não expressas no catálogo (`sus_climate_uniplu` `network` deveria ser multi-seleção; `sus_data_aggregate` `time_unit` restrito a 11 valores quando aceita qualquer período do `lubridate::floor_date`).

## 3. Melhorias sugeridas (não são bugs — não passaram por verificação adversarial)

### Alta prioridade
- Corrigir a heurística do **gerador de catálogo** para não promover exemplos do roxygen a enum fechado para argumentos de nome de coluna/vetor livre — causa raiz de uma dezena de bugs "high" listados acima.
- Adicionar ao pipeline um **mecanismo de fan-in/referência a passo anterior** antes do GA — sem isso, famílias inteiras do catálogo (`sus_mod_spatial_*`, `sus_mod_spacetime_*`, `sus_mod_pool`, `sus_mod_burden`, `sus_mod_swot`, `sus_grid_join`) continuam inacessíveis pela UI.
- Reforçar `covariates` de `sus_mod_its` como `text` livre (não enum) para pelo menos permitir o caso de uso documentado de múltiplos covariáveis.

### Média prioridade
- Dar aos campos multi-valor (datas, covariáveis, pesos) um afordance de UI (chip/tag input) em vez de exigir sintaxe R crua digitada num `<input>` de texto simples.
- Impedir que funções cujo primeiro argumento não é "dado encadeável" (ex. `lang`) sejam adicionadas como fonte de um pipeline, ou ao menos avisar visualmente.
- Promover avisos de fallback do R (contorno ausente, pacote de rede indisponível, poluente descartado) para o painel de resultado, não apenas para o console de texto.
- Confirmar no build Linux/Windows se `INLA`, `mvmeta` e `httr2` estão de fato empacotados, dado que várias funções de modelagem espaço-temporal dependem deles sem fallback gracioso testado.

### Baixa prioridade
- Limpeza de metadados órfãos (`options` em campos `boolean`/`text`) no catálogo gerado.
- Padronizar mensagens de erro localizadas (`cli_abort`/`lang`) em vez de `stop()`/strings hardcoded em inglês nos pontos remanescentes.
- Adicionar hints inline mostrando a sintaxe R esperada (`c("a","b")`, `~`) diretamente no placeholder dos campos afetados.

## 4. Funções `sus_*` fora do catálogo do Studio

**Parecem realmente faltando (gap de produto):**
- `sus_spatial_join` — junta município/escola/etc. via geobr; não há equivalente no catálogo (que só tem `sus_grid_join`, uma função diferente).
- `sus_census_join` — enriquecimento socioeconômico via variáveis censitárias; também ausente.

**Borderline, decisão de produto (não bloqueante):**
- `sus_census_select` — explorador interativo de códigos de variáveis censitárias (não transforma `df`); poderia valer um nó tipo "consulta", mas defensável como não catalogado.
- `sus_climate_inmet_select` — no código-fonte atual está marcada `@noRd` e **não está no `NAMESPACE`** (não exportada nesta versão); pode ser divergência de versão do pacote instalado localmente vs. a lista original do briefing.

**Infraestrutura interna, corretamente fora do catálogo:** `sus_as_arrow`, `sus_as_duckdb`, `sus_cache_clear`, `sus_cache_info`, `sus_chat`, `sus_install_deps`, `sus_meta`, `sus_welcome`, e toda a família `sus_rap_*` (subsistema de "reproducible analytical pipeline"/targets, não é um passo de pipeline visual).

## 5. Apêndice — bugs reportados e refutados (transparência)

Os itens abaixo foram levantados na Fase 2 mas **não se sustentaram** na verificação adversarial (mecanismo técnico citado não reproduz no código real ou foi empiricamente contradito). Mantidos aqui apenas para registro, sem detalhamento adicional:

1. `sus_climate_compute_indicators` — suposto bypass do fix de TLS no Windows via Arrow: refutado, o download real passa por `download.file()` e é coberto pelo fix.
2. `sus_data_create_variables` — suposta corrupção silenciosa com `climate_region` inválido: refutado, o código real lança erro (`subscript out of bounds`) em vez de produzir NAs silenciosos.
3. `sus_data_import` — suposta "validação amigável nunca executada": refutado, `missing()` propaga corretamente através do encadeamento de chamadas em R.
4. `sus_data_plot_aggregate_map` — suposto erro de correspondência por `period` malformado: refutado, `as.Date()` faz parsing tolerante e não produz o cenário descrito.
5. `sus_grid_fires` — suposto cache permanente de falha de rede como "sem focos": refutado, o arquivo sentinela tem 0 bytes e nunca satisfaz a condição de cache-hit.
6. `sus_mod_af` — suposta corrupção silenciosa de AF/AN com `range` mal formatado: refutado para os exemplos citados (o R lança erro); existe uma variante real com `10:30`, não reportada como tal.
7. `sus_mod_plot_spatial_bayes` — suposta falha de artefato quando `patchwork` está ausente: mecanismo de código existe, mas `patchwork` está sempre empacotado nos três instaladores — condição de gatilho nunca ocorre em produção.
