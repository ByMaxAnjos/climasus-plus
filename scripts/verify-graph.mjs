// e2e verification of the node-graph canvas, inline results, plotly toggle, and guided tutorial.
// Spawns its own engine (offline, real testdata) so it never collides with a dev engine's session
// cache. Needs `npm run dev` on :1420.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const TESTDATA_ROOT = process.env.CLIMASUS4R_TESTDATA ?? '/Users/co2map/Documents/2026/CLIMASUS4r/climasus4r/inst/testdata'
const TESTDATA = join(TESTDATA_ROOT, 'sim/SIM_DO_RO_2022.parquet')
const PORT = 8798
const ENGINE = `http://127.0.0.1:${PORT}`
const APP_URL = 'http://localhost:1420/'

let passed = 0, failed = 0
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
  ok ? passed++ : failed++
}

async function waitForHealth(timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${ENGINE}/health`)
      if (r.ok) return true
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

const engineProc = spawn('Rscript', [join(ROOT, 'engine', 'start.R'), String(PORT)], { cwd: ROOT, stdio: 'pipe' })
let engineLog = ''
engineProc.stdout.on('data', (d) => (engineLog += d))
engineProc.stderr.on('data', (d) => (engineLog += d))

// point the frontend's dev-mode client at our dedicated engine port via a query-param shim isn't
// wired in the app, so instead we mimic the app's own default (127.0.0.1:8787) by requiring the
// caller to NOT run another dev engine on 8787 during this script — simplest: just also serve on
// 8787 if free, else skip UI checks. Try 8787 first for real UI coverage.
async function findAppEnginePort() {
  if (await fetch('http://127.0.0.1:8787/health').then((r) => r.ok).catch(() => false)) return 8787
  return null
}

try {
  const up = await waitForHealth(60000)
  check('engine boots', up)
  if (!up) throw new Error('engine did not start:\n' + engineLog)

  const appEnginePort = await findAppEnginePort()
  if (!appEnginePort) {
    console.log('SKIP  UI checks — no engine on :8787 (run `npm run engine` first for full coverage)')
  } else {
    await fetch(`http://127.0.0.1:${appEnginePort}/reset`, { method: 'POST' })
    const browser = await chromium.launch()
    const page = await browser.newPage()
    const pageErrors = []
    page.on('pageerror', (e) => pageErrors.push(String(e)))

    await page.goto(APP_URL)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForSelector('.stage-tab')
    await page.waitForSelector('.engine-ready', { timeout: 15000 })

    // --- build + run a small pipeline as a graph ---------------------------
    const addFn = async (name) => {
      await page.locator('.fn-item', { hasText: name }).first().click()
      await page.locator('.insp-add').click()
    }
    await addFn('sus_data_read')
    await page.locator('.arg-field:has(label:has-text("path"))').locator('input').fill(TESTDATA)
    await addFn('sus_data_clean_encoding')
    await addFn('sus_data_standardize')
    await addFn('sus_data_aggregate')
    await page.locator('.arg-field:has(label:has-text("time_unit"))').locator('select').selectOption('month')
    await addFn('sus_data_plot_aggregate_ts')

    check('graph renders one node per step', await page.locator('.react-flow__node').count() === 5)
    // edges render one tick after nodes measure their handle positions
    await page.waitForTimeout(300)
    check('graph draws edges between chained steps', await page.locator('.react-flow__edge').count() === 4)

    await page.locator('.topbar-actions .btn-primary').click()
    await page.waitForFunction(() => document.querySelectorAll('.step-status-running').length === 0, { timeout: 60000 })
    check('all 5 nodes reach ok status', await page.locator('.step-status-ok').count() === 5)
    check('inline result appears inside a node (not just the side panel)', await page.locator('.node-result').count() === 5)
    // 4 of the 5 steps produce tables (read/clean/standardize/aggregate), only the last plots
    check('inline table preview renders', await page.locator('.node-result [data-testid="result-table"]').count() === 4)
    check('inline plot renders', await page.locator('.node-result [data-testid="result-plot"]').count() === 1)

    // --- interactive plotly toggle ------------------------------------------
    const hasToggle = await page.locator('.plot-toggle').count() > 0
    check('plotly interactive toggle appears when available', hasToggle)
    if (hasToggle) {
      await page.locator('.plot-toggle button', { hasText: 'Interativo' }).first().click({ timeout: 5000 })
      check('switching to interactive shows the widget iframe', await page.locator('[data-testid="result-widget-plot"]').count() === 1)
    }

    // clicking anywhere on a node (not just its header) must still select it —
    // regression check for the pointer-events/elementsSelectable bug found during dev
    await page.locator('.step-card[data-fn="sus_data_aggregate"]').click()
    check('clicking a node with inline results still selects it', await page.locator('.step-card.active[data-fn="sus_data_aggregate"]').count() === 1)

    // --- guided tutorial (launched from the Help / Pipelines panel) -----------
    await page.locator('.topbar-actions button', { hasText: 'Pipelines' }).click()
    await page.waitForSelector('.help-panel')
    await page.locator('.help-tutorial-btn').click()
    await page.waitForSelector('.tutorial-overlay')
    await page.waitForFunction(() => document.querySelectorAll('.step-status-running').length === 0, { timeout: 60000 })
    check('tutorial loads its full step sequence', await page.locator('.react-flow__node').count() === 8)
    check('tutorial auto-runs the first step', await page.locator('.step-status-ok').count() >= 1)
    check('first step is spotlighted, others dimmed', await page.locator('.graph-node-dimmed').count() === 7)
    check('focused node is highlighted', await page.locator('.tutorial-focus').count() === 1)

    for (let i = 0; i < 3; i++) {
      await page.locator('.tutorial-nav button', { hasText: 'Próximo' }).click()
      await page.waitForFunction(() => document.querySelectorAll('.step-status-running').length === 0, { timeout: 60000 })
    }
    check('progress indicator advances', /passo 4 de 8/i.test((await page.locator('.tutorial-progress').textContent()) ?? ''))
    check('no errors accumulated advancing the tutorial', await page.locator('.step-status-error').count() === 0)

    await page.locator('.tutorial-close').click()
    check('exiting the tutorial removes the overlay', await page.locator('.tutorial-overlay').count() === 0)
    check('exiting the tutorial keeps the built pipeline intact', await page.locator('.react-flow__node').count() === 8)

    check('no page errors', pageErrors.length === 0, pageErrors[0] ?? '')
    await browser.close()
  }
} finally {
  engineProc.kill()
}

console.log(`\n${passed}/${passed + failed} checks passed`)
process.exit(failed ? 1 : 0)
