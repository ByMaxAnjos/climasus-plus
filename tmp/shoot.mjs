import { chromium } from 'playwright'
const URL = 'http://localhost:1420/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 2 })
await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await page.waitForSelector('.stage-tab')
if (await page.locator('.about-backdrop').count() > 0) await page.keyboard.press('Escape')
await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
await page.waitForTimeout(400)
await page.locator('.topbar-actions .btn', { hasText: 'Pipelines' }).click()
await page.waitForSelector('.help-panel')
await page.locator('.help-search').fill('Dengue e graus-dia')
await page.waitForTimeout(300)
await page.locator('.help-card', { hasText: 'Dengue e graus-dia' }).locator('.btn-primary').click()
await page.waitForSelector('.help-panel', { state: 'detached' })
await page.waitForTimeout(800)
await page.evaluate(() => window.__store.getState().select(null))
const expand = page.locator('.canvas-head .expand-toggle')
if (await expand.count()) { await expand.click(); await page.waitForTimeout(500) }
// fit pipeline
const fit = page.locator('.react-flow__controls-button[title="Enquadrar pipeline"]')
if (await fit.count()) { await fit.click(); await page.waitForTimeout(600) }
await page.evaluate(() => window.__store.getState().select(null))
await page.addStyleTag({ content: '.react-flow__minimap,.react-flow__controls,.react-flow__panel{display:none!important}' })
await page.waitForTimeout(300)
const box = await page.locator('.react-flow__nodes').boundingBox()
console.log('nodes', await page.locator('.react-flow__node-step').count(), 'box', box)
if (box) {
  const x = Math.max(0, box.x - 24), y = Math.max(0, box.y - 24)
  const w = Math.min(1800 - x, box.width + 48), h = Math.min(1100 - y, box.height + 48)
  await page.screenshot({ path: 'tmp/dengue-fit.png', clip: { x, y, width: w, height: h } })
}
await browser.close()
