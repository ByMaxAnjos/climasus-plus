// Parses climasus4r roxygen + signatures into src/catalog/functions.json
// Usage: node scripts/build-catalog.mjs [path-to-package]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = process.argv[2] ?? process.env.CLIMASUS4R_PKG ?? '/Users/co2map/Documents/2026/CLIMASUS4r/climasus4r'
const RDIR = join(PKG, 'R')
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'catalog', 'functions.json')

// stage assignment by prefix (order matters: first match wins)
const STAGES = [
  { id: 'preparacao', match: /^(sus_data_|sus_create_variables|sus_filter_cid_explore)/ },
  { id: 'integracao', match: /^(sus_spatial_join|sus_socio_|sus_census_|sus_climate_|sus_grid_)/ },
  { id: 'modelagem', match: /^sus_mod_/ },
]
// sub-family for grouping inside a stage
function family(name) {
  if (/plot/.test(name)) return 'plot'
  if (/^sus_grid_/.test(name)) return 'grid'
  if (/^sus_climate_/.test(name)) return 'climate'
  if (/^(sus_socio_|sus_census_)/.test(name)) return 'censo'
  if (/^sus_spatial_join/.test(name)) return 'spatial'
  return 'core'
}

function stripRox(line) {
  return line.replace(/^#'\s?/, '')
}

function parseFile(path) {
  const text = readFileSync(path, 'utf8')
  const lines = text.split('\n')
  const fns = []
  // find exported roxygen blocks followed by `name <- function(`
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([a-zA-Z0-9_.]+)\s*<-\s*function\s*\(/)
    if (!m) continue
    const name = m[1]
    if (!name.startsWith('sus_')) continue
    // walk back to collect the contiguous roxygen block
    const rox = []
    for (let j = i - 1; j >= 0 && /^(#'|\s*$)/.test(lines[j]); j--) {
      if (/^#'/.test(lines[j])) rox.unshift(stripRox(lines[j]))
    }
    if (!rox.some((l) => l.startsWith('@export'))) continue
    // signature: from the `function(` to its matching `)`
    let sig = ''
    let depth = 0
    let started = false
    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === '(') { depth++; started = true; if (depth === 1) continue }
        if (ch === ')') { depth--; if (started && depth === 0) break }
        if (started && depth >= 1) sig += ch
      }
      if (started && depth === 0) break
      sig += '\n'
    }
    fns.push({ name, rox, sig })
  }
  return fns
}

// split "a = NULL, b = c(1, 2), c" on top-level commas
function splitArgs(sig) {
  const out = []
  let depth = 0, cur = ''
  for (const ch of sig) {
    if ('([{'.includes(ch)) depth++
    if (')]}'.includes(ch)) depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
  }
  if (cur.trim()) out.push(cur)
  return out.map((s) => s.trim()).filter(Boolean)
}

function parseRoxygen(rox) {
  // title = first non-tag line; description = lines until first @tag (after blank)
  const tags = []
  let buf = { tag: '_head', text: [] }
  for (const l of rox) {
    const t = l.match(/^@(\w+)\s*(.*)/)
    if (t) { tags.push(buf); buf = { tag: t[1], text: [t[2]] } } else buf.text.push(l)
  }
  tags.push(buf)
  const head = tags.find((t) => t.tag === '_head')?.text ?? []
  const explicitTitle = tags.find((t) => t.tag === 'title')?.text.join(' ').trim()
  const explicitDescription = tags.find((t) => t.tag === 'description')?.text.join('\n').trim()
  const title = explicitTitle || head.find((l) => l.trim()) || ''
  const description = explicitDescription || head.slice(head.indexOf(title) + 1).join('\n').trim().slice(0, 600)
  const params = {}
  for (const t of tags) {
    if (t.tag !== 'param') continue
    const [first, ...rest] = t.text
    const pm = (first ?? '').match(/^([\w.,]+)\s*(.*)/)
    if (!pm) continue
    const full = [pm[2], ...rest].join('\n')
    // enum candidates: `"VALUE"` occurrences in the param doc
    const opts = [...full.matchAll(/`"([^"`]+)"`/g)].map((x) => x[1])
    for (const pname of pm[1].split(',')) {
      params[pname.trim()] = {
        doc: full.trim().split(/\n\s*\n/)[0].slice(0, 400),
        options: [...new Set(opts)].slice(0, 60),
      }
    }
  }
  return { title: title.trim(), description, params }
}

function inferType(def, options) {
  if (def === 'TRUE' || def === 'FALSE') return 'boolean'
  if (options.length > 1) return 'enum'
  if (def !== undefined && /^-?[\d.]+$/.test(def)) return 'number'
  return 'text'
}

