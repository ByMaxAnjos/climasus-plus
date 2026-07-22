# climasus+

Estúdio interativo one-click para o pacote [climasus4r](https://github.com/ByMaxAnjos/climasus4r).
A plataforma espelha a lógica dos [tutoriais do pacote](https://bymaxanjos.github.io/climasus4r/pt/articles/tutorials.html):
**Preparação → Integração → Análise & Modelagem → RAP**. Você monta o pipeline clicando nas
funções `sus_*`, preenche os argumentos como no R, e a plataforma gera o script R correspondente
(encadeado com `|>`) para copiar ou exportar.

## Rodar

```bash
npm install
npm run dev                    # web em http://localhost:1420 (vitrine: sem motor, só gera código)
npm run engine                 # motor R local em :8787 (usa o R já instalado)
npx @tauri-apps/cli@^2 dev     # app desktop com o motor embutido (requer bundle, ver abaixo)
npm run build                  # build de produção -> dist/
```

Com `npm run dev` + `npm run engine` rodando juntos, a plataforma **executa de verdade** cada
passo (tabelas, gráficos, mapas, download CSV/XLSX/Parquet, relatório HTML) usando o R instalado
na máquina. Sem o motor, cai automaticamente no modo vitrine (só gera o script `.R`).

## Como funciona

- **Biblioteca de funções** (esquerda) — 87 funções exportadas do climasus4r em 4 trilhas:
  - *Preparação*: `sus_data_*` (importação DATASUS, limpeza, filtros CID/demográficos, agregação, visualização)
  - *Integração*: `sus_join_spatial`, `sus_socio_*` (censo), `sus_climate_*` (estações INMET), `sus_grid_*` (ERA5, CHIRPS, poluição, queimadas…)
  - *Análise & Modelagem*: `sus_mod_*` (DLNM, carga atribuível, case-crossover, Bayes espacial, ML, SWOT…)
  - *RAP*: `sus_rap_*` (pipelines reprodutíveis, targets, recipes)
- **Canvas de pipeline em grafo** (centro, React Flow) — cada função vira um nó colorido por
  estágio, conectado por setas que mostram o fluxo real dos dados; nós de plot ramificam sem
  substituir a variável principal. Layout automático (sem arrastar manualmente).
- **Resultados inline** — cada nó mostra seu próprio resultado assim que roda: tabela (com
  download CSV/XLSX/Parquet), gráfico (PNG/SVG, com toggle **Estático/Interativo** quando o
  plotly consegue converter o ggplot), ou console de erro — sem precisar abrir um painel à parte.
- **Inspetor** (direita) — documentação roxygen da função + formulário de parâmetros (enums viram
  selects: 44 sistemas DATASUS, 21 regiões, etc.). Argumentos preenchidos automaticamente pelo
  passo anterior aparecem como "↳ vem do passo anterior", não como campo vazio obrigatório.
- **Tutorial guiado** — botão "🎓 Tutorial" carrega um pipeline pronto ("Mortalidade Respiratória
  — RO 2022", 100% offline) e destaca cada nó em sequência com explicação, rodando automaticamente
  conforme avança. Ver `src/tutorials/`.
- **Código R** — gerado ao vivo; `Copiar` ou `Exportar .R`. O pipeline persiste em localStorage.

## Catálogo de funções

`src/catalog/functions.json` é gerado a partir do roxygen do pacote:

```bash
node scripts/build-catalog.mjs [caminho-do-pacote]   # default: ~/Documents/2026/CLIMASUS4r/climasus4r
```

Rode novamente sempre que o pacote ganhar/alterar funções.

## Motor R (execução real, sem o usuário ver R)

O usuário nunca instala R nem sabe que ele existe:

- **Web**: vitrine — mostra a GUI, gera código R para copiar/exportar. Sem motor.
- **Desktop (Tauri)**: um R completo (climasus4r + 87 funções + todas as dependências, incluindo
  INLA/CARBayes/xgboost) vem **embutido no instalador**, isolado do sistema. O app sobe o motor
  sozinho numa porta livre ao abrir (`src-tauri/src/lib.rs`) e a interface descobre a porta via
  `window.__TAURI__.core.invoke('engine_port')`.

### Empacotar o R embutido (macOS/arm64, ~800MB)

```bash
Rscript scripts/bundle-r.R          # copia R.framework + fecho de dependências para src-tauri/resources/r
bash scripts/bundle-r-relocate.sh   # reescreve caminhos absolutos (install_name_tool) + corrige bin/R
bash scripts/bundle-r-sign.sh       # remove .dSYM/docs, assina ad-hoc todos os binários Mach-O
npm run build:macos:debug           # gera climasus-plus.app + .dmg com o R embutido
```

Rode os três scripts nessa ordem sempre que regenerar o bundle (ex.: pacote R atualizado). Detalhes
que valeram a pena documentar (ver comentários nos próprios scripts):

- O `Rscript` compilado do CRAN tem `R_HOME` fixo em string binária e **não** se autolocaliza —
  por isso o motor embutido roda via `bin/R --file=... --args ...`, nunca via `bin/Rscript`.
- `bin/R` (script de texto) também hardcoda `R_HOME_DIR`; `bundle-r-relocate.sh` corrige para
  autodetecção pelo próprio caminho (`$(dirname "$0")/..`).
- plumber/httpuv rejeitam portas fora de 1024–49151 — o Rust escolhe a porta manualmente
  (`8787..8887`), não usa `bind(":0")` (que devolve porta efêmera fora dessa faixa no macOS).
- Assinatura é **ad-hoc** (`codesign -s -`) — funciona localmente, mas o Gatekeeper avisa em
  outro Mac na primeira abertura (botão direito → Abrir). Notarização real precisa de conta
  Apple Developer (US$99/ano); depois de conseguir, trocar o `-s -` por `-s "Developer ID
  Application: ..."` nos três scripts e rodar `xcrun notarytool submit`.
- O empacotamento padrão do `.dmg` via Tauri pode falhar em ambiente automatizado por depender de
  AppleScript/Finder. O script `npm run build:macos:debug` contorna isso ao gerar primeiro o
  `.app` e depois empacotar o `.dmg` com `--skip-jenkins`, que é mais robusto para release local.

## Verificar

```bash
npm run dev &
node scripts/verify-ui.mjs     # e2e Playwright, 18 checks (código/export, sem motor)
npm run engine &
node scripts/verify-run.mjs    # e2e Playwright, 20 checks (execução real via engine + UI)
node scripts/verify-graph.mjs  # e2e Playwright, 19 checks (grafo, resultados inline, plotly, tutorial)
```

## Release macOS

Antes de disponibilizar o app para usuários finais no macOS, use o checklist de go/no-go em
[docs/release-macos-go-no-go.md](docs/release-macos-go-no-go.md).

Build real recomendado em 22 de julho de 2026:

```bash
npm run build:macos:debug
open src-tauri/target/debug/bundle/macos/climasus-plus.app
```
