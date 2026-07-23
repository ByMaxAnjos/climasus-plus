import { useState } from 'react'
import { usePipeline } from '../store/pipeline'
import { byName } from '../catalog'
import { t, tp } from '../i18n'
import ResultBody from './result/ResultBody'
import ResultActions from './result/ResultActions'

export default function ResultsPanel() {
  const { steps, selectedStep, stepResults, stepRun, lang, runError, validationIssues, engineIssue, engineStatus } = usePipeline()
  const [showConsole, setShowConsole] = useState(false)

  // show the selected step's result, else the last step that has one
  const step =
    steps.find((s) => s.id === selectedStep && stepResults[s.id]) ??
    [...steps].reverse().find((s) => stepResults[s.id])
  const result = step ? stepResults[step.id] : undefined
  const fn = step ? byName.get(step.fn) : undefined
  const running = Object.values(stepRun).some((s) => s === 'running')

  if (runError) {
    return (
      <div className="results-empty">
        <div>⚠ {runError}</div>
        {engineStatus === 'offline' && engineIssue && <div>{tp('offlineDetails', lang, { message: engineIssue })}</div>}
        {validationIssues.length > 0 && (
          <ul className="validation-list">
            {validationIssues.map((issue) => (
              <li key={`${issue.stepId}:${issue.arg ?? 'x'}:${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  if (running && !result) return <div className="results-empty spinner-hint">{t('running', lang)}</div>
  if (!result || !fn) return <div className="results-empty">{t('noResults', lang)}</div>

  return (
    <div className="results">
      <div className="results-head">
        <span className="mono fn-name">{fn.name}</span>
        {result.ok && result.kind === 'table' && result.dims && (
          <span className="results-dims">
            {result.dims.nrow != null ? `${result.dims.nrow.toLocaleString()} × ${result.dims.ncol}` : `${result.dims.ncol} colunas`}
          </span>
        )}
        <span className="results-ms">{result.ms} ms</span>
        <ResultActions result={result} lang={lang} showConsole={showConsole} onToggleConsole={() => setShowConsole(!showConsole)} />
      </div>
      <div className="results-body">
        <ResultBody result={result} fn={fn} lang={lang} />
        {showConsole && result.console && <pre className="console-out mono">{result.console}</pre>}
      </div>
    </div>
  )
}