// inferType/the `"VALUE"` option-scraper above is a heuristic, not real roxygen structure — it
// can't tell a genuine closed vocabulary (plot_type: epidemic/seasonal/heatmap/trend) from a
// param doc that just happens to mention 2+ quoted examples ("e.g. `df$n_obitos`, `df$n_casos`")
// or, worse, another parameter's enum values quoted for cross-reference (`type = "rr"` mentioned
// inside `municipalities`'s doc). Confirmed instances of both are forced to free text here;
// TODO: a real fix would only treat quotes inside an actual "Options:"/"One of ..." list as enum
// candidates, instead of scanning the whole doc paragraph.
const FORCE_TEXT = new Set([
  'sus_climate_compute_spei.rain_var', 'sus_climate_compute_spi.var',
  'sus_climate_plot_aggregate.outcome_col', 'sus_climate_plot_coldwaves.save_plot',
  'sus_climate_plot_fill.save_plot', 'sus_data_aggregate.value_col',
  'sus_data_filter_cid.icd_column', 'sus_data_filter_cid.icd_codes',
  'sus_data_filter_demographics.sex', 'sus_data_filter_demographics.city',
  'sus_data_import.city', 'sus_data_plot_demographics.fill_var',
  'sus_data_plot_aggregate_map.palette', 'sus_mod_plot_spacetime.palette',
  'sus_mod_casecrossover.outcome_col', 'sus_mod_casecrossover.exposure_col',
  'sus_mod_casecrossover.stratum', 'sus_mod_dlnm.outcome_col', 'sus_mod_its.covariates',
  'sus_mod_spatial_bayes.outcome', 'sus_mod_spatial_moran.outcome',
  'sus_data_plot_aggregate_ts.group_col',
])

// args that expect an object produced by an EARLIER pipeline step (sf boundary, climasus_df,
// spatial weights, a data.frame of covariates) rather than typed text — these are the only
// fields offered the Inspector's "use result from step N" picker (see stepRef in pipeline.ts).
// Kept as an explicit allowlist rather than a doc-text heuristic: showing that picker on every
// text field (a plain "year" or "city" filter included) is noise for functions that never need
// a second wired input, which is most of the catalog.
const FORCE_DATA = new Set([
  'sus_climate_aggregate.climate_data', 'sus_climate_anomaly.normals',
  'sus_grid_chirps.municipalities', 'sus_grid_era5.municipalities',
  'sus_grid_fires.municipalities', 'sus_grid_join.grid_data',
  'sus_grid_pdsi.municipalities', 'sus_grid_plot.municipalities',
  'sus_grid_pollution_ghap.municipalities', 'sus_grid_pollution_merra2.municipalities',
  'sus_grid_prodes.municipalities', 'sus_grid_smvi.municipalities',
  'sus_mod_metaregression.covariates', 'sus_mod_plot_spacetime.municipalities',
  'sus_mod_plot_spatial_bayes.municipalities', 'sus_mod_plot_spatial_moran.municipalities',
  'sus_mod_plot_spatial_scan.municipalities', 'sus_mod_spacetime_exceedance.municipalities',
  'sus_mod_spacetime_predict.newdata', 'sus_mod_spatial_moran.W', 'sus_mod_spatial_reg.W',
  'sus_mod_spatial_scan.municipalities',
])

const catalog = []
for (const f of readdirSync(RDIR).filter((f) => f.endsWith('.R'))) {
  for (const { name, rox, sig } of parseFile(join(RDIR, f))) {
    const stage = STAGES.find((s) => s.match.test(name))?.id
    if (!stage) continue // sus_welcome etc.
    const { title, description, params } = parseRoxygen(rox)
    const args = splitArgs(sig).map((a) => {
      const eq = a.indexOf('=')
      const pname = (eq === -1 ? a : a.slice(0, eq)).trim()
      const def = eq === -1 ? undefined : a.slice(eq + 1).trim().replace(/\n\s*/g, ' ')
      const doc = params[pname] ?? { doc: '', options: [] }
      const key = `${name}.${pname}`
      const forced = FORCE_DATA.has(key) ? 'data' : FORCE_TEXT.has(key) ? 'text' : null
      return {
        name: pname,
        default: def ?? null,
        required: eq === -1 && pname !== '...',
        type: forced ?? inferType(def, doc.options),
        options: forced ? [] : doc.options,
        doc: doc.doc,
      }
    }).filter((a) => a.name !== '...')
    catalog.push({ name, stage, family: family(name), title, description, args })
  }
}

catalog.sort((a, b) => a.name.localeCompare(b.name))
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(catalog, null, 1))
console.log(`${catalog.length} functions → ${OUT}`)
const byStage = {}
for (const c of catalog) byStage[c.stage] = (byStage[c.stage] ?? 0) + 1
console.log(byStage)
