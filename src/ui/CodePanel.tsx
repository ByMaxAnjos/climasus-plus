import { useState } from 'react'
import { usePipeline, generateR } from '../store/pipeline'
import { t, tp } from '../i18n'
import { saveTextFile } from '../project/io'

// ponytail: regex tokenizer for the R we generate (comments, strings, numbers, constants, calls,
// named args, operators) — not a full R grammar; swap for a real highlighter if arbitrary R is shown
const TOKEN = /(#.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(TRUE|FALSE|NULL|NA|Inf)\b|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?L?\b)|(\|>|<-|::)|([A-Za-z_.][\w.]*)(?=\s*\()|([A-Za-z_.][\w.]*)(?=\s*=(?!=))/g
const CLS = ['', 'tok-comment', 'tok-string', 'tok-const', 'tok-number', 'tok-op', 'tok-fn', 'tok-arg']

function highlightR(code: string) {
  const out: (string | JSX.Element)[] = []
  let last = 0
  for (const m of code.matchAll(TOKEN)) {
    if (m.index! > last) out.push(code.slice(last, m.index))
    out.push(<span key={m.index} className={CLS[m.slice(1).findIndex(Boolean) + 1]}>{m[0]}</span>)
    last = m.index! + m[0].length
  }
  out.push(code.slice(last))
  return out
}

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
      <pre className="code mono" data-testid="r-code">{highlightR(code)}</pre>
    </section>
  )
}
