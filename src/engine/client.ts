// HTTP client for the local climasus+ R engine (plumber, localhost).
// Under Tauri the engine is a bundled R sidecar on a dynamic port, resolved once via the
// `engine_port` command (src-tauri/src/lib.rs); in the browser/dev it's the fixed dev port.

declare global {
  interface Window {
    __TAURI__?: { core: { invoke: (cmd: string) => Promise<unknown> } }
  }
}

let base = 'http://127.0.0.1:8787'
let token = ''
let bootError = ''
let initialized = false

export async function initEngine(): Promise<void> {
  if (initialized) return
  initialized = true
  if (!window.__TAURI__) return
  try {
    const port = (await window.__TAURI__.core.invoke('engine_port')) as number
    if (port) base = `http://127.0.0.1:${port}`
    token = (await window.__TAURI__.core.invoke('engine_token')) as string
    bootError = (await window.__TAURI__.core.invoke('engine_boot_error')) as string
  } catch {
    // stay on the default; health polling will just report offline
  }
}

// shared secret minted per-launch by src-tauri/src/lib.rs; empty in the plain `npm run dev` +
// `npm run engine` combo, where engine/start.R also runs without CLIMASUS_TOKEN and skips the check
const authHeaders = (): Record<string, string> => (token ? { 'X-Climasus-Token': token } : {})

export type EngineStatus = 'offline' | 'ready' | 'busy'

export interface StepResult {
  i: number
  var: string
  ok: boolean
  ms: number
  console: string
  cacheKey?: string // client-side nonce to bust stale image/widget caching after reruns
  kind?: 'table' | 'plot' | 'widget' | 'object'
  class?: string
  dims?: { nrow: number | null; ncol: number }
  preview?: { columns: string[]; rows: Record<string, unknown>[]; nrow: number | null; ncol: number }
  artifacts?: { png?: string; svg?: string; html?: string } // widget.png present only when the server could snapshot it (see engine/api.R)
  print?: string
  error?: string
}

export interface RunResponse {
  ranFrom: number
  results: StepResult[]
}

export async function health(): Promise<boolean> {
  await initEngine()
  try {
    const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2000) })
    return r.ok
  } catch {
    return false
  }
}

export async function run(steps: { var: string; code: string }[]): Promise<RunResponse> {
  const r = await fetch(`${base}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ steps }),
  })
  if (!r.ok) throw new Error(`engine /run ${r.status}`)
  return r.json()
}

export async function resetSession(): Promise<void> {
  await fetch(`${base}/reset`, { method: 'POST', headers: authHeaders() })
}

export async function generateReport(title: string): Promise<string> {
  const r = await fetch(`${base}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title }),
  })
  const body = await r.json()
  if (!r.ok) throw new Error(body.error ?? `engine /report ${r.status}`)
  return `${base}${body.url}`
}

export async function engineBootError(): Promise<string> {
  await initEngine()
  return bootError
}

export const downloadUrl = (variable: string, format: 'csv' | 'xlsx' | 'parquet') =>
  `${base}/download?var=${encodeURIComponent(variable)}&format=${format}`

export const artifactUrl = (rel: string) => `${base}/artifact/${rel}`
