# Como adicionar resultados reais ao guia

Este documento é interno (não entra no build). Ele descreve o caminho para o guia
`book/` deixar de mostrar apenas números simulados e passar a mostrar **resultados
reais, congelados e reproduzíveis** dos pipelines: banco de dados, tabelas, figuras e
interpretação.

## Princípio

O guia deve mostrar resultados **executados uma vez**, com dados e Parâmetros fixos, e
**congelados** como artefatos. O build do Quarto não deve baixar DATASUS/INMET nem rodar
modelos: ele apenas inclui os arquivos gerados. Assim o guia fica determinístico,
auditável e rápido.

Três camadas:

1. **Dados** — uma fotografia analítica agregada (não o microdado bruto) + dicionário.
2. **Resultados** — tabelas e figuras exportadas do Studio ou de um script R.
3. **Texto** — interpretação ligada a cada figura, com limites explícitos.

## Estrutura de arquivos sugerida

```
book/
├── data/
│   ├── README.md                 # fontes, filtros, data de acesso, checksum
│   ├── codebook.csv              # variável, descrição, unidade, fonte
│   └── ec02/
│       ├── analytic.parquet      # tabela agregada saúde × clima
│       └── sample.csv            # 10 linhas para exibição no capítulo
├── images/results/
│   └── ec02/
│       ├── serie.png
│       ├── dlnm_slice.png
│       ├── dlnm_3d.png
│       ├── af.png
│       └── mapa.png
├── tables/results/
│   └── ec02/
│       ├── amostra.csv
│       ├── descriptiva.csv
│       └── modelo.csv
├── results/
│   └── ec02.json                 # parâmetros, N, versões, checksum, avisos
└── scripts/
    ├── 00-setup.R
    ├── 01-run-ec01.R
    ├── 02-run-ec02.R
    ├── 03-run-ec03.R
    ├── 04-run-ec04.R
    └── run-all.R
```

## Passo 1 — executar e exportar

### Opção A — pelo Studio (mais simples)

1. Abra o Modelo no **Centro de Pipelines**.
2. Fixe território, período e Parâmetros. Anote tudo (o guia precisa repetir).
3. Execute o Pipeline.
4. No painel **Resultados**, exporte:
   - tabelas em **CSV/XLSX/Parquet**;
   - gráficos em **PNG/SVG/HTML**.
5. Salve os artefatos em `book/images/results/<caso>/` e `book/tables/results/<caso>/`.
6. Exporte o código `.R` do Pipeline e salve em `book/scripts/<caso>.R` para
   reprodutibilidade.

Vantagem: usa exatamente o que o usuário vê. Limite: o export manual é fácil de
desatualizar; registre a data e os Parâmetros.

### Opção B — por script R (recomendado para o guia)

O script chama as mesmas funções do Motor e grava todos os artefatos de uma vez. Esqueleto:

```r
# book/scripts/00-setup.R
suppressPackageStartupMessages({
  library(climasus4r)
  library(dplyr)
  library(readr)
  library(ggplot2)
  library(jsonlite)
})

dir_create <- function(path) if (!dir.exists(path)) dir.create(path, recursive = TRUE)

save_meta <- function(case, params, data, warnings = character()) {
  dir_create("results")
  meta <- list(
    case = case,
    generated_at = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z"),
    studio_version = "1.1.0-beta.1",
    climasus4r_version = as.character(packageVersion("climasus4r")),
    r_version = R.version.string,
    params = params,
    n_records = nrow(data),
    n_municipalities = dplyr::n_distinct(data$code_muni %||% data$codigo_municipio_residencia),
    data_checksum = tools::md5sum("data/ec02/analytic.parquet")[[1]],
    warnings = warnings
  )
  jsonlite::write_json(meta, sprintf("results/%s.json", case), pretty = TRUE, auto_unbox = TRUE)
}
```

O corpo de cada caso segue os Passos do Modelo. Para dengue (ec-02):

