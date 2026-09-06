import { create } from 'zustand'
import { byName, pipeArg, blockVar, type FnSpec } from '../catalog'
import * as engine from '../engine/client'
import type { EngineStatus, StepResult } from '../engine/client'
import type { TutorialDef } from '../tutorials/respiratorio'
import type { PipelineTemplate } from '../pipelines/templates'
import { saveProjectFile, openProjectFile, pickDataFile, saveRemoteFile } from '../project/io'
import { t, tp } from '../i18n'

export interface Step {
  id: string
  fn: string
  values: Record<string, string> // raw user input per arg name; '' = use default
}

export type Lang = 'pt' | 'en' | 'es'

// usage mode: chosen per project, foundation for future differences in language/guardrails
// between a vigilância/gestão workflow and an advanced-research workflow. Purely a label +
// persisted choice for now — it doesn't yet gate or hide anything (see project notes).
export type UsageMode = 'vigilancia' | 'pesquisa'

export type StepRunState = 'idle' | 'running' | 'ok' | 'error' | 'stale'

export interface PipelineIssue {
  stepId: string
  fn: string
  arg?: string
  message: string
}

const PIPELINE_SCHEMA_VERSION = 4

interface PipelineState {
  steps: Step[]
  past: Step[][] // undo stack of prior `steps` snapshots (in-memory only, not persisted)
  future: Step[][] // redo stack, cleared on any new edit
  selectedStep: string | null
  inspectFn: string | null // function being previewed from the library
  lang: Lang
  theme: 'dark' | 'light'
  engineStatus: EngineStatus
  engineIssue: string | null
  centerTab: 'code' | 'results'
  expandedPanel: 'graph' | 'output' | null // maximized panel, hiding the side columns
  stepRun: Record<string, StepRunState>
  stepResults: Record<string, StepResult>
  runError: string | null
  validationIssues: PipelineIssue[]
  tutorialStep: number | null // index into the active tutorial's steps, or null if none active
  tutorialFocusId: string | null // step id currently spotlighted by the tutorial overlay
  activeTutorialId: string | null // which TutorialDef.id is active, for the overlay to look up explain text
  helpOpen: boolean // Help / Pipelines panel visibility
  aboutOpen: boolean // About / institutional panel visibility
  mode: UsageMode | null // usage mode for this project; null = not chosen yet
  modeOpen: boolean // mode selector panel visibility
  addStep: (fn: string) => void
  removeStep: (id: string) => void
  moveStep: (id: string, dir: -1 | 1) => void
  reorderStep: (id: string, beforeId: string) => void
  setValue: (id: string, arg: string, value: string) => void
  undo: () => void
  redo: () => void
  select: (id: string | null) => void
  inspect: (fn: string | null) => void
  setLang: (l: Lang) => void
  toggleTheme: () => void
  clear: () => void
  setCenterTab: (t: 'code' | 'results') => void
  toggleExpand: (panel: 'graph' | 'output') => void
  runPipeline: (upToStepId?: string) => Promise<void>
  restartEngine: () => Promise<void>
  exportReport: () => Promise<void>
  startTutorial: (tutorial: TutorialDef) => void
  nextTutorialStep: () => void
  prevTutorialStep: () => void
  endTutorial: () => void
  openHelp: () => void
  closeHelp: () => void
  openAbout: () => void
  closeAbout: () => void
  setMode: (m: UsageMode) => void
  openModeSelector: () => void
  closeModeSelector: () => void
  loadTemplate: (tpl: PipelineTemplate) => void
  saveProject: () => Promise<void>
  openProject: () => Promise<void>
  startFromDataFile: () => Promise<void>
}

const KEY = 'climasus-plus-pipeline-v2'

type ProjectData = { steps: Step[]; lang: Lang; theme: 'dark' | 'light'; mode: UsageMode | null }

