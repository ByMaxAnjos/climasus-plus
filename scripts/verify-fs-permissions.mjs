// static check: every @tauri-apps/plugin-fs function imported in src/ has a matching
// fs:allow-* capability granted in src-tauri/capabilities/default.json — the download
// bug (missing fs:allow-write-file) shipped silently because no test caught this class
// of gap (Playwright-against-dev-server never exercises Tauri's capability system).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeChecker } from './_verify-helpers.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FN_TO_CAPABILITY = {
  readFile: 'fs:allow-read-file',
  writeFile: 'fs:allow-write-file',
  readTextFile: 'fs:allow-read-text-file',
  writeTextFile: 'fs:allow-write-text-file',
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(entry)) out.push(p)
  }
  return out
}

const { check, summary } = makeChecker()

const usedFns = new Set()
for (const file of walk(join(ROOT, 'src'))) {
  const src = readFileSync(file, 'utf8')
  const m = src.match(/import\s*\{([^}]+)\}\s*from\s*['"]@tauri-apps\/plugin-fs['"]/)
  if (!m) continue
  for (const name of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
    if (name in FN_TO_CAPABILITY) usedFns.add(name)
  }
}

const capabilities = JSON.parse(readFileSync(join(ROOT, 'src-tauri/capabilities/default.json'), 'utf8'))
const granted = new Set(
  capabilities.permissions.map((p) => (typeof p === 'string' ? p : p.identifier)),
)

for (const fn of usedFns) {
  const id = FN_TO_CAPABILITY[fn]
  check(`${fn}() has capability ${id}`, granted.has(id) || granted.has('fs:default'))
}
check('at least one plugin-fs usage found', usedFns.size > 0)

process.exit(summary())