```r
# book/scripts/02-run-ec02.R
source("book/scripts/00-setup.R")
dir_create("data/ec02"); dir_create("images/results/ec02"); dir_create("tables/results/ec02")

dados <- sus_data_import(
  system = "SINAN-DENGUE",
  uf = c("CE", "PE", "BA", "MA"),
  year = 2015:2019
) |>
  sus_data_clean_encoding() |>
  sus_data_standardize() |>
  sus_data_create_variables(create_calendar_vars = TRUE) |>
  sus_data_aggregate(
    time_unit = "week",
    group_by = "codigo_municipio_residencia",
    complete_dates = TRUE,
    date_col = "data_primeiros_sintomas"
  ) |>
  sus_spatial_join()

clima <- sus_climate_inmet(years = 2015:2019, uf = c("CE", "PE", "BA", "MA")) |>
  sus_climate_compute_indicators(
    indicators = "gdd",
    custom_thresholds = list(gdd_base = 11, gdd_upper = 35)
  )

integrado <- sus_climate_aggregate(
  health_data = dados,
  climate_data = clima,
  climate_var = "gdd_c",
  temporal_strategy = "distributed_lag",
  lag_days = 84
)

saveRDS(integrado, "data/ec02/analytic.rds")
arrow::write_parquet(as.data.frame(integrado), "data/ec02/analytic.parquet")
readr::write_csv(head(as.data.frame(integrado), 10), "tables/results/ec02/amostra.csv")

ajuste <- sus_mod_dlnm(
  integrado,
  outcome_col = "n_casos",
  climate_col = "gdd_c",
  dof_per_year = 2
)

# tabelas
readr::write_csv(as.data.frame(ajuste$summary), "tables/results/ec02/modelo.csv")
# figuras: exporte pelo painel do Studio ou salve o objeto gráfico com ggsave()
# ggsave("images/results/ec02/dlnm_slice.png", plot = ..., width = 8, height = 5, dpi = 300)

save_meta("ec02", params = list(
  uf = c("CE", "PE", "BA", "MA"), years = "2015:2019",
  outcome = "n_casos", exposure = "gdd_c", base = 11, upper = 35, lag_days = 84
), data = integrado)
```

> **Atenção:** os nomes de componentes do objeto `climasus_dlnm` (por exemplo,
> `ajuste$summary`) variam; confira `str(ajuste)` e exporte as tabelas que o painel
> **Resultados** mostra. Para figuras, o caminho mais fiel é exportar PNG/SVG pelo
> próprio Studio; o script pode usar `ggplot2::ggsave()` quando o objeto for `ggplot`.

## Passo 2 — o banco de dados

Não coloque o microdado bruto do DATASUS no repositório do guia. Ele é grande, muda de
versão e expõe campos sensíveis. Mostre:

- **fonte e filtros**: sistema, UF, anos, CID, idade, sexo, município;
- **N**: registros brutos, registros após filtros, municípios, semanas/dias;
- **completude**: % de semanas/dias sem registro, % de municípios sem estação;
- **dicionário**: `data/codebook.csv` com variável, descrição, unidade e fonte;
- **amostra**: 10 linhas **agregadas** em `tables/results/<caso>/amostra.csv`;
- **checksum**: MD5/SHA256 do Parquet em `results/<caso>.json`;
- **script de download**: `book/scripts/download-data.R` com URLs e data de acesso.

No capítulo, exiba a amostra com `knitr::kable()` e o dicionário resumido. O banco
completo fica no Parquet agregado (`data/<caso>/analytic.parquet`), não no texto.

Exemplo de seção:

```markdown
## Dados usados

**Fonte:** SINAN-DENGUE (DATASUS), UFs CE, PE, BA e MA, 2015–2019.
**Recorte:** casos notificados; semana epidemiológica; data de primeiros sintomas.
**N:** 000.000 notificações; 000 municípios; 000 semanas.
**Completude:** 00% das semanas com registro; 00% dos municípios com estação a menos de 50 km.
**Snapshot:** `data/ec02/analytic.parquet` (SHA256 `...`), gerado em 2026-10-25.

```{r}
#| echo: false
#| tbl-cap: "Primeiras linhas da tabela analítica agregada."
knitr::kable(readr::read_csv("tables/results/ec02/amostra.csv"), digits = 2)
```
```

## Passo 3 — estrutura do capítulo

Substitua a seção de números simulados por:

```markdown
## Resultados

### Série e cobertura
![Série semanal de casos e GDD acumulado.](images/results/ec02/serie.png){#fig-serie}

**Como ler:** o eixo x é a semana epidemiológica; o eixo y à esquerda é o número de
casos e à direita o GDD acumulado. Procure picos de casos algumas semanas depois de
subidas do GDD; lacunas indicam semanas sem notificação.

### Modelo
```{r}
#| echo: false
#| tbl-cap: "Risco relativo e intervalo de 95% para o GDD."
knitr::kable(readr::read_csv("tables/results/ec02/modelo.csv"), digits = 2)
```

**Como ler:** o RR compara o GDD no percentil analisado com a referência do modelo.
O intervalo precisa excluir 1 para haver compatibilidade com efeito; não leia o ponto
sem o intervalo.

### Curva exposição–defasagem–risco
![Superfície do DLNM para GDD e casos de dengue.](images/results/ec02/dlnm_3d.png){#fig-dlnm}

**Como ler:** os eixos são GDD, defasagem (dias) e RR. O pico de lag indica a janela
em que o acúmulo térmico se associa ao risco; a cor mais intensa não é “causa”, é
associação ajustada.
```

### Regras de interpretação

Para cada figura, escreva cinco blocos:

1. **O que está no gráfico** — eixos, unidade, referência, denominador.
2. **O que procurar** — pico de lag, forma da curva, intervalo, padrão espacial.
3. **O que significa para a pergunta** — em uma frase.
4. **O que não significa** — causalidade individual, atribuição por pessoa, previsão.
5. **O que fazer com isso** — decisão, monitoramento ou nova análise.

## Passo 4 — metadados e reprodutibilidade

Cada caso deve ter `results/<caso>.json` com:

- data/hora da execução;
- versão do Studio e do `climasus4r`;
- Parâmetros completos (UF, anos, CID, idade, exposição, lag, base, referência);
- N de registros, municípios, semanas/dias;
- checksum do Parquet;
- avisos `[METODOLOGIA]` capturados;
- `sessionInfo()` em `results/session-info.txt`.

Inclua no capítulo um bloco “Reproduzir” com o comando:

```bash
Rscript book/scripts/02-run-ec02.R
```

e o commit/tag do repositório usado.

## Passo 5 — checklist antes de publicar

- [ ] Todos os números do texto batem com as tabelas/figuras.
- [ ] Toda figura tem “Como ler” e “O que não concluir”.
- [ ] O banco tem fonte, filtros, N, completude, dicionário e checksum.
- [ ] Nenhum microdado identificável foi incluído.
- [ ] Resultados simulados foram removidos do texto principal (ou marcados como exemplo).
- [ ] Avisos metodológicos do Motor estão registrados.
- [ ] O script de reprodução roda em uma máquina limpa.
- [ ] A data do snapshot está no capítulo e no README.

## Escopo recomendado

Comece por **um caso-piloto** (dengue, ec-02), com dados reais e todos os artefatos.
Depois replique para respiratório, cardio e frio. O guia ganha credibilidade sem
transformar o build em uma execução pesada de DATASUS/INMET.

Se o objetivo for apenas demonstrar o fluxo, mantenha os números simulados **claramente
marcados** e não os misture com os reais. O leitor precisa saber o que é resultado do
snapshot e o que é exemplo didático.