function serializeProject(d: ProjectData): string {
  return JSON.stringify({
    schemaVersion: PIPELINE_SCHEMA_VERSION, steps: d.steps, lang: d.lang, theme: d.theme, mode: d.mode,
  })
}

// Parse + validate untrusted JSON (a project file or localStorage). Throws on malformed input.
// The steps/lang/theme shape has been stable across schema versions, so we validate shape rather
// than gate on version. Unknown fn names are caught later by validateSteps (unknownFn).
function deserializeProject(raw: string): ProjectData {
  const parsed = JSON.parse(raw)
  const steps = parsed?.steps
  const ok = Array.isArray(steps) && steps.every(
    (s: unknown) => !!s && typeof (s as Step).fn === 'string' && typeof (s as Step).values === 'object' && (s as Step).values !== null,
  )
  if (!ok) throw new Error('invalid project')
  return {
    steps: (steps as Partial<Step>[]).map((s) => ({
      id: typeof s.id === 'string' ? s.id : uid(),
      fn: s.fn!,
      values: normalizeStepValues(s.values),
    })),
    lang: (['pt', 'en', 'es'] as const).includes(parsed.lang) ? parsed.lang : 'pt',
    theme: parsed.theme === 'light' ? 'light' : 'dark',
    mode: (['vigilancia', 'pesquisa'] as const).includes(parsed.mode) ? parsed.mode : null,
  }
}

function normalizeStepValues(values: unknown): Record<string, string> {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('invalid project')
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
    if (typeof key !== 'string') throw new Error('invalid project')
    if (value == null) {
      out[key] = ''
    } else if (typeof value === 'string') {
      out[key] = value
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      out[key] = String(value)
    } else {
      throw new Error('invalid project')
    }
  }
  return out
}

function load(): ProjectData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return deserializeProject(raw)
  } catch { /* corrupt state → start fresh */ }
  return { steps: [], lang: 'pt', theme: 'dark', mode: null }
}

let seq = Date.now()
const uid = () => `s${(seq++).toString(36)}`

