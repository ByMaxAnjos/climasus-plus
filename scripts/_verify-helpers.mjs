// Shared plumbing for scripts/verify-*.mjs: a PASS/FAIL reporter, a /health poller,
// and the engine spawn used by scripts that need their own offline R process.
import { spawn } from 'node:child_process'
import { join } from 'node:path'

export function makeChecker() {
  let passed = 0, failed = 0
  const check = (name, ok, extra = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
    ok ? passed++ : failed++
  }
  const summary = () => {
    console.log(`\n${passed}/${passed + failed} checks passed`)
    return failed ? 1 : 0
  }
  return { check, summary }
}

// a fresh project (no steps, no mode chosen) auto-opens the usage-mode modal on mount; every
// script drives the app from that same fresh state, so all of them need to dismiss it first
export async function dismissModeSelector(page) {
  if (await page.locator('.about-backdrop').count() > 0) await page.keyboard.press('Escape')
}

export async function waitForHealth(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${url}/health`)
      if (r.ok) return true
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

export function spawnEngine(root, port) {
  const proc = spawn('Rscript', [join(root, 'engine', 'start.R'), String(port)], { cwd: root, stdio: 'pipe' })
  let log = ''
  proc.stdout.on('data', (d) => (log += d))
  proc.stderr.on('data', (d) => (log += d))
  return { proc, getLog: () => log }
}
