import { useState } from 'react'
import { usePipeline, generateR } from '../store/pipeline'
import { t, tp } from '../i18n'

export default function CodePanel() {
  const { steps, lang, engineStatus, engineIssue } = usePipeline()
  const [copied, setCopied] = useState(false)
  const code = generateR(steps)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'pipeline_climasus4r.R' })
    a.click()
    URL.revokeObjectURL(url)
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
      <pre className="code mono" data-testid="r-code">{code}</pre>
    </section>
  )
}
