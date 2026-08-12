import { useState } from 'react'
import { usePipeline, generateR } from '../store/pipeline'
import { t, tp } from '../i18n'
import { saveTextFile } from '../project/io'

export default function CodePanel() {
  const { steps, lang, engineStatus, engineIssue } = usePipeline()
  const [copied, setCopied] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const code = generateR(steps, lang)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = async () => {
    setSaveError(null)
    try {
      await saveTextFile(code, 'pipeline_climasus4r.R')
    } catch (e) {
      setSaveError(String(e))
    }
  }

  return (
    <section className="code-panel">
      <div className="code-head">
        <h2>{t('codeR', lang)}</h2>
        <div className="code-actions">
          <button className="btn" onClick={copy}>{copied ? t('copied', lang) : t('copy', lang)}</button>
          <button className="btn btn-primary" onClick={download}>{t('exportR', lang)}</button>
        </div>
      </div>
      {engineStatus === 'offline' && engineIssue && (
        <div className="panel-note" role="status">
          {tp('offlineDetails', lang, { message: engineIssue })}
        </div>
      )}
      {saveError && <div className="panel-note" role="alert">{saveError}</div>}
      <pre className="code mono" data-testid="r-code">{code}</pre>
    </section>
  )
}
