import { chromium } from 'playwright'
const q = process.argv[2], out = process.argv[3]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:1420/')
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForSelector('.stage-tab')
if (await page.locator('.about-backdrop').count() > 0) await page.keyboard.press('Escape')
await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
await page.locator('.topbar-actions .btn', { hasText: 'Pipelines' }).click()
await page.waitForSelector('.help-panel'); await page.locator('.help-search').fill(q); await page.waitForTimeout(300)
await page.locator('.help-card').first().locator('.btn-primary').click(); await page.waitForSelector('.help-panel',{state:'detached'}); await page.waitForTimeout(700)
await page.evaluate(() => { const s=window.__store.getState(); const first=s.steps[0]; if(first && first.fn==='sus_data_read') s.setValue(first.id,'path','dados_agregados.parquet'); s.select(null) })
await page.waitForTimeout(400)
const expand = page.locator('.canvas-head .expand-toggle'); if (await expand.count()) { await expand.click(); await page.waitForTimeout(500) }
const fit = page.locator('.react-flow__controls-button[title="Enquadrar pipeline"]'); if (await fit.count()) { await fit.click(); await page.waitForTimeout(700) }
const vp = await page.locator('.graph-canvas').boundingBox()
const box0 = await page.locator('.react-flow__node-step').evaluateAll(els => { const rs=els.map(e=>e.getBoundingClientRect()); return {right:Math.max(...rs.map(r=>r.right)), bottom:Math.max(...rs.map(r=>r.bottom))} })
if (vp && (box0.right > vp.x + vp.width - 10 || box0.bottom > vp.y + vp.height - 10)) { await page.locator('.react-flow__controls-button[title="Zoom Out"]').click(); await page.waitForTimeout(500) }
await page.evaluate(() => window.__store.getState().select(null))
await page.addStyleTag({ content: '.react-flow__minimap,.react-flow__controls,.react-flow__panel,.library,.inspector,.output-panel{display:none!important}' })
await page.waitForTimeout(300)
const rects = await page.locator('.react-flow__node-step').evaluateAll(els => els.map(e=>e.getBoundingClientRect()))
const x=Math.max(0,Math.min(...rects.map(r=>r.x))-40), y=Math.max(0,Math.min(...rects.map(r=>r.y))-70)
const right=Math.max(...rects.map(r=>r.right))+40, bottom=Math.max(...rects.map(r=>r.bottom))+40
console.log(out, rects.length, {x,y,w:right-x,h:bottom-y})
await page.screenshot({ path: `tmp/shots/${out}.png`, clip: { x, y, width: Math.min(1800-x, right-x), height: Math.min(1100-y, bottom-y) } })
await browser.close()
