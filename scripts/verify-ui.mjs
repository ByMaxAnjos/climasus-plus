// e2e verification of the climasus+ Pipeline Studio (needs `npm run dev` on :1420)
import { chromium } from 'playwright'

const URL = process.env.CLIMASUS_VERIFY_URL ?? 'http://localhost:1420/'
let passed = 0
let failed = 0
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
  ok ? passed++ : failed++
}

const browser = await chromium.launch()
const page = await browser.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(String(e)))

await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await page.waitForSelector('.stage-tab')

// 1. no welcome screen — studio renders directly
check('studio renders, no welcome', await page.locator('.workspace').count() === 1)

// 2. four stage tracks
check('4 stage tracks', await page.locator('.stage-tab').count() === 4)

// 3. library lists sus_data_import under Preparação
check('sus_data_import in library', await page.locator('.fn-item', { hasText: 'sus_data_import' }).count() === 1)

// 4. inspect shows doc from roxygen
await page.locator('.fn-item', { hasText: 'sus_data_import' }).click()
const title = await page.locator('.insp-title').textContent()
check('roxygen title in inspector', /DATASUS/i.test(title ?? ''), title ?? '')

// 5. add to pipeline
await page.locator('.insp-add').click()
check('step added to canvas', await page.locator('.step-card').count() === 1)

// 6. param form: system enum has many DATASUS options
const sysOptions = await page.locator('.arg-field', { hasText: 'system' }).locator('option').count()
check('system enum options > 20', sysOptions > 20, `got ${sysOptions}`)

// 7. set params, R code updates with function call + args
await page.locator('.arg-field', { hasText: 'system' }).locator('select').selectOption('SIM-DO')
await page.locator('.arg-field:has(label:text-is("uf"))').locator('input').fill('c("SP","RJ")')
await page.locator('.arg-field:has(label:has-text("year"))').locator('input').fill('2020:2023')
let code = await page.locator('[data-testid="r-code"]').textContent()
check('R code has sus_data_import call', code.includes('sus_data_import('))
check('R code has system arg quoted', code.includes('system = "SIM-DO"'))
check('R code keeps R expressions raw', code.includes('uf = c("SP","RJ")') && code.includes('year = 2020:2023'))

// 8. chain a second step via |>
await page.locator('.stage-tab[data-stage="preparacao"]').click()
await page.locator('.fn-item', { hasText: 'sus_data_clean_encoding' }).hover()
await page.locator('.fn-item', { hasText: 'sus_data_clean_encoding' }).locator('.fn-add').click()
code = await page.locator('[data-testid="r-code"]').textContent()
check('steps chain with |>', code.includes('|>') && code.includes('sus_data_clean_encoding('))

// 9. modelagem stage lists sus_mod_dlnm; grid family in integração
await page.locator('.stage-tab[data-stage="modelagem"]').click()
check('sus_mod_dlnm in modelagem', await page.locator('.fn-item', { hasText: 'sus_mod_dlnm' }).count() === 1)
await page.locator('.stage-tab[data-stage="integracao"]').click()
check('sus_grid_era5 in integração', await page.locator('.fn-item', { hasText: 'sus_grid_era5' }).count() === 1)

// 10. RAP stage
await page.locator('.stage-tab[data-stage="rap"]').click()
check('sus_rap_export in RAP', await page.locator('.fn-item', { hasText: 'sus_rap_export' }).count() === 1)

// 11. search
await page.locator('.search').fill('dlnm')
check('search finds dlnm fns', await page.locator('.fn-item').count() >= 2)
await page.locator('.search').fill('')

// 12. persistence across reload
await page.reload()
await page.waitForSelector('.step-card')
check('pipeline persists reload', await page.locator('.step-card').count() === 2)

// 13. language switch
await page.locator('.lang-select').selectOption('en')
const sub = await page.locator('.brand-sub').textContent()
check('EN subtitle', sub === 'Health & climate analytics studio', sub ?? '')

// 14. theme toggle
await page.locator('.theme-toggle').click()
check('light theme attr', await page.evaluate(() => document.documentElement.dataset.theme) === 'light')

// 15. Pipeline center opens and loads a template into the graph
await page.locator('.topbar-actions .btn', { hasText: 'Pipelines' }).click()
await page.waitForSelector('.help-panel')
check('pipeline center opens', await page.locator('.help-panel').count() === 1)
check('center lists many pipelines', await page.locator('.help-card').count() >= 10)
check('climate aggregate pipeline present', await page.locator('.help-card', { hasText: 'sus_climate_aggregate' }).count() >= 1)
// load a full case study to assert multi-step load
await page.locator('.help-card', { hasText: 'Pediatric respiratory mortality' }).locator('.btn-primary').click()
await page.waitForSelector('.help-panel', { state: 'detached' })
check('template loads steps + closes panel', (await page.locator('.step-card').count()) >= 5)

// 16. project serialize/deserialize round-trip (the file-save/open payload) via the store
const roundTrip = await page.evaluate(() => {
  const store = window.__store
  const before = store.getState().steps.map((s) => s.fn)
  const json = localStorage.getItem('climasus-plus-pipeline-v2') // same shape serializeProject writes
  const parsed = JSON.parse(json)
  return { before, parsedFns: (parsed.steps ?? []).map((s) => s.fn), version: parsed.schemaVersion }
})
check('project payload matches loaded pipeline',
  JSON.stringify(roundTrip.before) === JSON.stringify(roundTrip.parsedFns) && roundTrip.version === 4,
  `v${roundTrip.version}`)

// 17. no page errors
check('no page errors', pageErrors.length === 0, pageErrors[0] ?? '')

await browser.close()
console.log(`\n${passed}/${passed + failed} checks passed`)
process.exit(failed ? 1 : 0)
