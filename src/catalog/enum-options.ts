// Mechanical extraction of per-option labels and "what does NULL mean here" hints from the
// roxygen `doc` text already parsed into functions.json (scripts/build-catalog.mjs) — no new
// translation/curation, just surfacing what the climasus4r authors already wrote. Most enum args
// document each option via `\item \`"value"\` - description` or an inline `\`"value"\` (description)`
// list; falls back to the raw value when a doc doesn't follow either pattern.

function stripMarkup(s: string): string {
  return s
    .replace(/\\code\{([^}]*)\}/g, '$1')
    .replace(/\\pkg\{([^}]*)\}/g, '$1')
    .replace(/\\link\[[^\]]*\]\{([^}]*)\}/g, '$1')
    .replace(/\\link\{([^}]*)\}/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(s: string, max = 70): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : max)}…`
}

// Rare case (checked 2026-09-07: 1 function in the whole catalog): the @param doc points at a
// separate @section with a markdown table that the catalog build script doesn't parse — real
// content the package author already wrote, just never reached this app. Hand-translated here
// rather than teaching the generic build script to parse arbitrary @section tables for one caller.
const SECTION_FALLBACKS: Record<string, Record<string, Record<string, string>>> = {
  sus_mod_plot_dlnm: {
    type: {
      overall: 'Curva geral de risco por exposição',
      lag: 'Risco por defasagem (dias) numa exposição específica',
      surface: 'Superfície 3D exposição × defasagem',
      contour: 'Mapa de calor 2D exposição × defasagem',
      slice: 'Curvas de risco em defasagens específicas',
      distribution: 'Distribuição da variável de exposição',
      series: 'Série temporal do desfecho e da exposição',
    },
  },
}

export function enumOptionLabel(fnName: string, argName: string, doc: string, value: string): string {
  const fallback = SECTION_FALLBACKS[fnName]?.[argName]?.[value]
  if (fallback) return fallback

  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // \item{`"value"`}{description}   (roxygen \describe — braces, not a dash)
  const describeRe = new RegExp('\\\\item\\{`?"' + escaped + '"`?\\}\\{([^}]*)\\}', 'i')
  const describeMatch = doc.match(describeRe)
  if (describeMatch) return truncate(stripMarkup(describeMatch[1]))

  // \item `"value"` - description   (roxygen \itemize, dash-separated)
  const itemRe = new RegExp('\\\\item\\s*`?"' + escaped + '"`?\\s*[-–]\\s*([\\s\\S]*?)(?=\\\\item|$)', 'i')
  const itemMatch = doc.match(itemRe)
  if (itemMatch) return truncate(stripMarkup(itemMatch[1]))

  // `"value"` (description)   (the simpler inline list pattern, e.g. most `lang` args) — but
  // the parenthetical is sometimes just marking which option is the default ("plot" (default)),
  // not describing it, so a bare "default"/"padrão" capture isn't a real label
  const inlineRe = new RegExp('`"' + escaped + '"`\\s*\\(([^)]+)\\)', 'i')
  const inlineMatch = doc.match(inlineRe)
  if (inlineMatch && !/^default$|^padr[aã]o$/i.test(inlineMatch[1].trim())) return truncate(stripMarkup(inlineMatch[1]))

  return value
}

export function nullDefaultHint(doc: string): string | null {
  const m = doc.match(/\bIf\s+(?:it is\s+)?`?NULL`?\s*\(?[^.]*\./i)
  if (!m) return null
  return truncate(stripMarkup(m[0]), 90)
}
