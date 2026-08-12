import { useEffect } from 'react'
import { usePipeline, type Lang } from '../store/pipeline'
import { t } from '../i18n'
import { RESPIRATORIO_SP } from '../tutorials/respiratorio'

export default function TopBar() {
  const {
    lang, setLang, theme, toggleTheme, clear, engineStatus, steps, stepResults, runPipeline,
    openHelp, openAbout, saveProject, openProject, startFromDataFile, startTutorial, exportReport,
  } = usePipeline()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const canRun = engineStatus === 'ready' && steps.length > 0
  const canExportReport = engineStatus === 'ready' && Object.keys(stepResults).length > 0
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand">
          <span className="brand-name">climasus<span className="brand-plus">+</span> Studio</span>
          <span className="brand-sub">{t('subtitle', lang)}</span>
        </div>
        <div className="brand-logos" title="INCT-CONEXAO · Fiocruz Rondônia · UFJF · CNPq">
          <img src="/logos/inct-conexao-logo6-small.png" alt="INCT-CONEXAO" />
          <img src="/logos/fiocruz-rondonia.png" alt="Fiocruz Rondônia" />
          <img src="/logos/ufjf.png" alt="UFJF" />
          <img src="/logos/cnpq-branca.png" alt="CNPq" className="logo-invert" />
        </div>
      </div>
      <div className="topbar-actions">
        <div className={`engine-status engine-${engineStatus}`} title={`R: ${engineStatus}`}>
          <span className="engine-dot" aria-hidden="true" />
          <span>R</span>
        </div>
        <div className="topbar-group topbar-group-run">
          <button className="btn btn-primary" disabled={!canRun} onClick={() => runPipeline()}>
            {engineStatus === 'busy' ? t('running', lang) : `▶ ${t('run', lang)}`}
          </button>
          <button className="btn" onClick={() => startTutorial(RESPIRATORIO_SP)}>
            {t('guidedTutorial', lang)}
          </button>
          <button className="btn" onClick={openHelp}>{t('help', lang)}</button>
        </div>
        <div className="topbar-group">
          <button className="btn" onClick={saveProject} title={t('saveProjectHint', lang)}>{t('saveProject', lang)}</button>
          <button className="btn" onClick={openProject} title={t('openProjectHint', lang)}>{t('openProject', lang)}</button>
          <button className="btn" disabled={!canExportReport} onClick={exportReport} title={t('reportHint', lang)}>{t('report', lang)}</button>
        </div>
        <div className="topbar-group">
          <button className="btn" onClick={startFromDataFile} title={t('openDataHint', lang)}>{t('openData', lang)}</button>
          <button className="btn" onClick={openAbout}>{t('about', lang)}</button>
          <button className="btn" onClick={clear}>{t('clearAll', lang)}</button>
        </div>
        <div className="topbar-group topbar-group-compact">
          <select
            className="input lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            aria-label="language"
          >
            <option value="pt">PT</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
          <button className="btn theme-toggle" onClick={toggleTheme} aria-label="theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </header>
  )
}
