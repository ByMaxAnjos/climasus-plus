// Methodological warnings: climasus4r functions flag statistically risky conditions (small event
// count, insufficient time period, failed geocoding, ...) via cli::cli_warn() with a fixed marker
// prefix. engine/api.R's run_step() already captures every R warning into the step's console text
// (see the `warning =` handler) — this just picks the marked lines back out and strips the marker,
// so they can be shown as a distinct banner instead of buried in the raw console.
const METHOD_TAG = '[METODOLOGIA]'

export function extractMethodWarnings(consoleText: string | undefined): string[] {
  if (!consoleText) return []
  return consoleText
    .split('\n')
    .filter((line) => line.includes(METHOD_TAG))
    .map((line) => line.slice(line.indexOf(METHOD_TAG) + METHOD_TAG.length).trim())
    .filter(Boolean)
}
