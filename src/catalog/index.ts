import raw from './functions.json'
import { FRIENDLY } from './friendly'
import { ARG_DOCS } from './arg-docs'
import type { Lang } from '../store/pipeline'

export type StageId = 'preparacao' | 'integracao' | 'modelagem' | 'rap'

export interface ArgSpec {
  name: string
  default: string | null
  required: boolean
  type: 'enum' | 'boolean' | 'number' | 'text'
  options: string[]
  doc: string
}

export interface FnSpec {
  name: string
  stage: StageId
  family: string
  title: string
  description: string
  args: ArgSpec[]
  keywords?: string[]
}

export const CATALOG = raw as FnSpec[]
export const byName = new Map(CATALOG.map((f) => [f.name, f]))

export const searchFn = (query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return CATALOG
  return CATALOG.filter((f) => {
    const hay = [
      f.name,
      f.title,
      f.description,
      f.family,
      f.stage,
      ...(f.keywords ?? []),
      ...f.args.flatMap((a) => [a.name, a.doc, ...(a.options ?? [])]),
    ].join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export const STAGES: { id: StageId; color: string; icon: string }[] = [
  { id: 'preparacao', color: 'var(--stage-blue)', icon: '⚕' },
  { id: 'integracao', color: 'var(--stage-cyan)', icon: '🌍' },
  { id: 'modelagem', color: 'var(--stage-magenta)', icon: '📈' },
  { id: 'rap', color: 'var(--stage-yellow)', icon: '📦' },
]

export const stageColor = (id: StageId) => STAGES.find((s) => s.id === id)!.color

// plain-language overlay (src/catalog/friendly.ts) over the roxygen-derived title/description —
// falls back to the technical text for any function not yet covered, so new sus_* functions
// added by a future `build-catalog.mjs` run degrade gracefully instead of showing blank/undefined
export const friendlyName = (fn: FnSpec, lang: Lang): string => FRIENDLY[fn.name]?.[lang]?.name ?? fn.title
export const friendlyDescription = (fn: FnSpec, lang: Lang): string =>
  FRIENDLY[fn.name]?.[lang]?.description ?? fn.description ?? fn.title

// per-parameter help overlay (src/catalog/arg-docs.ts) — falls back to the English roxygen
// arg.doc for any function/param not yet translated, same graceful-degradation rule as above
export const friendlyArgDoc = (fnName: string, arg: ArgSpec, lang: Lang): string =>
  ARG_DOCS[fnName]?.[arg.name]?.[lang] ?? arg.doc

// first-arg names that receive piped data — such steps chain with |>
const PIPE_ARGS = new Set([
  'df', 'data', 'x', 'health_data', 'observed', 'fit', 'fits', 'cw_result',
  'df_filled', 'hw_result', 'exposure_df', 'vulnerability', 'pipeline', 'rap',
  'municipalities',
])

export function pipeArg(f: FnSpec): string | null {
  const a = f.args[0]
  return a && PIPE_ARGS.has(a.name) ? a.name : null
}

// variable name for blocks started by a source function
export function blockVar(f: FnSpec): string {
  if (f.family === 'climate') return 'clima'
  if (f.family === 'grid') return 'ambiente'
  if (f.family === 'censo') return 'censo'
  if (f.stage === 'modelagem') return 'modelo'
  if (f.stage === 'rap') return 'rap'
  return 'dados'
}
