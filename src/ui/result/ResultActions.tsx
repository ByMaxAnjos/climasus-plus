import { useState } from 'react'
import type { StepResult } from '../../engine/client'
import { artifactUrl, downloadUrl } from '../../engine/client'
import { saveRemoteFile } from '../../project/io'
import type { Lang } from '../../store/pipeline'
import { t } from '../../i18n'

interface Props {
  result: StepResult
  lang: Lang
  showConsole: boolean
  onToggleConsole: () => void
}

// download/export button row + console toggle, shared by the graph node header and the detail panel
export default function ResultActions({ result, lang, showConsole, onToggleConsole }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const artifacts = result.artifacts

  async function handleDownload(url: string, filename: string, key: string) {
    try {
      setDownloading(key)
      await saveRemoteFile(url, filename)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="results-actions">
      {result.ok && result.kind === 'table' && (
        <>
          <button className="btn btn-sm" onClick={() => handleDownload(downloadUrl(result.var, 'csv'), `${result.var}.csv`, 'csv')} disabled={downloading !== null}>
            {downloading === 'csv' ? '...' : 'CSV'}
          </button>
          <button className="btn btn-sm" onClick={() => handleDownload(downloadUrl(result.var, 'xlsx'), `${result.var}.xlsx`, 'xlsx')} disabled={downloading !== null}>
            {downloading === 'xlsx' ? '...' : 'XLSX'}
          </button>
          <button className="btn btn-sm" onClick={() => handleDownload(downloadUrl(result.var, 'parquet'), `${result.var}.parquet`, 'parquet')} disabled={downloading !== null}>
            {downloading === 'parquet' ? '...' : 'Parquet'}
          </button>
        </>
      )}
      {result.ok && result.kind === 'plot' && artifacts && (
        <>
          <button className="btn btn-sm" onClick={() => handleDownload(artifactUrl(artifacts.png!), `${result.var}.png`, 'png')} disabled={downloading !== null}>
            {downloading === 'png' ? '...' : 'PNG'}
          </button>
          <button className="btn btn-sm" onClick={() => handleDownload(artifactUrl(artifacts.svg!), `${result.var}.svg`, 'svg')} disabled={downloading !== null}>
            {downloading === 'svg' ? '...' : 'SVG'}
          </button>
        </>
      )}
      {result.ok && result.kind === 'widget' && artifacts && (
        <>
          <a className="btn btn-sm" href={artifactUrl(artifacts.html!)} target="_blank" rel="noreferrer">HTML ↗</a>
          {artifacts.png && (
            <button className="btn btn-sm" onClick={() => handleDownload(artifactUrl(artifacts.png!), `${result.var}.png`, 'map-png')} disabled={downloading !== null}>
              {downloading === 'map-png' ? '...' : t('saveMap', lang)}
            </button>
          )}
        </>
      )}
      {(result.console || !result.ok) && (
        <button className={`btn btn-sm ${showConsole ? 'btn-primary' : ''}`} onClick={onToggleConsole}>
          {t('console', lang)}
        </button>
      )}
    </div>
  )
}
