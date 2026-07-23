// File IO for project save/open and data-file picking. Uses native Tauri dialogs when running
// inside the desktop app; falls back to a Blob download / <input type="file"> in the plain browser
// (npm run dev + the Playwright verify scripts), where no filesystem path is available.
import { save, open } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeFile, writeTextFile } from '@tauri-apps/plugin-fs'

const isTauri = () => typeof window !== 'undefined' && '__TAURI__' in window

const PROJECT_FILTER = [{ name: 'climasus+ project', extensions: ['climasus.json', 'json'] }]
const DATA_FILTER = [{ name: 'Data', extensions: ['parquet', 'csv', 'xlsx', 'rds'] }]

// Save the serialized project. Returns false only if the user cancelled the dialog.
export async function saveProjectFile(json: string): Promise<boolean> {
  if (isTauri()) {
    const path = await save({ defaultPath: 'projeto.climasus.json', filters: PROJECT_FILTER })
    if (!path) return false
    await writeTextFile(path, json)
    return true
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'projeto.climasus.json' })
  a.click()
  URL.revokeObjectURL(url)
  return true
}

// Read a project file chosen by the user; null if cancelled.
export async function openProjectFile(): Promise<string | null> {
  if (isTauri()) {
    const path = await open({ multiple: false, filters: PROJECT_FILTER })
    if (typeof path !== 'string') return null
    return readTextFile(path)
  }
  return pickBrowserText('.climasus.json,.json')
}

// Absolute filesystem path of a data file, for R (running on the same machine) to read directly.
// Tauri: native file picker. Browser (dev + local engine): the webview can't hand a File its path,
// so fall back to a typed path — the local `npm run engine` R process can still read it.
export async function pickDataFile(): Promise<string | null> {
  if (isTauri()) {
    const path = await open({ multiple: false, filters: DATA_FILTER })
    return typeof path === 'string' ? path : null
  }
  const typed = window.prompt('Caminho do arquivo de dados (.parquet/.csv/.xlsx/.rds):')?.trim()
  return typed || null
}

function pickBrowserText(accept: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept })
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => resolve(null)
      reader.readAsText(file)
    }
    input.click()
  })
}

export async function saveRemoteFile(url: string, filename: string): Promise<boolean> {
  if (isTauri()) {
    const extension = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : undefined
    const path = await save({
      defaultPath: filename,
      filters: extension ? [{ name: extension.toUpperCase(), extensions: [extension] }] : undefined,
    })
    if (!path) return false
    const response = await fetch(url)
    if (!response.ok) throw new Error(`download ${response.status}`)
    const bytes = new Uint8Array(await response.arrayBuffer())
    await writeFile(path, bytes)
    return true
  }

  const response = await fetch(url)
  if (!response.ok) throw new Error(`download ${response.status}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  const blob = new Blob([bytes], { type: response.headers.get('content-type') ?? 'application/octet-stream' })
  const objectUrl = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: objectUrl, download: filename })
  a.click()
  URL.revokeObjectURL(objectUrl)
  return true
}
