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
  { id: 'integracao', match: /^(sus_join_spatial|sus_socio_|sus_census_explore|sus_climate_|sus_grid_)/ },
  { id: 'modelagem', match: /^sus_mod_/ },
  { id: 'rap', match: /^sus_rap_/ },
]
// sub-family for grouping inside a stage
function family(name) {
  if (/^sus_grid_/.test(name)) return 'grid'
  if (/^sus_climate_/.test(name)) return 'climate'
  if (/^(sus_socio_|sus_census_explore)/.test(name)) return 'censo'
  if (/^sus_join_spatial/.test(name)) return 'spatial'
  if (/plot/.test(name)) return 'plot'
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
  const title = head.find((l) => l.trim()) ?? ''
  const description = head.slice(head.indexOf(title) + 1).join('\n').trim().slice(0, 600)
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
  if (options.length > 1) return 'enum'
  if (def === 'TRUE' || def === 'FALSE') return 'boolean'
  if (def !== undefined && /^-?[\d.]+$/.test(def)) return 'number'
  return 'text'
}

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
      return {
        name: pname,
        default: def ?? null,
        required: eq === -1 && pname !== '...',
        type: inferType(def, doc.options),
        options: doc.options,
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
