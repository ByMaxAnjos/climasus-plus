// e2e verification of the node-graph canvas, inline results, plotly toggle, and guided tutorial.
// Needs `npm run dev` on :1420 and a dev engine on :8787 (`npm run engine`) — the UI always talks
// to 8787, so that's what this script drives too.
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { makeChecker, dismissModeSelector } from './_verify-helpers.mjs'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const TESTDATA_ROOT = process.env.CLIMASUS4R_TESTDATA ?? '/Users/co2map/Documents/2026/CLIMASUS4r/climasus4r/inst/testdata'
const TESTDATA = join(TESTDATA_ROOT, 'sim/SIM_DO_RO_2022.parquet')
const APP_URL = 'http://localhost:1420/'

const { check, summary } = makeChecker()

const engineUp = await fetch('http://127.0.0.1:8787/health').then((r) => r.ok).catch(() => false)
check('engine reachable on :8787', engineUp)
if (!engineUp) {
  console.log('SKIP  UI checks — no engine on :8787 (run `npm run engine` first)')
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
    await dismissModeSelector(page)
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

    // --- guided tutorial (launched from the templates dropdown in the topbar) -----------
    // RESPIRATORIO_SP has 9 steps (verified by reading src/tutorials/respiratorio.ts directly —
    // not the same count as the small 5-step graph built above)
    const RESPIRATORIO_SP_STEPS = 9
    const openTemplatesMenu = () => page.locator('.topbar-actions button', { hasText: 'Tutorial guiado' }).click()
    await openTemplatesMenu()
    await page.waitForSelector('.settings-menu')
    await page.locator('.settings-menu .settings-row', { hasText: 'Mortalidade Respiratória — SP 2014-2019' }).click()
    await page.waitForSelector('.tutorial-overlay')
    await page.waitForFunction(() => document.querySelectorAll('.step-status-running').length === 0, { timeout: 60000 })
    check('tutorial loads its full step sequence', await page.locator('.react-flow__node').count() === RESPIRATORIO_SP_STEPS)
    check('tutorial auto-runs the first step', await page.locator('.step-status-ok').count() >= 1)
    check('first step is spotlighted, others dimmed', await page.locator('.graph-node-dimmed').count() === RESPIRATORIO_SP_STEPS - 1)
    check('focused node is highlighted', await page.locator('.tutorial-focus').count() === 1)

    for (let i = 0; i < 3; i++) {
      await page.locator('.tutorial-nav button', { hasText: 'Próximo' }).click()
      await page.waitForFunction(() => document.querySelectorAll('.step-status-running').length === 0, { timeout: 60000 })
    }
    check('progress indicator advances', new RegExp(`passo 4 de ${RESPIRATORIO_SP_STEPS}`, 'i').test((await page.locator('.tutorial-progress').textContent()) ?? ''))
    check('no errors accumulated advancing the tutorial', await page.locator('.step-status-error').count() === 0)

    await page.locator('.tutorial-close').click()
    check('exiting the tutorial removes the overlay', await page.locator('.tutorial-overlay').count() === 0)
    check('exiting the tutorial keeps the built pipeline intact', await page.locator('.react-flow__node').count() === RESPIRATORIO_SP_STEPS)

    // --- case-study templates: node count + generated R code for the combiner steps ---------
    // these templates' first step downloads real DATASUS/INMET data over the network, which
    // startTutorial() auto-runs — block that one request so the checks below (node count and
    // generated code, both purely client-side) stay fast and don't tie up the shared R engine
    await page.route('http://127.0.0.1:8787/run', (route) => route.abort())
    const CASE_STUDIES = [
      { title: 'Dengue e clima — Nordeste 2015-2019', nodes: 11, healthVar: 'dados', climateVar: 'clima' },
      { title: 'Mortalidade respiratória pediátrica e temperatura — Sudeste 2015-2019', nodes: 13, healthVar: 'dados', climateVar: 'clima' },
      { title: 'Mortalidade cardiovascular em idosos e ondas de calor — SP 2010-2019', nodes: 14, healthVar: 'dados', climateVar: 'clima' },
      { title: 'Hospitalizações respiratórias e frio extremo — Região Sul 2010-2019', nodes: 11, healthVar: 'dados', climateVar: 'clima' },
    ]
    for (const tpl of CASE_STUDIES) {
      await openTemplatesMenu()
      await page.waitForSelector('.settings-menu')
      await page.locator('.settings-menu .settings-row', { hasText: tpl.title }).click()
      await page.waitForFunction(
        (n) => document.querySelectorAll('.react-flow__node').length === n,
        tpl.nodes,
        { timeout: 5000 },
      ).catch(() => {})
      check(`"${tpl.title}" loads its ${tpl.nodes} steps`, await page.locator('.react-flow__node').count() === tpl.nodes)
      // runPipeline() (auto-triggered by startTutorial) switches to the results tab; the code
      // we want to inspect only renders under the code tab
      await page.locator('.output-tab', { hasText: 'Código' }).click()
      const code = await page.locator('[data-testid="r-code"]').textContent()
      const call = code?.match(/sus_climate_aggregate\([^)]*\)/s)?.[0] ?? ''
      check(`"${tpl.title}" combiner call pipes the health-chain variable`, call.includes(tpl.healthVar))
      check(`"${tpl.title}" combiner call names climate_data on the climate-chain variable`, call.includes(`climate_data = ${tpl.climateVar}`))
    }
    await page.unroute('http://127.0.0.1:8787/run')

  check('no page errors', pageErrors.length === 0, pageErrors[0] ?? '')
  await browser.close()
}

process.exit(summary())