export const usePipeline = create<PipelineState>((set, get) => ({
  ...load(),
  past: [],
  future: [],
  selectedStep: null,
  inspectFn: null,
  engineStatus: 'offline' as EngineStatus,
  engineIssue: null,
  centerTab: 'code' as const,
  expandedPanel: null,
  stepRun: {},
  stepResults: {},
  runError: null,
  validationIssues: [],
  tutorialStep: null,
  tutorialFocusId: null,
  activeTutorialId: null,
  helpOpen: false,
  aboutOpen: false,
  modeOpen: false,
  addStep: (fn) => {
    pushHistory(get, set)
    const step: Step = { id: uid(), fn, values: {} }
    set((s) => ({ steps: [...s.steps, step], selectedStep: step.id, inspectFn: null }))
    persist(get)
  },
  removeStep: (id) => {
    pushHistory(get, set)
    set((s) => ({
      steps: s.steps.filter((x) => x.id !== id),
      selectedStep: s.selectedStep === id ? null : s.selectedStep,
    }))
    persist(get)
  },
  moveStep: (id, dir) => {
    const s0 = get()
    const i = s0.steps.findIndex((x) => x.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= s0.steps.length) return
    pushHistory(get, set)
    set((s) => {
      const steps = [...s.steps]
      ;[steps[i], steps[j]] = [steps[j], steps[i]]
      return { steps }
    })
    persist(get)
  },
  // drag-and-drop reorder: move `id` to sit right before `beforeId`
  reorderStep: (id, beforeId) => {
    if (id === beforeId) return
    const s0 = get()
    const from = s0.steps.findIndex((x) => x.id === id)
    if (from < 0 || s0.steps.findIndex((x) => x.id === beforeId) < 0) return
    pushHistory(get, set)
    set((s) => {
      const steps = [...s.steps]
      const [moved] = steps.splice(steps.findIndex((x) => x.id === id), 1)
      steps.splice(steps.findIndex((x) => x.id === beforeId), 0, moved)
      return { steps }
    })
    persist(get)
  },
  setValue: (id, arg, value) => {
    const key = `${id}:${arg}`
    const now = Date.now()
    if (key !== lastEditKey || now - lastEditAt > EDIT_COALESCE_MS) pushHistory(get, set)
    lastEditKey = key
    lastEditAt = now
    set((s) => ({
      steps: s.steps.map((x) => (x.id === id ? { ...x, values: { ...x.values, [arg]: value } } : x)),
    }))
    persist(get)
  },
  undo: () => {
    const { past, steps, selectedStep } = get()
    if (!past.length) return
    const prev = past[past.length - 1]
    set((s) => ({
      steps: prev,
      past: s.past.slice(0, -1),
      future: [...s.future, steps],
      selectedStep: prev.some((x) => x.id === selectedStep) ? selectedStep : null,
    }))
    persist(get)
  },
  redo: () => {
    const { future, steps, selectedStep } = get()
    if (!future.length) return
    const next = future[future.length - 1]
    set((s) => ({
      steps: next,
      future: s.future.slice(0, -1),
      past: [...s.past, steps],
      selectedStep: next.some((x) => x.id === selectedStep) ? selectedStep : null,
    }))
    persist(get)
  },
  select: (id) => set({ selectedStep: id, inspectFn: null }),
  inspect: (fn) => set({ inspectFn: fn, selectedStep: null }),
  setLang: (lang) => {
    set({ lang })
    persist(get)
  },
  toggleTheme: () => {
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' }))
    persist(get)
  },
  clear: () => {
    pushHistory(get, set)
    set({
      steps: [], selectedStep: null, stepRun: {}, stepResults: {}, runError: null,
      validationIssues: [], engineIssue: null,
      tutorialStep: null, tutorialFocusId: null, activeTutorialId: null,
    })
    persist(get)
  },
  setCenterTab: (centerTab) => set({ centerTab }),
  toggleExpand: (panel) => set((s) => ({ expandedPanel: s.expandedPanel === panel ? null : panel })),
  runPipeline: async (upToStepId) => {
    const { steps, engineStatus, lang } = get()
    if (engineStatus !== 'ready' || !steps.length) return
    const cut = upToStepId ? steps.findIndex((s) => s.id === upToStepId) + 1 : steps.length
    const slice = steps.slice(0, cut)
    const issues = validateSteps(slice, lang)
    if (issues.length) {
      set({
        runError: issues[0].message,
        validationIssues: issues,
        selectedStep: issues[0].stepId,
        centerTab: 'results',
      })
      return
    }
    const engineSteps = generateRSteps(slice)
    set({
      engineStatus: 'busy',
      engineIssue: null,
      centerTab: 'results',
      runError: null,
      validationIssues: [],
      stepRun: Object.fromEntries(slice.map((s) => [s.id, 'running'])),
    })
    try {
      const res = await engine.run(engineSteps.map(({ var: v, code }) => ({ var: v, code })))
      const stepRun: Record<string, StepRunState> = {}
      const stepResults = { ...get().stepResults }
      const runStamp = `${Date.now()}`
      // results are indexed from ranFrom; earlier steps were cached (keep prior result, mark ok)
      slice.forEach((s, i) => {
        const r = res.results.find((x) => x.i === i + 1)
        if (r) {
          stepResults[s.id] = { ...r, cacheKey: `${runStamp}-${i + 1}` }
          stepRun[s.id] = r.ok ? 'ok' : 'error'
        } else if (i + 1 < res.ranFrom) {
          stepRun[s.id] = stepResults[s.id] ? 'ok' : 'stale'
        } else {
          stepRun[s.id] = 'idle' // after a failed step: not run
        }
      })
      set({ stepRun, stepResults, engineStatus: 'ready', engineIssue: null })
      const firstError = slice.find((s) => stepRun[s.id] === 'error')
      set({ selectedStep: (firstError ?? slice[slice.length - 1]).id })
    } catch (e) {
      set({
        engineStatus: (await engine.health()) ? 'ready' : 'offline',
        engineIssue: await engine.engineBootError() || null,
        runError: String(e),
        stepRun: {},
      })
    }
  },
  restartEngine: async () => {
    try { await engine.resetSession() } catch { /* offline */ }
    set({ stepRun: {}, stepResults: {}, runError: null, engineIssue: null })
  },
  exportReport: async () => {
    try {
      const url = await engine.generateReport('Relatorio climasus+ Studio')
      await saveRemoteFile(url, 'relatorio-climasus.html')
    } catch (e) {
      set({ runError: String(e), centerTab: 'results' })
    }
  },
  startTutorial: (tutorial) => {
    pushHistory(get, set)
    const steps: Step[] = tutorial.steps.map((s) => ({ id: uid(), fn: s.fn, values: { ...s.values } }))
    const first = steps[0]
    set({
      steps,
      selectedStep: first?.id ?? null,
      inspectFn: null,
      stepRun: {},
      stepResults: {},
      runError: null,
      validationIssues: [],
      tutorialStep: 0,
      tutorialFocusId: first?.id ?? null,
      activeTutorialId: tutorial.id,
    })
    persist(get)
    if (first) get().runPipeline(first.id)
  },
  nextTutorialStep: () => {
    const { steps, tutorialStep } = get()
    if (tutorialStep == null || tutorialStep + 1 >= steps.length) return
    const i = tutorialStep + 1
    const step = steps[i]
    set({ tutorialStep: i, tutorialFocusId: step.id, selectedStep: step.id })
    get().runPipeline(step.id)
  },
  prevTutorialStep: () => {
    const { steps, tutorialStep } = get()
    if (tutorialStep == null || tutorialStep === 0) return
    const i = tutorialStep - 1
    const step = steps[i]
    set({ tutorialStep: i, tutorialFocusId: step.id, selectedStep: step.id })
  },
  endTutorial: () => set({ tutorialStep: null, tutorialFocusId: null, activeTutorialId: null }),
  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),
  openAbout: () => set({ aboutOpen: true }),
  closeAbout: () => set({ aboutOpen: false }),
  setMode: (mode) => {
    set({ mode, modeOpen: false })
    persist(get)
  },
  openModeSelector: () => set({ modeOpen: true }),
  closeModeSelector: () => set({ modeOpen: false }),
  loadTemplate: (tpl) => {
    pushHistory(get, set)
    const steps: Step[] = tpl.steps.map((s) => ({ id: uid(), fn: s.fn, values: { ...s.values } }))
    set({ ...freshRun, steps, selectedStep: steps[0]?.id ?? null })
    persist(get)
  },
  saveProject: async () => {
    const { steps, lang, theme, mode } = get()
    try {
      await saveProjectFile(serializeProject({ steps, lang, theme, mode }))
    } catch (e) {
      set({ runError: String(e), centerTab: 'results' })
    }
  },
  openProject: async () => {
    let raw: string | null
    try {
      raw = await openProjectFile()
    } catch (e) {
      set({ runError: String(e), centerTab: 'results' })
      return
    }
    if (raw == null) return // user cancelled
    try {
      const { steps, lang, theme, mode } = deserializeProject(raw)
      pushHistory(get, set)
      set({ ...freshRun, steps, lang, theme, mode, selectedStep: steps[0]?.id ?? null })
      persist(get)
    } catch {
      set({ runError: t('invalidProject', get().lang), centerTab: 'results' })
    }
  },
  startFromDataFile: async () => {
    const path = await pickDataFile()
    if (!path) return
    // ponytail: path stored raw; toR() wraps it in "..." — fine on macOS/Linux, would need \\ escaping on Windows
    pushHistory(get, set)
    const step: Step = { id: uid(), fn: 'sus_data_read', values: { path } }
    set((s) => ({ steps: [...s.steps, step], selectedStep: step.id, inspectFn: null, helpOpen: false }))
    persist(get)
  },
}))

