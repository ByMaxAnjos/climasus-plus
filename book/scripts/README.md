# Resultados reais do guia — scripts de execução

Estes scripts geram os artefatos reais que serão incorporados ao guia. Eles usam o
pacote `climasus4r` diretamente (o mesmo Motor do Studio) e gravam:

```
book/data/<caso>/analytic.parquet      # tabela analítica agregada
book/data/<caso>/codebook.csv          # dicionário de variáveis
book/tables/results/<caso>/*.csv       # amostra, descritiva, modelo, AF, ITS
book/images/results/<caso>/*.png       # série, mapa, DLNM, AF, ondas, contrafactual
book/results/<caso>.json               # metadados, N, versões, checksum
book/results/*-session-info.txt        # sessão R
book/results/*.log                     # log de execução (run-all)
```

## Pré-requisitos

- R 4.5+ com `climasus4r` instalado;
- pacotes: `dplyr`, `readr`, `ggplot2`, `jsonlite`, `arrow`, `sf`, `geobr`;
- conexão com a internet na primeira execução (DATASUS, INMET e, se necessário, geobr);
- cache em `~/.climasus4r_cache` para acelerar execuções seguintes;
- espaço em disco e paciência: SIM/SIH/SINAN de vários anos podem ser grandes.

## Como rodar

Um caso por vez:

```bash
cd /caminho/para/climasu_Studio
Rscript book/scripts/02-run-ec02.R      # dengue
Rscript book/scripts/01-run-ec01.R      # respiratório pediátrico
Rscript book/scripts/03-run-ec03.R      # cardiovascular/calor
Rscript book/scripts/04-run-ec04.R      # hospitalizações/frio
```

Todos de uma vez, com log por caso:

```bash
cd /caminho/para/climasu_Studio
Rscript book/scripts/run-all.R
```

Os logs ficam em `book/results/*.log`. Se um caso falhar, os outros continuam.

Scripts auxiliares (usados para completar/reparar a execução):

```bash
Rscript book/scripts/03b-ec03-af.R        # reaproveita o parquet do ec03 e roda AF com 200 simulações
Rscript book/scripts/04b-ec04-its.R       # refaz o ITS no evento A801 (Porto Alegre)
Rscript book/scripts/04c-ec04-window-plot.R  # janela de ±180 dias do contrafactual
Rscript book/scripts/05-make-wave-plots.R    # PNGs estáticos de ondas de calor/frio
```

## O que cada caso produz

| Caso | Exposição | Modelo | Principais figuras |
|---|---|---|---|
| ec01 | temperatura + umidade, 0–21 dias | DLNM + AF | série, mapa, DLNM, AF |
| ec02 | GDD base 11 °C, 0–84 dias | DLNM | série, mapa, DLNM |
| ec03 | temperatura, 0–21 dias | DLNM + AF | série, mapa, ondas de calor, DLNM, AF |
| ec04 | evento de frio (WHO p10) | ITS | série, mapa, ondas de frio, contrafactual |

## Decisões que você deve conferir antes de rodar

- **ec04 — data do evento.** O script escolhe o evento de frio mais longo da estação
  INMET mais próxima de Porto Alegre. Confira `book/tables/results/ec04/evento_escolhido.csv`
  e, se quiser outro evento, ajuste `event_date` no script.
- **ec02 — base do GDD.** O script fixa `gdd_base = 11` e `gdd_upper = 35`. Se quiser
  comparar com a base regional, rode uma segunda vez com outro `custom_thresholds`.
- **ec01 — umidade.** O modelo usa `rh_mean_porc_lag0` como covariável. Se a estação
  tiver muita falha de umidade, o `n` efetivo cai; confira `fit$meta$n`.
- **Referência do AF.** O `sus_mod_af` usa a referência do modelo (mediana por padrão).
  Para carga atribuível, substitua por MMT ou um valor pré-especificado.
- **Estações distantes.** O `sus_climate_aggregate` usa a estação mais próxima, mas não
  impõe distância máxima. Confira as distâncias no log e trate como limitação.

## O que enviar de volta

Depois de rodar, avise e envie (ou deixe no disco):

1. `book/results/` (JSONs, logs, session info);
2. `book/tables/results/` (CSVs);
3. `book/images/results/` (PNGs);
4. `book/data/*/analytic.parquet` e `codebook.csv` (se couberem no repositório; se não,
   apenas o checksum e uma amostra).

Com isso, eu integro os resultados nos capítulos 7–10: seção “Dados usados”, tabelas,
figuras, “Como ler”, “O que não concluir” e “Reproduzir”.

## Observações

- `book/` está no `.gitignore` do Studio; os artefatos ficam no disco, não no Git.
- Não versione o microdado bruto do DATASUS. O Parquet é a tabela **agregada**; o
  microdado fica no cache e pode ser reconstruído com os scripts.
- Se a execução falhar por falta de pacote, instale o pacote indicado e rode de novo.
  O erro completo fica no `book/results/*.log`.
- O build do guia continua estático: `quarto render` não executa estes scripts.
