import { useEffect, useState } from 'react'
import type { StepResult } from '../../engine/client'
import { artifactUrl } from '../../engine/client'
import type { FnSpec } from '../../catalog'
import type { Lang } from '../../store/pipeline'
import { t } from '../../i18n'

interface Props {
  result: StepResult
  fn: FnSpec
  lang: Lang
  compact?: boolean
}

// pure render-by-kind switch, shared by the graph node body and the detail side panel
export default function ResultBody({ result, fn, lang, compact }: Props) {
  const [interactive, setInteractive] = useState(false)
  const cls = (base: string) => (compact ? `${base} compact` : base)
  const cacheSuffix = result.cacheKey ? `?v=${encodeURIComponent(result.cacheKey)}` : ''
  const artifacts = result.artifacts
  const hasInteractive = !!artifacts?.html
  const hasStaticPreview = !!artifacts?.png

  useEffect(() => {
    setInteractive(false)
  }, [result.var, result.cacheKey, artifacts?.png, artifacts?.html])

  if (!result.ok) {
    return <pre className={cls('console-out mono error nowheel')}>{result.error}</pre>
  }

  if (result.kind === 'table' && result.preview) {
    const rows = compact ? result.preview.rows.slice(0, 5) : result.preview.rows
    return (
      <div className={cls('table-wrap nowheel')}>
        <table className="data-table" data-testid="result-table">
          <thead>
            <tr>{result.preview.columns.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {result.preview!.columns.map((c) => <td key={c}>{String(row[c] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if ((result.kind === 'plot' || result.kind === 'widget') && artifacts) {
    const canToggle = hasInteractive && hasStaticPreview
    return (
      <div className={cls('plot-body')}>
        {canToggle && (
          <div className="plot-toggle">
            <button className={`btn btn-sm ${!interactive ? 'btn-primary' : ''}`} onClick={() => setInteractive(false)}>
              {t('staticPlot', lang)}
            </button>
            <button className={`btn btn-sm ${interactive ? 'btn-primary' : ''}`} onClick={() => setInteractive(true)}>
              {t('interactivePlot', lang)}
            </button>
          </div>
        )}
        {interactive && hasInteractive ? (
          <iframe
            className="result-widget"
            src={`${artifactUrl(artifacts.html!)}${cacheSuffix}`}
            title={fn.name}
            data-testid={result.kind === 'plot' ? 'result-widget-plot' : 'result-widget'}
          />
        ) : hasStaticPreview ? (
          <img
            className="result-plot"
            src={`${artifactUrl(artifacts.png!)}${cacheSuffix}`}
            alt={fn.name}
            data-testid="result-plot"
          />
        ) : (
          <iframe
            className={cls('result-widget')}
            src={`${artifactUrl(artifacts.html!)}${cacheSuffix}`}
            title={fn.name}
            data-testid={result.kind === 'plot' ? 'result-widget-plot' : 'result-widget'}
          />
        )}
      </div>
    )
  }

  return <pre className={cls('console-out mono nowheel')}>{result.print}</pre>
}
