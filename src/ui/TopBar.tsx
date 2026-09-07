import { useEffect, useState } from 'react'
import { usePipeline, type Lang } from '../store/pipeline'
import { t } from '../i18n'
import { CASE_TEMPLATES } from '../templates'

// topbar action icons — chosen from the icon-review artifact
const ICON = {
  tutorial: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M3.5 17c4-7 8-8 10-13" strokeDasharray="0.1 4.2" />
      <circle cx="14" cy="3.6" r="1.4" fill="currentColor" stroke="none" />
      <path d="M13 17.5h7.5M17.5 14l4 3.5-4 3.5" />
    </svg>
  ),
  pipelines: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="4.5" cy="12" r="2.1" /><line x1="6.6" y1="12" x2="9.9" y2="12" />
      <circle cx="12" cy="12" r="2.1" /><line x1="14.1" y1="12" x2="17.4" y2="12" />
      <circle cx="19.5" cy="12" r="2.1" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
      <rect x="4.5" y="4" width="15" height="16" rx="1.6" />
      <path d="M8 4v4.4h6.5V4" />
      <rect x="7.3" y="13" width="9.4" height="6" />
    </svg>
  ),
  open: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round">
      <path d="M3.2 8.5V6.3a1.6 1.6 0 0 1 1.6-1.6h4.1l1.8 1.8h7.5a1.6 1.6 0 0 1 1.6 1.6v.4" />
      <path d="M3.2 8.5h17l-1.7 9.3a1.7 1.7 0 0 1-1.7 1.4H6.6a1.7 1.7 0 0 1-1.7-1.4L3.2 8.5Z" />
    </svg>
  ),
  importData: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.2 3.5h6.3l4 4v12a1.1 1.1 0 0 1-1.1 1.1H7.2a1.1 1.1 0 0 1-1.1-1.1v-15a1.1 1.1 0 0 1 1.1-1Z" />
      <path d="M13.5 3.5v4h4" />
      <line x1="9.3" y1="14" x2="14.7" y2="14" />
      <line x1="12" y1="11.3" x2="12" y2="16.7" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7H4V4" />
      <path d="M4.5 12a8 8 0 1 0 2.5-6.5L4 7" />
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 7h3V4" />
      <path d="M19.5 12a8 8 0 1 1-2.5-6.5L20 7" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.1M12 18.4v2.1M4.9 6.4l1.5 1.5M17.6 16.1l1.5 1.5M3.5 12h2.1M18.4 12h2.1M4.9 17.6l1.5-1.5M17.6 7.9l1.5-1.5" />
    </svg>
  ),
}

// Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo — skipped while typing so native text-field undo still works
function useUndoRedoShortcut(undo: () => void, redo: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'z' || !(e.metaKey || e.ctrlKey)) return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      e.preventDefault()
      if (e.shiftKey) redo(); else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])
}

export default function TopBar() {
  const {
    lang, setLang, theme, toggleTheme, clear, engineStatus, steps, runPipeline,
    openHelp, openAbout, saveProject, openProject, startFromDataFile, startTutorial,
    undo, redo, past, future, mode, openModeSelector,
  } = usePipeline()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useUndoRedoShortcut(undo, redo)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const canRun = engineStatus === 'ready' && steps.length > 0
  const applicableTemplates = CASE_TEMPLATES.filter(
    (tpl) => !tpl.audience || tpl.audience === 'both' || tpl.audience === mode,
  )
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand">
          <span className="brand-name">climasus<span className="brand-plus">+</span> <span className="brand-studio">Studio</span></span>
          <span className="brand-sub">{t('subtitle', lang)}</span>
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
          <div
            className="settings-group"
            tabIndex={-1}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setTemplatesOpen(false)
            }}
          >
            <button
              className="btn"
              onClick={() => {
                if (applicableTemplates.length <= 1) {
                  if (applicableTemplates[0]) startTutorial(applicableTemplates[0])
                  return
                }
                setTemplatesOpen((o) => !o)
              }}
            >
              <span className="btn-icon">{ICON.tutorial}</span>{t('guidedTutorial', lang)}
            </button>
            {templatesOpen && applicableTemplates.length > 1 && (
              <div className="settings-menu glass">
                {applicableTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    className="btn settings-row"
                    onClick={() => { startTutorial(tpl); setTemplatesOpen(false) }}
                  >
                    {tpl.title[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn" onClick={openHelp}>
            <span className="btn-icon">{ICON.pipelines}</span>{t('help', lang)}
          </button>
          <button className="btn" onClick={clear}>{t('clearAll', lang)}</button>
        </div>
        <div className="topbar-group">
          <button className="btn" disabled={!past.length} onClick={undo} title={t('undoHint', lang)} aria-label={t('undo', lang)}>
            <span className="btn-icon">{ICON.undo}</span>
          </button>
          <button className="btn" disabled={!future.length} onClick={redo} title={t('redoHint', lang)} aria-label={t('redo', lang)}>
            <span className="btn-icon">{ICON.redo}</span>
          </button>
        </div>
        <div className="topbar-group">
          <button className="btn" onClick={saveProject} title={t('saveProjectHint', lang)}>
            <span className="btn-icon">{ICON.save}</span>{t('saveProject', lang)}
          </button>
          <button className="btn" onClick={openProject} title={t('openProjectHint', lang)}>
            <span className="btn-icon">{ICON.open}</span>{t('openProject', lang)}
          </button>
        </div>
        <div className="topbar-group">
          <button className="btn" onClick={startFromDataFile} title={t('openDataHint', lang)}>
            <span className="btn-icon">{ICON.importData}</span>{t('openData', lang)}
          </button>
        </div>
        <div className="topbar-group">
          <button className="btn mode-badge" onClick={openModeSelector}>
            {mode ? t(mode === 'vigilancia' ? 'modeVigilancia' : 'modePesquisa', lang) : t('chooseMode', lang)}
          </button>
        </div>
        <div
          className="topbar-group settings-group"
          tabIndex={-1}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSettingsOpen(false)
          }}
        >
          <button
            className="btn settings-toggle"
            aria-label={t('settings', lang)}
            title={t('settings', lang)}
            onClick={() => setSettingsOpen((o) => !o)}
          >
            <span className="btn-icon">{ICON.settings}</span>
          </button>
          {settingsOpen && (
            <div className="settings-menu glass">
              <label className="settings-row">
                <span>{t('language', lang)}</span>
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
              </label>
              <label className="settings-row">
                <span>{t('theme', lang)}</span>
                <button className="btn theme-toggle" onClick={toggleTheme} aria-label="theme">
                  {theme === 'dark' ? '☀' : '☾'}
                </button>
              </label>
              <button className="btn settings-row settings-about" onClick={() => { openAbout(); setSettingsOpen(false) }}>
                {t('about', lang)}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