// poll engine health; pause while a run is in flight
async function pollHealth() {
  const s = usePipeline.getState()
  if (s.engineStatus !== 'busy') {
    const ok = await engine.health()
    const cur = usePipeline.getState().engineStatus
    if (cur !== 'busy') usePipeline.setState({
      engineStatus: ok ? 'ready' : 'offline',
      engineIssue: ok ? null : (await engine.engineBootError()) || null,
    })
  }
  setTimeout(pollHealth, 5000)
}
pollHealth()

function persist(get: () => PipelineState) {
  const { steps, lang, theme, mode } = get()
  localStorage.setItem(KEY, serializeProject({ steps, lang, theme, mode }))
}

// undo history — capped in-memory stack of `steps` snapshots, not persisted across reloads
const HISTORY_LIMIT = 50
function pushHistory(get: () => PipelineState, set: (partial: Partial<PipelineState>) => void) {
  const { steps, past } = get()
  set({ past: [...past, steps].slice(-HISTORY_LIMIT), future: [] })
}

// consecutive setValue calls on the same field within this window coalesce into one undo step,
// so undo reverts a whole "burst" of typing rather than one keystroke at a time
const EDIT_COALESCE_MS = 800
let lastEditKey: string | null = null
let lastEditAt = 0

// state reset shared by loadTemplate/openProject — clears run + tutorial + help, keeps nothing stale
const freshRun = {
  selectedStep: null as string | null, inspectFn: null as string | null,
  stepRun: {}, stepResults: {}, runError: null, validationIssues: [],
  engineIssue: null as string | null,
  tutorialStep: null, tutorialFocusId: null, activeTutorialId: null, helpOpen: false, aboutOpen: false,
  modeOpen: false,
}

