// Recaptura as imagens do Guia Prático (book/images/screenshots) na versão atual do Studio.
// Requer `npm run dev` (:1420) e o motor (:8787). Uso: node book/scripts/capture-screenshots.mjs book/images/screenshots [job]
import { chromium } from 'playwright'
const OUT = process.argv[2]
const only = process.argv[3]
// relative to the engine's working dir (engine/): the sample bundled with the Studio
const TEST = 'testdata/sim_do_sp_2014_2019_respiratory.parquet'
const b = await chromium.launch()

async function open(w = 1800, h = 1100, mode = 'pesquisa') {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto('http://localhost:1420/')
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForSelector('.stage-tab')
  await p.evaluate(() => { document.documentElement.dataset.theme = 'light' })
  if (mode) { await p.evaluate((m) => window.__store.getState().setMode(m), mode); await p.waitForTimeout(300) }
  return p
}
async function loadTpl(p, q) {
  await p.locator('.topbar-actions .btn', { hasText: 'Pipelines' }).click()
  await p.waitForSelector('.help-panel'); await p.locator('.help-search').fill(q); await p.waitForTimeout(300)
  await p.locator('.help-card').first().locator('.btn-primary').click()
  await p.waitForSelector('.help-panel', { state: 'detached' }); await p.waitForTimeout(800)
  await p.evaluate(() => { const s = window.__store.getState(); s.steps.filter((x) => x.fn === 'sus_data_read' && !x.values.path).forEach((x) => s.setValue(x.id, 'path', 'dados_agregados.parquet')) })
  await p.waitForTimeout(300)
}
async function graphShot(p, out, pad = 40) {
  await p.evaluate(() => { const s = window.__store.getState(); s.select(null); if (s.expandedPanel !== 'graph') s.toggleExpand('graph') })
  await p.waitForTimeout(600)
  const fit = p.locator('.react-flow__controls-button[title="Enquadrar pipeline"]'); if (await fit.count()) { await fit.click(); await p.waitForTimeout(700) }
  await p.evaluate(() => window.__store.getState().select(null)); await p.waitForTimeout(200)
  await p.addStyleTag({ content: '.react-flow__minimap,.react-flow__controls,.react-flow__panel{display:none!important}' })
  await p.waitForTimeout(300)
  const r = await p.locator('.react-flow__node').evaluateAll((els) => { const rs = els.map((e) => e.getBoundingClientRect()).filter((x) => x.width > 0); return { x: Math.min(...rs.map((x) => x.x)), y: Math.min(...rs.map((x) => x.y)), right: Math.max(...rs.map((x) => x.right)), bottom: Math.max(...rs.map((x) => x.bottom)) } })
  const vw = p.viewportSize()
  const x = Math.max(0, r.x - pad), y = Math.max(0, r.y - pad)
  await p.screenshot({ path: `${OUT}/${out}.png`, clip: { x, y, width: Math.min(vw.width - x, r.right - r.x + 2 * pad), height: Math.min(vw.height - y, r.bottom - r.y + 2 * pad) } })
  console.log('ok', out)
}
async function runTest(p, fns) {
  await p.evaluate(() => window.__store.getState().restartEngine())
  await p.evaluate(({ fns, TEST }) => {
    const s = window.__store.getState(); s.clear(); s.addSteps(fns)
    const st = window.__store.getState().steps
    s.setValue(st[0].id, 'path', TEST)
    const agg = st.find((x) => x.fn === 'sus_data_aggregate'); if (agg) { s.setValue(agg.id, 'time_unit', 'month'); s.setValue(agg.id, 'group_by', 'codigo_municipio_residencia') }
  }, { fns, TEST })
  await p.evaluate(() => window.__store.getState().runPipeline())
  try { await p.waitForFunction(() => { const s = window.__store.getState(); return !s.steps.some((x) => s.stepRun[x.id] === 'running') && s.steps.some((x) => s.stepRun[x.id]) }, null, { timeout: 240000 }) }
  catch (e) { console.log('STATE', await p.evaluate(() => { const s = window.__store.getState(); return JSON.stringify({ run: s.stepRun, err: s.runError, eng: s.engineStatus }) })); throw e }
  console.log('RUN', await p.evaluate(() => { const s = window.__store.getState(); return JSON.stringify({ run: Object.values(s.stepRun), err: s.runError }) }))
  await p.waitForTimeout(800)
}
const jobs = {
  async modelos() {
    for (const [q, out] of [['Mortalidade respiratória pediátrica', 'studio-modelo-respiratorio'], ['Dengue e', 'studio-modelo-dengue'], ['Hospitalizações respiratórias e ondas de frio', 'studio-modelo-hospitalizacao-frio'], ['Mortalidade cardiovascular em idosos', 'studio-modelo-cardio-calor'], ['Exposição aguda', 'studio-integracao-pipeline'], ['limpar, filtrar e agregar', 'studio-preparacao-pipeline']]) {
      const p = await open(1800, 1100, out.startsWith('studio-modelo-') ? 'vigilancia' : 'pesquisa'); await loadTpl(p, q); await graphShot(p, out); await p.close()
    }
    const p = await open(1100, 900); await loadTpl(p, 'Modelagem DLNM a partir'); await graphShot(p, 'studio-modelagem-pipeline'); await p.close()
  },
  async modo() {
    const p = await open(1440, 900, null)
    await p.waitForSelector('.mode-panel'); await p.waitForTimeout(400)
    await p.locator('.mode-panel').screenshot({ path: `${OUT}/studio-modo-uso.png` }); console.log('ok modo'); await p.close()
  },
  async biblioteca() {
    const p = await open(1760, 1080)
    await p.locator('.library').screenshot({ path: `${OUT}/studio-biblioteca-etapas.png` }); console.log('ok biblioteca'); await p.close()
  },
  async inspetor() {
    const p = await open(1760, 1080)
    await p.evaluate(() => { const s = window.__store.getState(); s.clear(); s.addSteps(['sus_data_read', 'sus_data_clean_encoding', 'sus_data_standardize', 'sus_data_filter_cid']); const st = window.__store.getState().steps; s.setValue(st[0].id, 'path', 'dados_agregados.parquet'); s.setValue(st[3].id, 'disease_group', 'respiratory'); s.select(st[3].id) })
    await p.waitForTimeout(500)
    const adv = p.locator('.advanced-params'); if (await adv.count() && !(await adv.evaluate((d) => d.open))) { await adv.locator('summary').click(); await p.waitForTimeout(300) }
    await p.locator('.inspector').screenshot({ path: `${OUT}/studio-inspetor-parametros.png` }); console.log('ok inspetor'); await p.close()
  },
  async execucao() {
    const p = await open(1760, 1080)
    await runTest(p, ['sus_data_read', 'sus_data_clean_encoding', 'sus_data_standardize'])
    await p.evaluate(() => { const s = window.__store.getState(); s.select(s.steps[1].id) })
    await p.waitForTimeout(900)
    const fit = p.locator('.react-flow__controls-button[title="Enquadrar pipeline"]'); if (await fit.count()) { await fit.click(); await p.waitForTimeout(700) }
    await p.addStyleTag({ content: '.react-flow__minimap{display:none!important}' })
    await p.locator('.canvas').screenshot({ path: `${OUT}/studio-no-pipeline.png` }); console.log('ok no-pipeline')
    // agora com agregação, para o painel de resultados e a visão geral
    await p.evaluate(() => { const s = window.__store.getState(); if (s.expandedPanel) s.toggleExpand(s.expandedPanel) })
    await runTest(p, ['sus_data_read', 'sus_data_clean_encoding', 'sus_data_standardize', 'sus_data_aggregate'])
    await p.evaluate(() => { const s = window.__store.getState(); s.select(s.steps[3].id); s.setCenterTab('results') })
    await p.waitForTimeout(900)
    { const fit = p.locator('.react-flow__controls-button[title="Enquadrar pipeline"]'); if (await fit.count()) { await fit.click(); await p.waitForTimeout(700) } }
    { const out = p.locator('.react-flow__controls-zoomout'); if (await out.count()) { await out.click(); await p.waitForTimeout(600) } }
    await p.locator('.output-panel').screenshot({ path: `${OUT}/studio-resultado.png` }); console.log('ok resultado')
    await p.screenshot({ path: `${OUT}/studio-visao-geral.png` }); console.log('ok visao-geral')
    await p.close()
  },
}
for (const [k, f] of Object.entries(jobs)) if (!only || only === k) { try { await f() } catch (e) { console.log('FAIL', k, String(e).slice(0, 300)) } }
await b.close()
