# Modos de uso: diferenciação prática (Vigilância e gestão vs. Pesquisa avançada)

## Contexto

O seletor de modo (`ModeSelector.tsx`, commit `db89b9b`) hoje só persiste uma escolha por
projeto (`mode: 'vigilancia' | 'pesquisa' | null`) sem nenhum efeito de comportamento — nenhuma
função é escondida, nenhum texto muda, nenhum parâmetro é filtrado. O usuário apontou que a
promessa do seletor ("Vigilância e gestão" para gestores não-pesquisadores) não é cumprida na
prática, e pediu diferenciação real: linguagem, templates de pipeline prontos, e ocultação de
parâmetros avançados — nessa ordem de prioridade.

## Escopo

Curadoria de conteúdo novo (linguagem simples, parâmetros avançados) cobre **apenas as funções
usadas pelos 4 templates**, não as 87 funções do catálogo. Fora dos templates, o comportamento
atual é preservado integralmente (fallback para o texto técnico existente).

Modo Pesquisa nunca perde acesso a nada — os 4 templates continuam disponíveis nesse modo, sem
filtro. O modo só afeta o que é escondido/simplificado por padrão para Vigilância.

## Componentes

### 1. Templates de pipeline

- `TutorialDef` (`src/tutorials/respiratorio.ts`) ganha um campo opcional
  `audience?: 'vigilancia' | 'pesquisa' | 'both'` (default `'both'`).
- Diretório renomeado de tutorial único para `src/templates/`: `respiratorio.ts` (existente,
  movido), `dengue.ts`, `cardio-calor.ts`, `hospitalizacao-frio.ts` — cada um extraído do
  pipeline descrito em `book/06` a `book/09.qmd`, com `explain` por idioma adaptado para cortar
  jargão estatístico (o pipeline/pontos de dados em si não mudam).
- `src/templates/index.ts` exporta `TEMPLATES: TutorialDef[]` (substitui o `TUTORIALS` atual).
- UI: botão do topo (`Tutorial guiado` → `Templates` quando há mais de 1) abre uma lista
  filtrada por `audience` vs. `mode` atual, reaproveitando `TutorialOverlay.tsx`.
- `TutorialStepDef` ganha um campo opcional `id?: string`. `startTutorial` usa `s.id ?? uid()`
  em vez de sempre gerar um novo id — necessário para que um passo de junção (ex.:
  `sus_climate_aggregate`, `sus_grid_join`) possa referenciar, via `stepRef('<id-do-template>')`
  no seu `values`, um passo anterior específico do mesmo template (ver item 4, correção do
  primeiro argumento). Templates que não precisam de referências cruzadas não precisam definir
  `id` em nenhum passo (fallback `uid()` idêntico ao comportamento atual).

### 2. Linguagem simplificada

- Novo overlay `src/catalog/plain-language.ts`, mesmo padrão de `arg-docs.ts`:
  `PLAIN_LANGUAGE: Record<fnName, { title: Record<Lang,string>; description: Record<Lang,string> }>`,
  curado só para as funções dos 4 templates.
- `friendlyName()` e a resolução de descrição de argumento ganham um parâmetro `mode`. Quando
  `mode === 'vigilancia'` e existe entrada em `PLAIN_LANGUAGE`, usa essa versão; caso contrário
  cai no texto técnico atual — never a regressão, sempre aditivo.

### 3. Ocultar parâmetros avançados

**Descoberta durante o design**: `Inspector.tsx` já dobra args não-essenciais numa seção
"avançado" recolhida por padrão (`<details className="advanced-params">`), para **qualquer**
função com mais de 5 argumentos, independente de modo — confirmado ao vivo com
`sus_climate_compute_indicators` (15 args: só 4 visíveis por padrão, 11 recolhidos). Não é
preciso nenhum overlay de curadoria novo. Único ajuste: no modo Pesquisa, essa seção some
aberta por padrão (pesquisador quer ver tudo de cara); em Vigilância mantém o recolhido atual.
- `Inspector.tsx`: `<details className="advanced-params" open={mode === 'pesquisa'}>`.

### 4. Correção pré-requisito: primeiro argumento sobrescrevível

**Bug descoberto durante o design, bloqueia os templates de dengue/respiratório/cardio**: o
primeiro argumento de qualquer função é sempre auto-preenchido a partir do passo imediatamente
anterior na lista (`autoArg` em `Inspector.tsx`, sem opção de sobrescrever) e `buildSteps`
(`src/store/pipeline.ts`) sempre usa `openVar` (o var do passo imediatamente anterior) como
esse valor. Isso é semanticamente errado para funções que combinam duas trilhas de dados (ex.:
`sus_climate_aggregate(health_data, climate_data)`, `sus_grid_join(health_data, grid_data)`)
quando não são o primeiro passo do pipeline — confirmado ao vivo: uma sequência
`sus_climate_inmet()` → `sus_climate_aggregate()` gera `clima <- sus_climate_inmet() |>
sus_climate_aggregate()`, ligando os dados de clima ao parâmetro `health_data` (errado) e nunca
referenciando a série de saúde. Isso não é causado pela feature de modos — afeta qualquer
pipeline manual com esse padrão hoje.

**Correção, pequena e cirúrgica:**
- `src/store/pipeline.ts` `buildSteps`: antes de decidir `hasInput`/`input` a partir de
  `openVar`, verificar se `step.values[fn.args[0].name]` já é uma step-ref explícita
  (`isStepRef`); se for, usar o var do passo referenciado (via `varByStepId`) no lugar de
  `openVar`, e tratar como um "family change" (novo bloco, `chains: false`) mesmo que a família
  bata com o bloco aberto atual.
- `src/ui/Inspector.tsx`: o primeiro argumento auto-preenchido (`autoArg`) passa a ser
  renderizado como `ArgField` (com o mesmo seletor de step-reference que os outros argumentos de
  dado já usam), não mais como o atual `AutoArgField` sem opção de escolha. Quando vazio, mostra
  o mesmo hint "↳ vem do passo anterior" que hoje aparece sempre; ao escolher um passo no
  seletor, grava a step-ref normalmente. `AutoArgField` é removido (código morto após a troca).

## Casos-limite

- Troca de modo com pipeline já aberto: puramente de apresentação, sem migração/validação.
- Carregar um template sobre um pipeline existente: mesmo comportamento que "Tutorial guiado"
  hoje (sem mudança de UX).
- Projeto salvo antes desta feature (sem `showAdvanced` no `ProjectData`): default `false`, sem
  crash — mesmo padrão de fallback que `mode: UsageMode | null` já usa hoje.
- Fallback de tradução/ocultação: qualquer função/arg sem entrada nos overlays se comporta
  exatamente como antes da feature.

## Testes

- `scripts/verify-ui.mjs`: troca de modo persiste; lista de templates filtrada por `audience`;
  texto plano aparece/some conforme o modo nas funções curadas.
- `scripts/verify-graph.mjs`: cada um dos 4 templates monta o número certo de nós/edges.
- Novo check de Inspector: toggle "Mostrar avançado" esconde/revela o número certo de campos
  numa função curada, e não afeta uma função sem curadoria.
- Sem testes novos de engine/R — a feature é inteiramente front-end/apresentação.

## Fora de escopo (explicitamente adiado)

- Curadoria de linguagem/parâmetros avançados para as 87 funções do catálogo inteiro.
- Qualquer gating de funcionalidade por modo (bloquear ações, exigir campos extras) — o modo
  Pesquisa não perde acesso a nada.
