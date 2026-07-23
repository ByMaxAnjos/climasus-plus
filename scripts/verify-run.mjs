// e2e verification of the climasus+ R engine + execution UI.
// Spawns the engine itself (Rscript engine/start.R) against inst/testdata (offline, no network),
// then drives the app (needs `npm run dev` on :1420) with a real pipeline run.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const TESTDATA_ROOT = process.env.CLIMASUS4R_TESTDATA ?? '/Users/co2map/Documents/2026/CLIMASUS4r/climasus4r/inst/testdata'
const TESTDATA = join(TESTDATA_ROOT, 'sim/SIM_DO_RO_2022.parquet')
const PORT = 8799 // dedicated port so this script never fights a dev engine on 8787
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
    await sleep(500)
  }
  return false
}

const engineProc = spawn('Rscript', [join(ROOT, 'engine', 'start.R'), String(PORT)], {
  cwd: ROOT,
  stdio: 'pipe',
})
let engineLog = ''
engineProc.stdout.on('data', (d) => (engineLog += d))
engineProc.stderr.on('data', (d) => (engineLog += d))

try {
  const up = await waitForHealth(60000)
  check('engine boots and /health responds', up)
  if (!up) throw new Error('engine did not start:\n' + engineLog)

  // --- pure API checks against inst/testdata (no browser needed) -----------
  const steps = [
    { var: 'dados', code: `dados <- sus_data_read(path = "${TESTDATA}")` },
    { var: 'dados', code: 'dados <- sus_data_clean_encoding(dados)' },
    { var: 'dados', code: 'dados <- sus_data_standardize(dados)' },
    { var: 'dados', code: 'dados <- sus_data_aggregate(dados, time_unit = "month")' },
    { var: 'fig_1', code: 'fig_1 <- sus_data_plot_aggregate_ts(dados)' },
  ]
  let res = await fetch(`${ENGINE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steps }),
  }).then((r) => r.json())

  check('5-step pipeline runs on offline testdata', res.results.every((r) => r.ok), JSON.stringify(res.results.map((r) => r.ok)))
  check('step 4 (aggregate) is a table with dims', res.results[3]?.kind === 'table' && res.results[3]?.dims?.ncol === 3)
  check('step 5 (plot) produced a PNG artifact', res.results[4]?.kind === 'plot' && !!res.results[4]?.artifacts?.png)

  const artUrl = `${ENGINE}/artifact/${res.results[4].artifacts.png}`
  check('plot artifact is servable', (await fetch(artUrl)).status === 200)

  const csv = await fetch(`${ENGINE}/download?var=dados&format=csv`)
  check('CSV download 200', csv.status === 200)
  const xlsx = await fetch(`${ENGINE}/download?var=dados&format=xlsx`)
  check('XLSX download 200', xlsx.status === 200)

  // incremental re-run: only edit step 4 -> engine must resume from step 4, not re-read/re-clean
  steps[3].code = 'dados <- sus_data_aggregate(dados, time_unit = "week")'
  res = await fetch(`${ENGINE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steps }),
  }).then((r) => r.json())
  check('editing step 4 resumes from step 4 (incremental)', res.ranFrom === 4, `ranFrom=${res.ranFrom}`)

  const report = await fetch(`${ENGINE}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Teste' }),
  }).then((r) => r.json())
  check('report renders', !!report.url, JSON.stringify(report))
  if (report.url) {
    const rep = await fetch(`${ENGINE}${report.url}`)
    check('report HTML servable', rep.status === 200)
  }

  await fetch(`${ENGINE}/reset`, { method: 'POST' })

  // --- browser-driven UI checks (talks to the dev engine on :8787) ---------
  const uiEngineUp = await fetch('http://127.0.0.1:8787/health').then((r) => r.ok).catch(() => false)
  if (!uiEngineUp) {
    console.log('SKIP  UI-driven checks — no engine on :8787 (run `npm run engine` for full coverage)')
  } else {
    await fetch('http://127.0.0.1:8787/reset', { method: 'POST' })
    const browser = await chromium.launch()
    const page = await browser.newPage()
    const pageErrors = []
    page.on('pageerror', (e) => pageErrors.push(String(e)))

    await page.goto(APP_URL)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForSelector('.stage-tab')
    await page.waitForSelector('.engine-ready', { timeout: 15000 })
    check('engine pill shows ready in UI', true)

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

    await page.locator('.topbar-actions .btn-primary').click()
    await page.waitForFunction(() => document.querySelectorAll('.step-status-running').length === 0, { timeout: 60000 })
    check('all 5 steps show ok status', await page.locator('.step-status-ok').count() === 5)
    check('results tab auto-selected', await page.locator('.output-tab.active').textContent().then((t) => /resultados/i.test(t ?? '')))
    // result now renders in two places by design: inline in the graph node, and in the detail
    // panel below (.results) — both must show the plot
    check('plot renders as <img> (inline + detail)', await page.locator('[data-testid="result-plot"]').count() === 2)
    check('inline node result visible', await page.locator('.node-result [data-testid="result-plot"]').count() === 1)

    await page.locator('.step-card[data-fn="sus_data_aggregate"]').click()
    const detail = page.locator('.results')
    check('table view shows dims', /738.*3|3.*738/.test((await detail.locator('.results-dims').textContent()) ?? ''))
    check('table rows rendered', await detail.locator('[data-testid="result-table"] tbody tr').count() > 0)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      detail.locator('.results-actions button', { hasText: 'CSV' }).click(),
    ])
    check('CSV download triggered from UI', !!download)

    const [reportDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.topbar-actions button', { hasText: 'Relatório' }).click(),
    ])
    check('HTML report download triggered from UI', !!reportDownload)

    // editing an upstream step invalidates + re-running updates status
    await page.locator('.arg-field:has(label:has-text("time_unit"))').locator('select').selectOption('week')
    await page.locator('.topbar-actions .btn-primary').click()
    await page.waitForFunction(() => document.querySelectorAll('.step-status-running').length === 0, { timeout: 60000 })
    check('re-run after edit still all ok', await page.locator('.step-status-ok').count() === 5)

    check('no page errors', pageErrors.length === 0, pageErrors[0] ?? '')
    await browser.close()
  }
} finally {
  engineProc.kill()
}

console.log(`\n${passed}/${passed + failed} checks passed`)
process.exit(failed ? 1 : 0)