// ---- R code generation ----------------------------------------------------

const BARE = /^(TRUE|FALSE|NULL|NA|Inf|-?[\d.]+([eE][+-]?\d+)?|-?\d+:-?\d+)$/

// step-reference values: an arg can point at an EARLIER step's result instead of literal text
// (e.g. a second data.frame/weights/covariates arg a function needs beyond its piped first arg).
// Stored as a plain string in `step.values` so no schema change is needed.
const STEP_REF_PREFIX = '@step:'
export const stepRef = (id: string): string => `${STEP_REF_PREFIX}${id}`
export const isStepRef = (v: string): boolean => v.startsWith(STEP_REF_PREFIX)
export const stepRefId = (v: string): string => v.slice(STEP_REF_PREFIX.length)

function toR(value: string, spec: { type: string }): string {
  const v = value.trim()
  if (spec.type === 'boolean') return v
  if (spec.type === 'number') return v
  // already an R expression? (vector, call, quoted string, formula, bare literal)
  if (BARE.test(v) || v.startsWith('"') || v.startsWith("'") || v.startsWith('~') || /[()]/.test(v)) return v
  return `"${v}"`
}

function stepArgs(step: Step, fn: FnSpec, skipFirst: boolean, varByStepId: Record<string, string>): string[] {
  const out: string[] = []
  for (const a of fn.args) {
    if (skipFirst && a.name === fn.args[0].name) continue
    const v = (step.values[a.name] ?? '').trim()
    if (!v) continue
    if (isStepRef(v)) {
      const refVar = varByStepId[stepRefId(v)]
      if (refVar) out.push(`${a.name} = ${refVar}`) // unquoted: a real R variable reference
      continue
    }
    out.push(`${a.name} = ${toR(v, a)}`)
  }
  return out
}

const NUMERIC = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/

