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

### 2. Linguagem simplificada

- Novo overlay `src/catalog/plain-language.ts`, mesmo padrão de `arg-docs.ts`:
  `PLAIN_LANGUAGE: Record<fnName, { title: Record<Lang,string>; description: Record<Lang,string> }>`,
  curado só para as funções dos 4 templates.
- `friendlyName()` e a resolução de descrição de argumento ganham um parâmetro `mode`. Quando
  `mode === 'vigilancia'` e existe entrada em `PLAIN_LANGUAGE`, usa essa versão; caso contrário
  cai no texto técnico atual — never a regressão, sempre aditivo.

### 3. Ocultar parâmetros avançados

- Novo overlay `src/catalog/advanced-args.ts`: `ADVANCED_ARGS: Record<fnName, string[]>`,
  curado só para as funções dos 4 templates.
- Store: `showAdvanced: boolean` (persistido por projeto, mesmo padrão de `mode`/`lang`) +
  `toggleShowAdvanced()`.
- `Inspector.tsx`: quando `mode === 'vigilancia' && !showAdvanced`, filtra os args listados em
  `ADVANCED_ARGS[fn.name]` e mostra um link "Mostrar N parâmetros avançados". Função sem entrada
  em `ADVANCED_ARGS` não tem nada escondido, em nenhum modo.

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
