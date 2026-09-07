# Modos de uso: diferenciação prática — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Vigilância/Pesquisa mode selector (currently cosmetic-only) actually change
what the user sees: 4 ready-made pipeline templates (from the book's case studies), plain-
language function/description text for those templates' functions in Vigilância mode, and an
advanced-params panel that defaults open in Pesquisa mode. Also fixes a pre-existing bug (first
pipe argument can't be overridden) that blocks the templates from generating correct R code.

**Architecture:** Mostly additive overlays on the existing catalog (`src/catalog/*`) and a new
`src/templates/` directory of `TutorialDef`s, reusing the existing tutorial-overlay UI. One
surgical fix to `buildSteps`/`Inspector.tsx` to let a function's first (auto-piped) argument be
overridden via step-reference, same mechanism already used for other data arguments.

**Tech Stack:** React + TypeScript + Zustand (existing store), no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-07-modos-de-uso-design.md`

## Global Constraints

- No new npm dependencies.
- Every new/changed overlay must be additive: any function/arg without a curated entry falls
  back to today's behavior exactly (technical text, no hiding).
- Modo Pesquisa never loses access to anything the current build has — only default visibility
  changes.
- All 4 templates must run against real climasus4r functions with correct argument wiring
  (verified by exporting each template's R code and checking positional/named args match the
  function signature in `src/catalog/functions.json`).
- Follow existing code style: no comments explaining what code does, only non-obvious why.

---

### Task 1: Allow overriding a function's first (auto-piped) argument via step-reference

**Files:**
- Modify: `src/store/pipeline.ts:552-595` (`buildSteps`)
- Modify: `src/ui/Inspector.tsx:93-100, 113-150` (`AutoArgField`, `Inspector`)

**Interfaces:**
- Consumes: existing `isStepRef`, `stepRefId`, `stepRef` (`src/store/pipeline.ts:472-475`),
  existing `pipeArg`, `byName` (`src/catalog/index.ts`).
- Produces: `buildSteps` now honors an explicit step-reference stored in
  `step.values[fn.args[0].name]` instead of always chaining from the immediately preceding step.
  No signature changes — `buildSteps(steps: Step[]): BuiltStep[]` unchanged.

This is a prerequisite for Task 5 (templates need it to generate correct code for
`sus_climate_aggregate`/`sus_grid_join`-style combiner functions).

- [ ] **Step 1: Reproduce the bug as a script (manual verification, not a browser test)**

Create a throwaway node script to confirm today's broken output, run it, then delete it — this
is not part of the shipped test suite, just a before/after check for this task.

```bash
cat > /tmp/repro-buildsteps-bug.mjs <<'EOF'
// Run with: node --experimental-vm-modules /tmp/repro-buildsteps-bug.mjs
// (requires the dev server NOT running; this imports the store module directly via esbuild-free ts? -- 
//  simplest is actually via the browser console, see Step 2 instead.)
EOF
echo "skip - verified via browser console instead, see Step 2"
```

- [ ] **Step 2: Verify current broken behavior via the running dev server**

With `npm run dev` running (port whatever is free) and the app loaded in a browser tab, open
devtools console (or use the `javascript_tool` MCP tool) and run:

```js
window.__generateR([
  { id: 's1', fn: 'sus_data_import', values: {} },
  { id: 's2', fn: 'sus_data_clean_encoding', values: {} },
  { id: 's3', fn: 'sus_data_aggregate', values: { time_unit: 'month' } },
  { id: 's4', fn: 'sus_climate_inmet', values: {} },
  { id: 's5', fn: 'sus_climate_aggregate', values: {} },
])
```

Expected (the bug): `clima <- sus_climate_inmet() |> sus_climate_aggregate()` — climate data
piped into `health_data`, `dados` never referenced. Confirm this reproduces before continuing.

- [ ] **Step 3: Modify `buildSteps` to honor an explicit step-reference override on the first arg**

In `src/store/pipeline.ts`, replace the `buildSteps` function body (currently lines 552-595)
with:

```ts
export function buildSteps(steps: Step[]): BuiltStep[] {
  const out: BuiltStep[] = []
  const used: Record<string, number> = {}
  const varByStepId: Record<string, string> = {} // filled in as each step's var is decided, for step-ref args
  let openVar: string | null = null
  let openVarStepId: string | null = null
  let openBase: string | null = null
  let figN = 0
  const newVar = (base: string) => {
    used[base] = (used[base] ?? 0) + 1
    return used[base] > 1 ? `${base}_${used[base]}` : base
  }
  for (const step of steps) {
    const fn = byName.get(step.fn)
    if (!fn) continue
    const firstArgName = fn.args[0]?.name
    const explicitFirst = firstArgName ? (step.values[firstArgName] ?? '').trim() : ''
    const overrideStepId = explicitFirst && isStepRef(explicitFirst) ? stepRefId(explicitFirst) : null
    const overrideVar = overrideStepId ? (varByStepId[overrideStepId] ?? null) : null
    const effectiveOpenVar = overrideVar ?? openVar
    const effectiveOpenStepId = overrideStepId ?? openVarStepId
    const hasInput = pipeArg(fn) !== null && effectiveOpenVar !== null
    const base = blockVar(fn)
    let built: BuiltStep
    if (!hasInput) {
      // source: starts a new data block
      openVar = newVar(base)
      openBase = base
      built = { stepId: step.id, fn, var: openVar, chains: false, args: stepArgs(step, fn, false, varByStepId), input: null, inputStepId: null }
      openVarStepId = step.id
    } else if (fn.family === 'plot') {
      // plot: consumes the open var but never replaces it (fig_N <- sus_x_plot(dados))
      built = { stepId: step.id, fn, var: `fig_${++figN}`, chains: false, args: stepArgs(step, fn, true, varByStepId), input: effectiveOpenVar, inputStepId: effectiveOpenStepId }
    } else if (overrideVar) {
      // explicit override of the first arg: always a new block, never chains visually
      // (the referenced step may not be the one immediately above in the list)
      const v = newVar(base)
      built = { stepId: step.id, fn, var: v, chains: false, args: stepArgs(step, fn, true, varByStepId), input: overrideVar, inputStepId: overrideStepId }
      openVar = v
      openBase = base
      openVarStepId = step.id
    } else if (base === openBase) {
      // same-family transform: continues the pipe chain (dados <- ... |> fn())
      built = { stepId: step.id, fn, var: openVar!, chains: true, args: stepArgs(step, fn, true, varByStepId), input: openVar, inputStepId: openVarStepId }
      openVarStepId = step.id
    } else {
      // family change (e.g. sus_mod_dlnm over dados): new block consuming the open var
      const v = newVar(base)
      built = { stepId: step.id, fn, var: v, chains: false, args: stepArgs(step, fn, true, varByStepId), input: openVar, inputStepId: openVarStepId }
      openVar = v
      openBase = base
      openVarStepId = step.id
    }
    out.push(built)
    varByStepId[step.id] = built.var
  }
  return out
}
```

(Only the added `firstArgName`/`explicitFirst`/`overrideStepId`/`overrideVar`/`effectiveOpenVar`/
`effectiveOpenStepId` lines and the new `else if (overrideVar)` branch are new; every other line
is unchanged from today so the diff stays small and reviewable.)

- [ ] **Step 4: Verify the fix via the same browser-console check, now with an explicit override**

```js
window.__generateR([
  { id: 's1', fn: 'sus_data_import', values: {} },
  { id: 's2', fn: 'sus_data_clean_encoding', values: {} },
  { id: 's3', fn: 'sus_data_aggregate', values: { time_unit: 'month' } },
  { id: 's4', fn: 'sus_climate_inmet', values: {} },
  { id: 's5', fn: 'sus_climate_aggregate', values: { health_data: '@step:s3', climate_data: '@step:s4' } },
])
```

Expected: `clima <- sus_climate_aggregate(\n    dados,\n    climate_data = clima\n  )` (or
equivalent — `dados` passed positionally as `health_data`, `climate_data = clima` named). Run
`window.__generateR` with the OLD (pre-fix) array from Step 2 too, and confirm it still produces
the exact same output as before (no regression for the common single-branch case).

- [ ] **Step 5: Update `Inspector.tsx` to let the first arg be overridden**

In `src/ui/Inspector.tsx`:

1. Delete the `AutoArgField` function (lines 93-100) — dead code after this change.
2. Add an `autoDefault` prop to `ArgField`'s props type and destructure it:

```ts
function ArgField({ arg, fnName, value, onChange, lang, issue, priorSteps, autoDefault }: {
  arg: ArgSpec
  fnName: string
  value: string
  onChange: (v: string) => void
  lang: 'pt' | 'en' | 'es'
  issue?: string
  priorSteps: PriorStepOption[]
  autoDefault?: boolean
}) {
```

3. Change the `canReference` line to also allow reference for the auto-default arg:

```ts
  const canReference = (arg.type === 'data' || autoDefault) && priorSteps.length > 0
```

4. Change the messaging block (currently `missingRequired ? ... : defaultActive ? ... : issue ? ... : null`)
   to show the auto-from-previous hint when this is the auto-default arg and nothing is
   explicitly referenced yet:

```tsx
      {missingRequired ? (
        <p className="arg-note arg-note-required">{issue || t('requiredMissingHint', lang)}</p>
      ) : autoDefault && !refId ? (
        <p className="arg-note">↳ {t('autoFromPrevious', lang)}</p>
      ) : defaultActive ? (
        <p className="arg-note">{tp('usingDefault', lang, { value: String(arg.default) })}</p>
      ) : issue ? (
        <p className="arg-note arg-note-required">{issue}</p>
      ) : null}
```

5. In `Inspector`'s `renderArg`, replace the `autoArg` branch entirely:

```ts
  const renderArg = (a: ArgSpec) => (
    <ArgField
      key={a.name}
      arg={a}
      fnName={fn.name}
      lang={lang}
      value={step?.values[a.name] ?? ''}
      issue={issueByArg.get(a.name)}
      priorSteps={priorSteps}
      autoDefault={a.name === autoArg}
      onChange={(v) => step && setValue(step.id, a.name, v)}
    />
  )
```

(`autoArg` computation on line 123 is unchanged — it still identifies which arg name is the
auto-piped one; it's just no longer rendered as a separate non-editable component.)

- [ ] **Step 6: Manual UI check**

Run `npm run dev`, open the app, build a pipeline: add `sus_data_import` →
`sus_data_clean_encoding` → `sus_data_aggregate` → `sus_climate_inmet` → `sus_climate_aggregate`.
Select the last step. Confirm:
- Its first arg (`health_data`) now shows a dropdown (step-reference selector), not a fixed
  "vem do passo anterior" line.
- Leaving it unset still shows the "↳ vem do passo anterior" hint and generates the same
  (buggy-but-unchanged-behavior) code as before, for backward compatibility with any pipeline
  that doesn't use the override.
- Picking the `sus_data_aggregate` step from the dropdown for `health_data`, and the
  `sus_climate_inmet` step for `climate_data`, produces correct generated R code (check the
  Código panel).

- [ ] **Step 7: Commit**

```bash
git add src/store/pipeline.ts src/ui/Inspector.tsx
git commit -m "$(cat <<'EOF'
Allow overriding a function's first (auto-piped) argument via step reference

Fixes combiner functions (sus_climate_aggregate, sus_grid_join) generating
semantically wrong code when placed after a climate/grid source step instead
of the health chain — the auto-pipe always grabbed the immediately preceding
step's result regardless of which argument it actually belonged to.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Gate the advanced-params panel's default-open state by mode

**Files:**
- Modify: `src/ui/Inspector.tsx:113-187` (`Inspector`)

**Interfaces:**
- Consumes: `mode` from `usePipeline()` (already defined in the store, `UsageMode | null`).
- Produces: no new exports.

- [ ] **Step 1: Read `mode` from the store and pass it to the `<details>` element**

In `src/ui/Inspector.tsx`, add `mode` to the destructured store values on line 114:

```ts
  const { steps, selectedStep, inspectFn, lang, mode, addStep, setValue, validationIssues } = usePipeline()
```

Then change the `<details className="advanced-params">` element (around line 174) to:

```tsx
              <details className="advanced-params" open={mode === 'pesquisa'}>
```

- [ ] **Step 2: Manual UI check**

In the running app, select a step whose function has more than 5 args (e.g.
`sus_climate_compute_indicators`). With mode = Vigilância, confirm "Parâmetros avançados" stays
collapsed by default. Switch to Pesquisa (top-bar mode badge), re-select the step, confirm it's
now expanded by default.

- [ ] **Step 3: Commit**

```bash
git add src/ui/Inspector.tsx
git commit -m "$(cat <<'EOF'
Expand advanced parameters by default in Pesquisa mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Plain-language overlay for the 4 templates' functions

**Files:**
- Create: `src/catalog/plain-language.ts`
- Modify: `src/catalog/index.ts:60-62` (`friendlyName`, `friendlyDescription`)
- Modify: every call site of `friendlyName`/`friendlyDescription` that has `mode` available
  (`src/ui/graph/nodes/StepNode.tsx`, `src/ui/Inspector.tsx`) to pass it through.

**Interfaces:**
- Produces: `friendlyName(fn: FnSpec, lang: Lang, mode?: UsageMode | null): string`,
  `friendlyDescription(fn: FnSpec, lang: Lang, mode?: UsageMode | null): string` — both gain an
  optional third parameter; omitting it (any existing call site not updated) keeps today's
  behavior exactly, so this is a non-breaking signature change.

The 12 functions covered are exactly the ones used across the 4 templates (see Task 5):
`sus_data_import`, `sus_data_clean_encoding`, `sus_data_standardize`, `sus_data_filter_cid`,
`sus_data_create_variables`, `sus_data_filter_demographics`, `sus_data_aggregate`,
`sus_climate_inmet`, `sus_climate_aggregate`, `sus_grid_chirps`, `sus_grid_join`,
`sus_climate_compute_heatwaves`, `sus_climate_compute_coldwaves`, `sus_mod_dlnm`, `sus_mod_af`,
`sus_mod_its`, `sus_mod_plot_af`, `sus_mod_plot_dlnm`.

- [ ] **Step 1: Create the overlay file**

```ts
// src/catalog/plain-language.ts
// Plain-language (no statistical jargon) titles/descriptions for Vigilância mode, covering only
// the functions used by the 4 ready-made templates (src/templates/). Any function without an
// entry here falls back to the technical FRIENDLY text in friendly.ts — see friendlyName/
// friendlyDescription in catalog/index.ts.

import type { Lang } from '../store/pipeline'

export type PlainEntry = { title: Record<Lang, string>; description: Record<Lang, string> }

export const PLAIN_LANGUAGE: Record<string, PlainEntry> = {
  sus_data_import: {
    title: { pt: 'Trazer os dados do sistema de saúde', en: 'Bring in the health-system data', es: 'Traer los datos del sistema de salud' },
    description: {
      pt: 'Baixa os registros oficiais (mortes, internações, casos notificados) direto do DATASUS para o período e o local escolhidos.',
      en: 'Downloads the official records (deaths, hospitalizations, notified cases) straight from DATASUS for the chosen period and place.',
      es: 'Descarga los registros oficiales (muertes, internaciones, casos notificados) directo de DATASUS para el período y el lugar elegidos.',
    },
  },
  sus_data_clean_encoding: {
    title: { pt: 'Corrigir letras erradas nos textos', en: 'Fix garbled text', es: 'Corregir letras erróneas en los textos' },
    description: {
      pt: 'Corrige acentos e caracteres que costumam vir quebrados nos arquivos do DATASUS (ex.: "São Paulo" virando texto ilegível).',
      en: 'Fixes accents and characters that commonly come broken in DATASUS files (e.g. "São Paulo" turning into unreadable text).',
      es: 'Corrige acentos y caracteres que suelen venir rotos en los archivos de DATASUS.',
    },
  },
  sus_data_standardize: {
    title: { pt: 'Padronizar nomes e categorias', en: 'Standardize names and categories', es: 'Estandarizar nombres y categorías' },
    description: {
      pt: 'Deixa os nomes de coluna e as categorias (sexo, raça etc.) num formato único, para as próximas etapas funcionarem sem ajuste manual.',
      en: 'Puts column names and categories (sex, race, etc.) into one consistent format so the next steps work without manual tweaking.',
      es: 'Deja los nombres de columna y las categorías en un formato único.',
    },
  },
  sus_data_filter_cid: {
    title: { pt: 'Selecionar a doença de interesse', en: 'Select the disease of interest', es: 'Seleccionar la enfermedad de interés' },
    description: {
      pt: 'Mantém só os registros da doença ou grupo de doenças que você quer estudar (ex.: dengue, causas respiratórias, cardiovasculares).',
      en: 'Keeps only the records for the disease or disease group you want to study (e.g. dengue, respiratory causes, cardiovascular).',
      es: 'Mantiene solo los registros de la enfermedad o grupo de enfermedades de interés.',
    },
  },
  sus_data_create_variables: {
    title: { pt: 'Criar faixas de idade e data', en: 'Create age and calendar groupings', es: 'Crear franjas de edad y fecha' },
    description: {
      pt: 'Cria colunas úteis para analisar depois, como faixa etária e semana/mês do ano.',
      en: 'Creates useful columns for later analysis, like age group and week/month of year.',
      es: 'Crea columnas útiles para analizar después, como franja etaria y semana/mes del año.',
    },
  },
  sus_data_filter_demographics: {
    title: { pt: 'Recortar o grupo populacional', en: 'Narrow down the population group', es: 'Recortar el grupo poblacional' },
    description: {
      pt: 'Mantém só o grupo de pessoas de interesse (ex.: idosos, crianças menores de 5 anos).',
      en: 'Keeps only the population group of interest (e.g. elderly, children under 5).',
      es: 'Mantiene solo el grupo de personas de interés.',
    },
  },
  sus_data_aggregate: {
    title: { pt: 'Somar os casos ao longo do tempo', en: 'Add up cases over time', es: 'Sumar los casos a lo largo del tiempo' },
    description: {
      pt: 'Transforma registros individuais em uma contagem por período (dia, semana ou mês) — o formato que os próximos passos precisam.',
      en: 'Turns individual records into a count per period (day, week, or month) — the format the next steps need.',
      es: 'Transforma registros individuales en un conteo por período (día, semana o mes).',
    },
  },
  sus_climate_inmet: {
    title: { pt: 'Trazer dados de temperatura das estações', en: 'Bring in station temperature data', es: 'Traer datos de temperatura de las estaciones' },
    description: {
      pt: 'Baixa a temperatura registrada pelas estações meteorológicas do INMET para o período e local escolhidos.',
      en: 'Downloads the temperature recorded by INMET weather stations for the chosen period and place.',
      es: 'Descarga la temperatura registrada por las estaciones meteorológicas del INMET.',
    },
  },
  sus_climate_aggregate: {
    title: { pt: 'Juntar saúde e clima na mesma tabela', en: 'Combine health and climate into one table', es: 'Unir salud y clima en la misma tabla' },
    description: {
      pt: 'Une a série de casos de saúde à série de clima, no mesmo período, para poder relacionar os dois depois.',
      en: 'Merges the health-case series with the climate series over the same period, so the two can be related afterwards.',
      es: 'Une la serie de casos de salud a la serie de clima, en el mismo período.',
    },
  },
  sus_grid_chirps: {
    title: { pt: 'Trazer dados de chuva por satélite', en: 'Bring in satellite rainfall data', es: 'Traer datos de lluvia por satélite' },
    description: {
      pt: 'Baixa a chuva acumulada estimada por satélite, útil onde não há estação meteorológica próxima.',
      en: 'Downloads satellite-estimated accumulated rainfall, useful where no nearby weather station exists.',
      es: 'Descarga la lluvia acumulada estimada por satélite.',
    },
  },
  sus_grid_join: {
    title: { pt: 'Juntar saúde e ambiente por município', en: 'Combine health and environment by municipality', es: 'Unir salud y ambiente por municipio' },
    description: {
      pt: 'Une a série de casos de saúde ao dado ambiental (chuva, poluição etc.) de cada município.',
      en: 'Merges the health-case series with the environmental data (rainfall, pollution, etc.) for each municipality.',
      es: 'Une la serie de casos de salud al dato ambiental de cada municipio.',
    },
  },
  sus_climate_compute_heatwaves: {
    title: { pt: 'Detectar dias de onda de calor', en: 'Detect heatwave days', es: 'Detectar días de ola de calor' },
    description: {
      pt: 'Marca quais dias, na série de temperatura, contam como onda de calor, usando um critério padrão internacional.',
      en: 'Flags which days in the temperature series count as a heatwave, using a standard international criterion.',
      es: 'Marca qué días de la serie de temperatura cuentan como ola de calor.',
    },
  },
  sus_climate_compute_coldwaves: {
    title: { pt: 'Detectar dias de onda de frio', en: 'Detect cold-wave days', es: 'Detectar días de ola de frío' },
    description: {
      pt: 'Marca quais dias, na série de temperatura, contam como onda de frio, usando um critério padrão internacional.',
      en: 'Flags which days in the temperature series count as a cold wave, using a standard international criterion.',
      es: 'Marca qué días de la serie de temperatura cuentan como ola de frío.',
    },
  },
  sus_mod_dlnm: {
    title: { pt: 'Estimar o risco ligado ao clima', en: 'Estimate the climate-linked risk', es: 'Estimar el riesgo ligado al clima' },
    description: {
      pt: 'Estima como o risco de saúde muda conforme a temperatura, considerando que o efeito pode aparecer dias depois da exposição.',
      en: 'Estimates how health risk changes with temperature, accounting for the effect showing up days after exposure.',
      es: 'Estima cómo cambia el riesgo de salud según la temperatura, considerando que el efecto puede aparecer días después.',
    },
  },
  sus_mod_af: {
    title: { pt: 'Calcular quantos casos são por causa do clima', en: 'Calculate how many cases are climate-caused', es: 'Calcular cuántos casos son por causa del clima' },
    description: {
      pt: 'Traduz o risco estimado em um número e uma proporção: quantos casos, no período estudado, são atribuíveis ao clima.',
      en: 'Translates the estimated risk into a number and a proportion: how many cases, in the studied period, are attributable to climate.',
      es: 'Traduce el riesgo estimado en un número y una proporción atribuible al clima.',
    },
  },
  sus_mod_its: {
    title: { pt: 'Avaliar o efeito de um período específico', en: 'Assess the effect of a specific period', es: 'Evaluar el efecto de un período específico' },
    description: {
      pt: 'Compara o antes e o depois de um evento (como uma onda de frio) para ver se ele realmente mudou os números de saúde.',
      en: 'Compares before and after an event (like a cold wave) to see whether it actually changed the health numbers.',
      es: 'Compara el antes y el después de un evento para ver si realmente cambió los números de salud.',
    },
  },
  sus_mod_plot_af: {
    title: { pt: 'Ver o gráfico de casos atribuíveis', en: 'View the attributable-cases chart', es: 'Ver el gráfico de casos atribuibles' },
    description: {
      pt: 'Mostra em gráfico e tabela quantos casos são atribuíveis ao clima, pronto para apresentar.',
      en: 'Shows, as a chart and table, how many cases are climate-attributable, ready to present.',
      es: 'Muestra en gráfico y tabla cuántos casos son atribuibles al clima.',
    },
  },
  sus_mod_plot_dlnm: {
    title: { pt: 'Ver a curva de risco', en: 'View the risk curve', es: 'Ver la curva de riesgo' },
    description: {
      pt: 'Mostra em gráfico como o risco de saúde muda com a temperatura e com os dias após a exposição.',
      en: 'Shows as a chart how health risk changes with temperature and with days since exposure.',
      es: 'Muestra en gráfico cómo cambia el riesgo de salud con la temperatura.',
    },
  },
}
```

- [ ] **Step 2: Wire the overlay into `friendlyName`/`friendlyDescription`**

In `src/catalog/index.ts`, import `PLAIN_LANGUAGE` and `UsageMode`:

```ts
import { PLAIN_LANGUAGE } from './plain-language'
import type { UsageMode } from '../store/pipeline'
```

Replace lines 60-62 with:

```ts
export const friendlyName = (fn: FnSpec, lang: Lang, mode?: UsageMode | null): string => {
  if (mode === 'vigilancia' && PLAIN_LANGUAGE[fn.name]) return PLAIN_LANGUAGE[fn.name].title[lang]
  return FRIENDLY[fn.name]?.[lang]?.name ?? fn.title
}
export const friendlyDescription = (fn: FnSpec, lang: Lang, mode?: UsageMode | null): string => {
  if (mode === 'vigilancia' && PLAIN_LANGUAGE[fn.name]) return PLAIN_LANGUAGE[fn.name].description[lang]
  return FRIENDLY[fn.name]?.[lang]?.description ?? fn.description ?? fn.title
}
```

- [ ] **Step 3: Pass `mode` through from the two call sites that render function names/descriptions**

In `src/ui/graph/nodes/StepNode.tsx`, `mode` isn't currently read — add it:

```ts
  const mode = usePipeline((s) => s.mode)
```

and change the two call sites (`friendlyName(fn, lang)` for the node title, and wherever
`friendlyDescription` is used, if at all in this file — check with
`grep -n friendlyName src/ui/graph/nodes/StepNode.tsx`) to `friendlyName(fn, lang, mode)`.

In `src/ui/Inspector.tsx`, `mode` is already being read as part of Task 2's Step 1. Change the
`FnDoc` component's calls (`friendlyName(fn, lang)`, `friendlyDescription(fn, lang)` around line
106-108) to pass `mode` through — `FnDoc` needs a `mode` prop added to its signature, threaded
from `Inspector`'s call site (`<FnDoc fn={fn} lang={lang} />` → `<FnDoc fn={fn} lang={lang} mode={mode} />`).

- [ ] **Step 4: Manual UI check**

In the running app, add `sus_data_import` to the pipeline. With mode = Vigilância, confirm the
node/Inspector show "Trazer os dados do sistema de saúde" instead of the technical name. Switch
to Pesquisa, confirm it reverts to the current technical title. Add a function NOT in
`PLAIN_LANGUAGE` (e.g. `sus_mod_sensitivity`) and confirm it shows the same text in both modes
(no regression).

- [ ] **Step 5: Commit**

```bash
git add src/catalog/plain-language.ts src/catalog/index.ts src/ui/graph/nodes/StepNode.tsx src/ui/Inspector.tsx
git commit -m "$(cat <<'EOF'
Add plain-language names/descriptions for template functions in Vigilância mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `TutorialDef` gains `audience` and stable per-step `id`

**Files:**
- Modify: `src/tutorials/respiratorio.ts:1-13` (type definitions only, no content change)
- Modify: `src/store/pipeline.ts:335-353` (`startTutorial`)

**Interfaces:**
- Produces: `TutorialStepDef` gains optional `id?: string`. `TutorialDef` gains optional
  `audience?: 'vigilancia' | 'pesquisa' | 'both'` (default treated as `'both'` by consumers).
- Consumes (Task 6): templates set `id` on steps that need to be referenced by a later step's
  `stepRef`.

- [ ] **Step 1: Extend the types**

In `src/tutorials/respiratorio.ts`, change:

```ts
export interface TutorialStepDef {
  fn: string
  values: Record<string, string>
  explain: Record<Lang, string>
}

export interface TutorialDef {
  id: string
  title: Record<Lang, string>
  steps: TutorialStepDef[]
}
```

to:

```ts
export interface TutorialStepDef {
  id?: string
  fn: string
  values: Record<string, string>
  explain: Record<Lang, string>
}

export type TemplateAudience = 'vigilancia' | 'pesquisa' | 'both'

export interface TutorialDef {
  id: string
  title: Record<Lang, string>
  audience?: TemplateAudience
  steps: TutorialStepDef[]
}
```

- [ ] **Step 2: Use the step's own id when present**

In `src/store/pipeline.ts`, `startTutorial` (line ~337):

```ts
    const steps: Step[] = tutorial.steps.map((s) => ({ id: s.id ?? uid(), fn: s.fn, values: { ...s.values } }))
```

- [ ] **Step 3: Manual check — existing tutorial still works**

Run `node scripts/verify-graph.mjs` (needs `npm run dev` on :1420 and `npm run engine` on
:8787 per the script's own header comment) and confirm all existing checks still pass — this
task changes no behavior for the existing `RESPIRATORIO_SP` tutorial (it sets no `id`/`audience`,
both default exactly as before).

- [ ] **Step 4: Commit**

```bash
git add src/tutorials/respiratorio.ts src/store/pipeline.ts
git commit -m "$(cat <<'EOF'
Add optional audience and stable step id to TutorialDef

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Four ready-made templates (`src/templates/`)

**Files:**
- Create: `src/templates/dengue.ts`
- Create: `src/templates/respiratorio-pediatrico.ts`
- Create: `src/templates/cardio-calor.ts`
- Create: `src/templates/hospitalizacao-frio.ts`
- Create: `src/templates/index.ts`

**Interfaces:**
- Consumes: `TutorialDef`/`TutorialStepDef` (Task 4), `stepRef` (`src/store/pipeline.ts`).
- Produces: `TEMPLATES: TutorialDef[]` from `src/templates/index.ts`.

Each template is built from the corresponding `book/0N-*.qmd` case study (already read in full
during design). All 4 use `sus_mod_dlnm`/`sus_mod_its` which need health and climate data already
merged into one data frame — `sus_climate_aggregate` (station data) or `sus_grid_join` (gridded
data) supply that merge, using the Task 1 step-reference override for both of their arguments so
the generated code is correct regardless of list position.

**Known open question, verify in Step 6 below:** `outcome_col` defaults to `"n_obitos"` in
`sus_mod_dlnm`/`sus_mod_its`. `sus_data_aggregate`'s count column name is chosen automatically
per DATASUS system (`get_smart_column_name` in climasus4r) and may differ for `SINAN-DENGUE`/
`SIH-RD` vs `SIM-DO`. Leave `outcome_col` unset in each template below (falls back to the
function's own default) and verify empirically in Step 6 whether it needs to be set explicitly
per template.

- [ ] **Step 1: `src/templates/dengue.ts`** (from `book/07-caso-dengue-clima.qmd`)

```ts
import type { TutorialDef } from '../tutorials/respiratorio'
import { stepRef } from '../store/pipeline'

export const DENGUE_CLIMA: TutorialDef = {
  id: 'dengue-clima',
  title: {
    pt: 'Dengue e clima — Nordeste 2015-2019',
    en: 'Dengue and climate — Northeast Brazil 2015-2019',
    es: 'Dengue y clima — Nordeste 2015-2019',
  },
  audience: 'both',
  steps: [
    {
      fn: 'sus_data_import',
      values: { region: 'Nordeste', system: 'SINAN-DENGUE', year: '2015:2019' },
      explain: {
        pt: 'Importamos casos notificados de dengue (SINAN) na região Nordeste, 2015 a 2019.',
        en: 'We import notified dengue cases (SINAN) for the Northeast region, 2015 to 2019.',
        es: 'Importamos casos notificados de dengue (SINAN) en la región Nordeste, 2015 a 2019.',
      },
    },
    {
      fn: 'sus_data_clean_encoding',
      values: {},
      explain: {
        pt: 'Corrigimos acentos e caracteres que costumam vir quebrados nos arquivos do DATASUS.',
        en: 'We fix accents and characters that commonly come broken in DATASUS files.',
        es: 'Corregimos acentos y caracteres que suelen venir rotos en los archivos de DATASUS.',
      },
    },
    {
      fn: 'sus_data_standardize',
      values: {},
      explain: {
        pt: 'Padronizamos nomes de coluna e valores para o vocabulário comum do climasus4r.',
        en: 'We standardize column names and values into climasus4r\'s common vocabulary.',
        es: 'Estandarizamos nombres de columna y valores al vocabulario común de climasus4r.',
      },
    },
    {
      fn: 'sus_data_filter_cid',
      values: { disease_group: 'dengue' },
      explain: {
        pt: 'Mantemos só os casos de dengue.',
        en: 'We keep only dengue cases.',
        es: 'Mantenemos solo los casos de dengue.',
      },
    },
    {
      fn: 'sus_data_create_variables',
      values: {},
      explain: {
        pt: 'Criamos variáveis de calendário (semana epidemiológica, entre outras), necessárias para agregar por semana no próximo passo.',
        en: 'We create calendar variables (epidemiological week, among others), needed to aggregate by week in the next step.',
        es: 'Creamos variables de calendario (semana epidemiológica, entre otras).',
      },
    },
    {
      id: 'dengue-health-agg',
      fn: 'sus_data_aggregate',
      values: { time_unit: 'week' },
      explain: {
        pt: 'Agregamos a série por semana — a unidade certa para dengue, mais fina que os meses usados no recorte respiratório.',
        en: 'We aggregate the series by week — the right unit for dengue, finer than the months used in the respiratory case study.',
        es: 'Agregamos la serie por semana — la unidad correcta para el dengue.',
      },
    },
    {
      id: 'dengue-chirps',
      fn: 'sus_grid_chirps',
      values: { resolution: 'monthly', years: '2015:2019' },
      explain: {
        pt: 'Trazemos chuva acumulada por satélite (CHIRPS) para os mesmos anos — chuva por satélite cobre bem o Nordeste, onde a rede de estações é irregular.',
        en: 'We bring in satellite-estimated accumulated rainfall (CHIRPS) for the same years — satellite rainfall covers the Northeast well, where the weather-station network is uneven.',
        es: 'Traemos lluvia acumulada por satélite (CHIRPS) para los mismos años.',
      },
    },
    {
      fn: 'sus_grid_join',
      values: { health_data: stepRef('dengue-health-agg'), grid_data: stepRef('dengue-chirps') },
      explain: {
        pt: 'Juntamos a chuva de satélite à série de dengue já agregada, por município e data.',
        en: 'We join the satellite rainfall to the already-aggregated dengue series, by municipality and date.',
        es: 'Unimos la lluvia satelital a la serie de dengue ya agregada.',
      },
    },
    {
      fn: 'sus_mod_dlnm',
      values: {},
      explain: {
        pt: 'Ajustamos o modelo DLNM: o risco de dengue sobe com o acúmulo de chuva ao longo de várias semanas, não no mesmo dia — é essa defasagem que o DLNM captura.',
        en: 'We fit the DLNM model: dengue risk rises with rainfall accumulated over several weeks, not on the same day — this lag is what DLNM captures.',
        es: 'Ajustamos el modelo DLNM.',
      },
    },
    {
      fn: 'sus_mod_plot_dlnm',
      values: {},
      explain: {
        pt: 'Visualizamos a curva de exposição-defasagem-risco.',
        en: 'We visualize the exposure-lag-risk curve.',
        es: 'Visualizamos la curva de exposición-rezago-riesgo.',
      },
    },
  ],
}
```

- [ ] **Step 2: `src/templates/respiratorio-pediatrico.ts`** (from `book/06`)

```ts
import type { TutorialDef } from '../tutorials/respiratorio'
import { stepRef } from '../store/pipeline'

export const RESPIRATORIO_PEDIATRICO: TutorialDef = {
  id: 'respiratorio-pediatrico',
  title: {
    pt: 'Mortalidade respiratória pediátrica e temperatura — Sudeste 2015-2019',
    en: 'Pediatric respiratory mortality and temperature — Southeast Brazil 2015-2019',
    es: 'Mortalidad respiratoria pediátrica y temperatura — Sudeste 2015-2019',
  },
  audience: 'both',
  steps: [
    {
      fn: 'sus_data_import',
      values: { uf: 'c("SP", "RJ", "MG", "ES")', system: 'SIM-DO', year: '2015:2019' },
      explain: {
        pt: 'Importamos óbitos (SIM-DO) em SP, RJ, MG e ES, 2015 a 2019.',
        en: 'We import deaths (SIM-DO) in SP, RJ, MG, and ES, 2015 to 2019.',
        es: 'Importamos óbitos (SIM-DO) en SP, RJ, MG y ES, 2015 a 2019.',
      },
    },
    { fn: 'sus_data_clean_encoding', values: {}, explain: {
      pt: 'Corrigimos acentos e caracteres que costumam vir quebrados nos arquivos do DATASUS.',
      en: 'We fix accents and characters that commonly come broken in DATASUS files.',
      es: 'Corregimos acentos y caracteres que suelen venir rotos.',
    } },
    { fn: 'sus_data_standardize', values: {}, explain: {
      pt: 'Padronizamos nomes de coluna e tipos.',
      en: 'We standardize column names and types.',
      es: 'Estandarizamos nombres de columna y tipos.',
    } },
    { fn: 'sus_data_filter_cid', values: { disease_group: 'respiratory' }, explain: {
      pt: 'Mantemos só as causas respiratórias (CID-10 capítulo J).',
      en: 'We keep only respiratory causes (ICD-10 chapter J).',
      es: 'Mantenemos solo las causas respiratorias (CIE-10 capítulo J).',
    } },
    { fn: 'sus_data_create_variables', values: { age_breaks: 'c(0, 5, 15, 60, Inf)' }, explain: {
      pt: 'Criamos faixas etárias e variáveis de calendário.',
      en: 'We create age groups and calendar variables.',
      es: 'Creamos franjas etarias y variables de calendario.',
    } },
    { fn: 'sus_data_filter_demographics', values: { age_range: 'c(0, 5)' }, explain: {
      pt: 'Recortamos para crianças menores de 5 anos.',
      en: 'We narrow down to children under 5.',
      es: 'Recortamos a niños menores de 5 años.',
    } },
    {
      id: 'resp-health-agg',
      fn: 'sus_data_aggregate',
      values: { time_unit: 'month' },
      explain: {
        pt: 'Agregamos a série por mês.',
        en: 'We aggregate the series by month.',
        es: 'Agregamos la serie por mes.',
      },
    },
    {
      id: 'resp-inmet',
      fn: 'sus_climate_inmet',
      values: { uf: 'c("SP", "RJ", "MG", "ES")', years: '2015:2019' },
      explain: {
        pt: 'Trazemos a temperatura das estações INMET nas mesmas UFs e anos.',
        en: 'We bring in INMET station temperature for the same states and years.',
        es: 'Traemos la temperatura de las estaciones INMET.',
      },
    },
    {
      fn: 'sus_climate_aggregate',
      values: { health_data: stepRef('resp-health-agg'), climate_data: stepRef('resp-inmet'), time_unit: 'month' },
      explain: {
        pt: 'Cruzamos saúde e clima, agregados por mês.',
        en: 'We cross health and climate data, aggregated by month.',
        es: 'Cruzamos salud y clima, agregados por mes.',
      },
    },
    { fn: 'sus_mod_dlnm', values: {}, explain: {
      pt: 'Ajustamos o modelo DLNM sobre a série integrada.',
      en: 'We fit the DLNM model over the integrated series.',
      es: 'Ajustamos el modelo DLNM sobre la serie integrada.',
    } },
    { fn: 'sus_mod_plot_dlnm', values: {}, explain: {
      pt: 'Visualizamos a curva de exposição-defasagem-risco.',
      en: 'We visualize the exposure-lag-risk curve.',
      es: 'Visualizamos la curva de exposición-rezago-riesgo.',
    } },
    { fn: 'sus_mod_af', values: {}, explain: {
      pt: 'Calculamos a fração de óbitos atribuível a temperatura fora da faixa segura — não assume que o efeito aparece no mesmo dia da exposição, porque já incorpora a defasagem ajustada pelo DLNM.',
      en: 'We calculate the fraction of deaths attributable to temperature outside the safe range — this does not assume the effect shows up the same day as exposure, since it already incorporates the lag structure fitted by DLNM.',
      es: 'Calculamos la fracción de óbitos atribuible a temperatura fuera del rango seguro.',
    } },
  ],
}
```

- [ ] **Step 3: `src/templates/cardio-calor.ts`** (from `book/08`)

```ts
import type { TutorialDef } from '../tutorials/respiratorio'
import { stepRef } from '../store/pipeline'

export const CARDIO_IDOSOS_CALOR: TutorialDef = {
  id: 'cardio-idosos-calor',
  title: {
    pt: 'Mortalidade cardiovascular em idosos e ondas de calor — SP 2010-2019',
    en: 'Cardiovascular mortality in older adults and heatwaves — São Paulo 2010-2019',
    es: 'Mortalidad cardiovascular en adultos mayores y olas de calor — SP 2010-2019',
  },
  audience: 'both',
  steps: [
    { fn: 'sus_data_import', values: { uf: 'SP', system: 'SIM-DO', year: '2010:2019' }, explain: {
      pt: 'Importamos óbitos (SIM-DO) em SP, 2010 a 2019 — uma janela mais longa, porque ondas de calor extremas não acontecem todo ano.',
      en: 'We import deaths (SIM-DO) in São Paulo state, 2010 to 2019 — a longer window, since extreme heatwaves don\'t happen every year.',
      es: 'Importamos óbitos (SIM-DO) en SP, 2010 a 2019.',
    } },
    { fn: 'sus_data_clean_encoding', values: {}, explain: {
      pt: 'Corrigimos acentos e caracteres que costumam vir quebrados.',
      en: 'We fix commonly broken accents and characters.',
      es: 'Corregimos acentos y caracteres.',
    } },
    { fn: 'sus_data_standardize', values: {}, explain: {
      pt: 'Padronizamos nomes de coluna e tipos.',
      en: 'We standardize column names and types.',
      es: 'Estandarizamos nombres de columna y tipos.',
    } },
    { fn: 'sus_data_filter_cid', values: { icd_codes: 'I', match_type: 'chapter' }, explain: {
      pt: 'Mantemos todo o capítulo I do CID-10 (doenças cardiovasculares).',
      en: 'We keep all of ICD-10 chapter I (cardiovascular disease).',
      es: 'Mantenemos todo el capítulo I de la CIE-10.',
    } },
    { fn: 'sus_data_create_variables', values: { age_breaks: 'c(0, 60, Inf)' }, explain: {
      pt: 'Criamos a faixa etária que separa idosos (60+) do restante.',
      en: 'We create the age group separating older adults (60+) from the rest.',
      es: 'Creamos la franja etaria que separa a los adultos mayores (60+).',
    } },
    { fn: 'sus_data_filter_demographics', values: { age_range: 'c(60, Inf)' }, explain: {
      pt: 'Recortamos para a população idosa.',
      en: 'We narrow down to the older-adult population.',
      es: 'Recortamos a la población adulta mayor.',
    } },
    {
      id: 'cardio-health-agg',
      fn: 'sus_data_aggregate',
      values: { time_unit: 'day' },
      explain: {
        pt: 'Agregamos por dia — o efeito do calor sobre óbito cardiovascular agudo é quase imediato.',
        en: 'We aggregate by day — the effect of heat on acute cardiovascular death is nearly immediate.',
        es: 'Agregamos por día.',
      },
    },
    {
      id: 'cardio-inmet',
      fn: 'sus_climate_inmet',
      values: { uf: 'SP', years: '2010:2019' },
      explain: {
        pt: 'Trazemos temperatura das estações INMET de SP, mesmos anos.',
        en: 'We bring in INMET station temperature for São Paulo, same years.',
        es: 'Traemos temperatura de las estaciones INMET de SP.',
      },
    },
    {
      id: 'cardio-merged',
      fn: 'sus_climate_aggregate',
      values: { health_data: stepRef('cardio-health-agg'), climate_data: stepRef('cardio-inmet'), time_unit: 'day' },
      explain: {
        pt: 'Cruzamos a série diária de óbitos com a série diária de temperatura.',
        en: 'We cross the daily death series with the daily temperature series.',
        es: 'Cruzamos la serie diaria de óbitos con la serie diaria de temperatura.',
      },
    },
    {
      fn: 'sus_climate_compute_heatwaves',
      values: { method: 'WHO', percentile: '90' },
      explain: {
        pt: 'Detectamos ondas de calor com a metodologia da OMS, percentil 90 como limiar.',
        en: 'We detect heatwaves using the WHO methodology, 90th percentile as the threshold.',
        es: 'Detectamos olas de calor con la metodología de la OMS, percentil 90 como umbral.',
      },
    },
    { fn: 'sus_mod_dlnm', values: {}, explain: {
      pt: 'Ajustamos o DLNM sobre a série diária — aqui a maior parte do efeito tende a aparecer nos primeiros dias após a exposição ao calor.',
      en: 'We fit DLNM over the daily series — here most of the effect tends to show up in the first days after heat exposure.',
      es: 'Ajustamos el DLNM sobre la serie diaria.',
    } },
    { fn: 'sus_mod_af', values: {}, explain: {
      pt: 'Calculamos a fração e o número de óbitos atribuíveis ao calor extremo.',
      en: 'We calculate the fraction and number of deaths attributable to extreme heat.',
      es: 'Calculamos la fracción y el número de óbitos atribuibles al calor extremo.',
    } },
    { fn: 'sus_mod_plot_af', values: {}, explain: {
      pt: 'Visualizamos a fração atribuível em gráfico e tabela, prontos para comunicação.',
      en: 'We visualize the attributable fraction as a chart and table, ready to communicate.',
      es: 'Visualizamos la fracción atribuible en gráfico y tabla.',
    } },
  ],
}
```

- [ ] **Step 4: `src/templates/hospitalizacao-frio.ts`** (from `book/09`)

```ts
import type { TutorialDef } from '../tutorials/respiratorio'
import { stepRef } from '../store/pipeline'

export const HOSPITALIZACAO_FRIO: TutorialDef = {
  id: 'hospitalizacao-frio',
  title: {
    pt: 'Hospitalizações respiratórias e frio extremo — Região Sul 2010-2019',
    en: 'Respiratory hospitalizations and extreme cold — Southern Brazil 2010-2019',
    es: 'Hospitalizaciones respiratorias y frío extremo — Región Sur 2010-2019',
  },
  audience: 'both',
  steps: [
    { fn: 'sus_data_import', values: { region: 'Sul', system: 'SIH-RD', year: '2010:2019' }, explain: {
      pt: 'Importamos internações (SIH-RD) na região Sul, 2010 a 2019.',
      en: 'We import hospitalizations (SIH-RD) in the Southern region, 2010 to 2019.',
      es: 'Importamos internaciones (SIH-RD) en la región Sur, 2010 a 2019.',
    } },
    { fn: 'sus_data_clean_encoding', values: {}, explain: {
      pt: 'Corrigimos acentos e caracteres que costumam vir quebrados.',
      en: 'We fix commonly broken accents and characters.',
      es: 'Corregimos acentos y caracteres.',
    } },
    { fn: 'sus_data_standardize', values: {}, explain: {
      pt: 'Padronizamos nomes de coluna e tipos.',
      en: 'We standardize column names and types.',
      es: 'Estandarizamos nombres de columna y tipos.',
    } },
    { fn: 'sus_data_filter_cid', values: { icd_codes: 'c("J09", "J18")', match_type: 'range' }, explain: {
      pt: 'Mantemos a faixa J09-J18 (pneumonias e influenza) — mais específica que o capítulo I inteiro usado no recorte cardiovascular.',
      en: 'We keep the J09-J18 range (pneumonia and influenza) — more specific than the whole chapter I used in the cardiovascular case study.',
      es: 'Mantenemos el rango J09-J18 (neumonías e influenza).',
    } },
    { fn: 'sus_data_create_variables', values: {}, explain: {
      pt: 'Criamos variáveis de calendário.',
      en: 'We create calendar variables.',
      es: 'Creamos variables de calendario.',
    } },
    {
      id: 'frio-health-agg',
      fn: 'sus_data_aggregate',
      values: { time_unit: 'day' },
      explain: {
        pt: 'Agregamos por dia.',
        en: 'We aggregate by day.',
        es: 'Agregamos por día.',
      },
    },
    {
      id: 'frio-inmet',
      fn: 'sus_climate_inmet',
      values: { region: 'Sul', years: '2010:2019' },
      explain: {
        pt: 'Trazemos temperatura das estações INMET da região Sul, mesmos anos.',
        en: 'We bring in INMET station temperature for the Southern region, same years.',
        es: 'Traemos temperatura de las estaciones INMET de la región Sur.',
      },
    },
    {
      id: 'frio-merged',
      fn: 'sus_climate_aggregate',
      values: { health_data: stepRef('frio-health-agg'), climate_data: stepRef('frio-inmet'), time_unit: 'day' },
      explain: {
        pt: 'Cruzamos a série diária de internações com a série diária de temperatura.',
        en: 'We cross the daily hospitalization series with the daily temperature series.',
        es: 'Cruzamos la serie diaria de internaciones con la serie diaria de temperatura.',
      },
    },
    {
      fn: 'sus_climate_compute_coldwaves',
      values: { method: 'WHO', percentile: '10' },
      explain: {
        pt: 'Detectamos ondas de frio com a metodologia da OMS, percentil 10 como limiar — o espelho do percentil 90 usado para calor.',
        en: 'We detect cold waves using the WHO methodology, 10th percentile as the threshold — the mirror of the 90th percentile used for heat.',
        es: 'Detectamos olas de frío con la metodología de la OMS, percentil 10 como umbral.',
      },
    },
    { fn: 'sus_mod_its', values: {}, explain: {
      pt: 'Avaliamos com série interrompida se os períodos de onda de frio mudam o nível ou a tendência das internações — um desenho mais leve que o DLNM, indicado para perguntas sobre um evento específico.',
      en: 'We use an interrupted time series to assess whether cold-wave periods change the level or trend of hospitalizations — a lighter design than DLNM, suited to questions about a specific event.',
      es: 'Evaluamos con serie interrumpida si los períodos de ola de frío cambian el nivel o la tendencia de las internaciones.',
    } },
  ],
}
```

- [ ] **Step 5: `src/templates/index.ts`**

```ts
import { RESPIRATORIO_SP } from '../tutorials/respiratorio'
import { DENGUE_CLIMA } from './dengue'
import { RESPIRATORIO_PEDIATRICO } from './respiratorio-pediatrico'
import { CARDIO_IDOSOS_CALOR } from './cardio-calor'
import { HOSPITALIZACAO_FRIO } from './hospitalizacao-frio'
import type { TutorialDef } from '../tutorials/respiratorio'

export const TEMPLATES: TutorialDef[] = [
  RESPIRATORIO_SP,
  DENGUE_CLIMA,
  RESPIRATORIO_PEDIATRICO,
  CARDIO_IDOSOS_CALOR,
  HOSPITALIZACAO_FRIO,
]
```

- [ ] **Step 6: Verify each template generates correct, function-signature-matching R code**

With `npm run dev` running, for each of the 4 new templates, use `window.__generateR` in the
browser console (or `javascript_tool`) to build the step array manually (matching the `fn`/
`values` above, with real ids in place of the string ids) and inspect the output. Confirm:
- Every function call's arguments match `src/catalog/functions.json`'s arg names for that
  function (no typos in argument names — e.g. `icd_codes` not `cid_codes`).
- The two combiner steps (`sus_grid_join` in dengue, `sus_climate_aggregate` in the other three)
  correctly reference the health-chain variable as their first positional arg and the climate/
  grid variable as the named second arg (this is what Task 1 fixes).
- Note whether `outcome_col`/`n_obitos` default matches what `sus_data_aggregate` actually
  produces for `SINAN-DENGUE`/`SIH-RD` systems — if the generated code's variable really does
  need an explicit `outcome_col`, add it to that template's relevant step's `values` now (this is
  the one piece of information that could only be nailed down by running the actual generator,
  not by reading source).

- [ ] **Step 7: Commit**

```bash
git add src/templates/
git commit -m "$(cat <<'EOF'
Add 4 ready-made pipeline templates from the book's case studies

Dengue/climate, pediatric respiratory, cardiovascular/heatwave, and cold-wave
hospitalization — each pre-fills the exact pipeline described in book/07-09,
so Vigilância users get a working starting point instead of an empty canvas.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: UI — templates list filtered by mode, replacing the single-tutorial button

**Files:**
- Modify: `src/ui/TopBar.tsx` (button label + click handler)
- Modify: `src/ui/TutorialOverlay.tsx` (or create `src/ui/TemplatesList.tsx` if the overlay isn't
  naturally a list — check current file first with
  `grep -n "TUTORIALS\|RESPIRATORIO_SP" src/ui/TopBar.tsx src/ui/TutorialOverlay.tsx`)

**Interfaces:**
- Consumes: `TEMPLATES` (Task 5), `mode` from the store, `startTutorial` (existing store action,
  unchanged signature).

- [ ] **Step 1: Inspect current wiring**

```bash
grep -n "TUTORIALS\|RESPIRATORIO_SP\|startTutorial\|Tutorial guiado" src/ui/TopBar.tsx
```

Read the surrounding code (the button's `onClick` and any existing list-rendering) before
editing — this file may already have grown a settings-menu refactor in progress (see the
"trabalho pendente" already in the working tree); don't revert unrelated changes there.

- [ ] **Step 2: Replace the single-tutorial trigger with a mode-filtered list**

Change the top-bar button: if there is exactly one applicable template it starts it directly
(current behavior preserved); if there is more than one, it opens a small dropdown/list (reuse
whatever existing overlay/menu pattern this file already uses for the mode-badge or settings
menu — follow the established pattern in this file rather than introducing a new one). List
items are `TEMPLATES.filter((t) => !t.audience || t.audience === 'both' || t.audience === mode)`
— Pesquisa mode still sees every template (audience 'both' or 'pesquisa' or unset), Vigilância
sees 'both'/'vigilancia'/unset. Since all 4 templates in this plan are marked `audience: 'both'`,
this filter has no visible effect yet, but is the hook for any future audience-restricted
template.

Each list item's label uses `template.title[lang]`; clicking it calls `startTutorial(template)`
exactly as the current single button does for `RESPIRATORIO_SP`.

- [ ] **Step 3: Manual UI check**

Run the app, open the templates list, confirm all 5 templates appear (existing +4 new) with
correct titles in the active language, and that clicking each one populates the canvas with the
right step count (5 for `RESPIRATORIO_SP`, 10 for dengue, 11 for pediátrico, 13 for cardio, 9 for
frio — recount against each file's `steps` array length before asserting this in the verify
script in Task 7).

- [ ] **Step 4: Commit**

```bash
git add src/ui/TopBar.tsx src/ui/TutorialOverlay.tsx
git commit -m "$(cat <<'EOF'
List all pipeline templates, filtered by usage mode, instead of one fixed tutorial button

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Verify-script coverage

**Files:**
- Modify: `scripts/verify-graph.mjs`

**Interfaces:**
- Consumes: the running app's `window.__generateR`/DOM, same pattern already used in this file
  for the existing tutorial checks.

- [ ] **Step 1: Add per-template node-count checks**

Following the existing pattern in `scripts/verify-graph.mjs` for the current tutorial flow, add
one `check(...)` per new template confirming: opening it from the templates list produces the
exact node count from that template's `steps.length`, and (for the two templates using a
combiner function) that the generated R code contains both expected variable names (e.g. for
dengue: both `dados` and `ambiente` appear in the `sus_grid_join(...)` call).

- [ ] **Step 2: Run the full verify suite**

```bash
npm run dev &
npm run engine &
sleep 3
node scripts/verify-ui.mjs
node scripts/verify-graph.mjs
node scripts/verify-run.mjs
```

All checks must pass (`N/N checks passed`) before proceeding.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-graph.mjs
git commit -m "$(cat <<'EOF'
Add template coverage to verify-graph.mjs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage**: Components 1 (templates → Tasks 4-6), 2 (plain language → Task 3), 3
  (advanced params → Task 2), 4 (first-arg fix → Task 1) all have tasks. Testing section →
  Task 7. Edge cases (mode switch mid-pipeline, project saved before this feature, fallback for
  uncurated functions) require no dedicated task — they're structural guarantees already built
  into each task's design (additive overlays, optional fields with safe defaults).
- **Placeholder scan**: none found — every step has literal code or a literal shell command.
- **Type consistency**: `friendlyName`/`friendlyDescription` signature changes in Task 3 are
  referenced consistently in Tasks 3's own steps; `TutorialStepDef.id`/`TutorialDef.audience`
  from Task 4 are used with matching names in Task 5's templates and Task 6's filter.
- **Known residual risk, called out explicitly rather than guessed away**: exact `outcome_col`
  values and a couple of `sus_data_import`/`sus_climate_inmet` argument value formats (e.g.
  whether `region` accepts `"Nordeste"` literally) could only be confirmed by actually running
  climasus4r, not by reading its R source in this planning pass — Task 5 Step 6 and Task 7 Step 2
  are the checkpoints that catch any mismatch before this ships.