function validateSteps(steps: Step[], lang: Lang): PipelineIssue[] {
  const issues: PipelineIssue[] = []
  const built = buildSteps(steps)
  const posByStepId = new Map(built.map((b, i) => [b.stepId, i]))
  built.forEach((item, pos) => {
    const step = steps.find((s) => s.id === item.stepId)
    const fn = item.fn
    if (!step) return
    if (!fn) {
      issues.push({ stepId: step.id, fn: step.fn, message: tp('unknownFn', lang, { fn: step.fn }) })
      return
    }
    for (const [index, arg] of fn.args.entries()) {
      if (index === 0 && item.input) continue
      const raw = (step.values[arg.name] ?? '').trim()
      if (!raw) {
        if (arg.required) issues.push({ stepId: step.id, fn: fn.name, arg: arg.name, message: tp('missingArg', lang, { fn: fn.name, arg: arg.name }) })
        continue
      }
      if (isStepRef(raw)) {
        const refPos = posByStepId.get(stepRefId(raw))
        if (refPos == null || refPos >= pos) {
          issues.push({ stepId: step.id, fn: fn.name, arg: arg.name, message: tp('invalidStepRef', lang, { fn: fn.name, arg: arg.name }) })
        }
        continue
      }
      if (arg.type === 'enum' && arg.options.length && !arg.options.includes(raw)) {
        issues.push({ stepId: step.id, fn: fn.name, arg: arg.name, message: tp('invalidEnum', lang, { fn: fn.name, arg: arg.name }) })
      }
      if (arg.type === 'number' && !NUMERIC.test(raw)) {
        issues.push({ stepId: step.id, fn: fn.name, arg: arg.name, message: tp('invalidNumber', lang, { fn: fn.name, arg: arg.name }) })
      }
    }
  })
  return issues
}

// per-step build shared by script export, engine execution, and the node graph
export interface BuiltStep {
  stepId: string
  fn: FnSpec
  var: string
  chains: boolean // pipes into previous block's var
  args: string[] // "name = value" for user-set args (pipe arg excluded when chaining)
  input: string | null // var of the previous block when chaining
  inputStepId: string | null // step id that produced `input`, for drawing graph edges
}

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
    const hasInput = pipeArg(fn) !== null && openVar !== null
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
      built = { stepId: step.id, fn, var: `fig_${++figN}`, chains: false, args: stepArgs(step, fn, true, varByStepId), input: openVar, inputStepId: openVarStepId }
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

export function generateR(steps: Step[], lang: Lang = 'pt'): string {
  const built = buildSteps(steps)
  if (!built.length) return `${t('emptyCodeComment', lang)}\nlibrary(climasus4r)\n`
  const lines: string[] = ['library(climasus4r)', '']
  built.forEach((b, idx) => {
    // non-chained step with input passes it as first argument: fig <- sus_x_plot(dados, ...)
    const callArgs = !b.chains && b.input ? [b.input, ...b.args] : b.args
    const call = callArgs.length
      ? `${b.fn.name}(\n    ${callArgs.join(',\n    ')}\n  )`
      : `${b.fn.name}()`
    if (b.chains) {
      lines[lines.length - 1] += ' |>'
      lines.push(`  ${call}`)
    } else {
      if (idx > 0) lines.push('')
      lines.push(`${b.var} <- ${call}`)
    }
  })
  return lines.join('\n') + '\n'
}

// engine form: each step is independently executable (`var <- fn(input, args)`)
export interface EngineStep {
  stepId: string
  var: string
  code: string
}

export function generateRSteps(steps: Step[]): EngineStep[] {
  return buildSteps(steps).map((b) => {
    const args = b.input ? [b.input, ...b.args] : b.args
    return {
      stepId: b.stepId,
      var: b.var,
      code: `${b.var} <- ${b.fn.name}(${args.join(', ')})`,
    }
  })
}

if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__store = usePipeline
  ;(window as unknown as Record<string, unknown>).__generateR = generateR
  ;(window as unknown as Record<string, unknown>).__buildSteps = buildSteps
}
