import { useEffect } from 'react'
import TopBar from './ui/TopBar'
import Library from './ui/Library'
import PipelineGraph from './ui/graph/PipelineGraph'
import Inspector from './ui/Inspector'
import CodePanel from './ui/CodePanel'
import ResultsPanel from './ui/ResultsPanel'
import HelpPanel from './ui/HelpPanel'
import AboutPanel from './ui/AboutPanel'
import ModeSelector from './ui/ModeSelector'
import { usePipeline } from './store/pipeline'
import { t } from './i18n'

// canvas keyboard shortcuts (see i18n `shortcutsTitle`); skipped while typing or a modal is open
function useCanvasShortcuts() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const s = usePipeline.getState()
      if (s.helpOpen || s.aboutOpen || s.modeOpen) return
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === 'k') {
        e.preventDefault()
        if (s.collapsed.library) s.toggleCollapse('library')
        requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.library .search')?.focus())
        return
      }
      if (mod && key === 'enter') { e.preventDefault(); s.runPipeline(); return }
      const el = document.activeElement as HTMLElement | null
      if (el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)) return
      const i = s.steps.findIndex((x) => x.id === s.selectedStep)
      if (key === 'arrowleft' || key === 'arrowright') {
        const next = s.steps[i < 0 ? 0 : i + (key === 'arrowright' ? 1 : -1)]
        if (next) { e.preventDefault(); s.select(next.id) }
        return
      }
      if (i < 0) return
      if (key === 'escape') s.select(null)
      else if (key === 'delete' || key === 'backspace') { e.preventDefault(); s.removeStep(s.steps[i].id) }
      else if (mod && key === 'd') { e.preventDefault(); s.duplicateStep(s.steps[i].id) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  const {
    lang,
    engineStatus,
    centerTab,
    setCenterTab,
    expandedPanel,
    toggleExpand,
    mode,
    steps,
    openModeSelector,
    collapsed,
    toggleCollapse,
  } = usePipeline()

  useEffect(() => {
    document.documentElement.dataset.outputMode = centerTab
  }, [centerTab])

  // first-ever launch (no project yet, no mode chosen): prompt for it once
  useEffect(() => {
    if (mode === null && steps.length === 0) openModeSelector()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useCanvasShortcuts()

  useEffect(() => {
    if (engineStatus === 'offline' && centerTab !== 'code') setCenterTab('code')
  }, [engineStatus, centerTab, setCenterTab])

  const outputPanel = (
    <section className="output-panel glass" data-collapsed={collapsed.output || undefined}>
      <div className="output-tabs">
        <button className={`output-tab ${centerTab === 'code' ? 'active' : ''}`} onClick={() => { setCenterTab('code'); if (collapsed.output) toggleCollapse('output') }}>
          {t('codeTab', lang)}
        </button>
        <button
          className={`output-tab ${centerTab === 'results' ? 'active' : ''}`}
          onClick={() => { setCenterTab('results'); if (collapsed.output) toggleCollapse('output') }}
          disabled={engineStatus === 'offline'}
          title={engineStatus === 'offline' ? t('offlineHint', lang) : undefined}
        >
          {t('resultsTab', lang)}
        </button>
        <button
          className="btn btn-sm expand-toggle"
          onClick={() => toggleCollapse('output')}
          title={collapsed.output ? t('showOutput', lang) : t('hidePanel', lang)}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d={collapsed.output ? 'M3 7.5 6 4.5 9 7.5' : 'M3 4.5 6 7.5 9 4.5'} />
          </svg>
        </button>
        <button
          className="btn btn-sm output-expand"
          onClick={() => toggleExpand('output')}
          title={expandedPanel === 'output' ? t('collapsePanel', lang) : t('expandPanel', lang)}
        >
          {expandedPanel === 'output' ? '⤡' : '⤢'}
        </button>
      </div>
      {centerTab === 'code' || engineStatus === 'offline' ? <CodePanel /> : <ResultsPanel />}
    </section>
  )

  return (
    <div className="app">
      <TopBar />
      <main
        className="workspace"
        data-expanded={expandedPanel ?? undefined}
        data-left={collapsed.library ? 'collapsed' : undefined}
        data-right={collapsed.inspector ? 'collapsed' : undefined}
      >
        {collapsed.library ? (
          <aside className="side-rail glass library">
            <button className="btn btn-sm side-rail-btn" title={t('showLibrary', lang)} onClick={() => toggleCollapse('library')}>»</button>
            <span className="side-rail-label">{t('library', lang)}</span>
          </aside>
        ) : <Library />}
        <div className="center">
          <PipelineGraph />
          {outputPanel}
        </div>
        {collapsed.inspector ? (
          <aside className="side-rail glass inspector">
            <button className="btn btn-sm side-rail-btn" title={t('showInspector', lang)} onClick={() => toggleCollapse('inspector')}>«</button>
            <span className="side-rail-label">{t('params', lang)}</span>
          </aside>
        ) : <Inspector />}
      </main>
      <HelpPanel />
      <AboutPanel />
      <ModeSelector />
    </div>
  )
}
