import { extractMethodWarnings } from './methodWarnings'

// Distinct from the generic console/error surfacing: flags statistical-validity risks (small n,
// short period, failed geocoding, ...) that a non-programmer running the pipeline could otherwise
// miss entirely — visible without opening the console.
export default function MethodWarningBanner({ consoleText }: { consoleText: string | undefined }) {
  const warnings = extractMethodWarnings(consoleText)
  if (!warnings.length) return null
  return (
    <div className="method-warning-banner">
      {warnings.map((w, i) => (
        <div className="method-warning-item" key={i}>
          <span className="method-warning-icon" aria-hidden="true">⚠</span>
          <span>{w}</span>
        </div>
      ))}
    </div>
  )
}
