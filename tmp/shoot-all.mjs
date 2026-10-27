import { chromium } from 'playwright'
const URL = 'http://localhost:1420/'
const shots = [
  { q: 'Dengue e graus-dia', out: 'dengue' },
  { q: 'Mortalidade respiratória pediátrica', out: 'respiratorio' },
  { q: 'Hospitalizações respiratórias e ondas de frio', out: 'frio' },
  { q: 'Mortalidade cardiovascular em idosos', out: 'cardio' },
  { q: 'Exposição aguda saúde', out: 'integracao' },
  { q: 'Etapas 2-4: limpar, filtrar e agregar', out: 'preparacao' },
  { q: 'Modelagem DLNM a partir de dados preparados', out: 'modelagem' },
]
const browser = await chromium.launch()
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 2 })
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector('.stage-tab')
  if (await page.locator('.about-backdrop').count() > 0) await page.keyboard.press('Escape')
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
  await page.waitForTimeout(300)
  await page.locator('.topbar-actions .btn', { hasText: 'Pipelines' }).click()
  await page.waitForSelector('.help-panel')
  await page.locator('.help-search').fill(s.q)
  await page.waitForTimeout(250)
  const card = page.locator('.help-card').first()
  const count = await page.locator('.help-card').count()
  if (!count) { console.log(`MISS ${s.out}: no card for ${s.q}`); await page.close(); continue }
  const title = await card.locator('strong').textContent()
  await card.locator('.btn-primary').click()
  await page.waitForSelector('.help-panel', { state: 'detached' })
  await page.waitForTimeout(700)
  await page.evaluate(() => window.__store.getState().select(null))
  const expand = page.locator('.canvas-head .expand-toggle')
  if (await expand.count()) { await expand.click(); await page.waitForTimeout(400) }
  const fit = page.locator('.react-flow__controls-button[title="Enquadrar pipeline"]')
  if (await fit.count()) { await fit.click(); await page.waitForTimeout(500) }
  await page.evaluate(() => window.__store.getState().select(null))
  await page.addStyleTag({ content: '.react-flow__minimap,.react-flow__controls,.react-flow__panel{display:none!important}' })
  await page.waitForTimeout(250)
  const nodes = await page.locator('.react-flow__node-step').count()
  const box = await page.locator('.react-flow__nodes').boundingBox()
  console.log(`${s.out}: ${nodes} nodes | ${title}`)
  if (box) {
    const x = Math.max(0, box.x - 24), y = Math.max(0, box.y - 24)
    const w = Math.min(1800 - x, box.width + 48), h = Math.min(1100 - y, box.height + 48)
    await page.screenshot({ path: `tmp/shots/${s.out}.png`, clip: { x, y, width: w, height: h } })
  }
  await page.close()
}
await browser.close()
