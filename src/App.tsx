import { useEffect } from 'react'
import TopBar from './ui/TopBar'
import Library from './ui/Library'
import PipelineGraph from './ui/graph/PipelineGraph'
import Inspector from './ui/Inspector'
import CodePanel from './ui/CodePanel'
import ResultsPanel from './ui/ResultsPanel'
import HelpPanel from './ui/HelpPanel'
import { usePipeline } from './store/pipeline'
import { t } from './i18n'

export default function App() {
  const {
    lang,
    engineStatus,
    centerTab,
    setCenterTab,
    expandedPanel,
    toggleExpand,
  } = usePipeline()

  useEffect(() => {
    document.documentElement.dataset.outputMode = centerTab
  }, [centerTab])

  useEffect(() => {
    if (engineStatus === 'offline' && centerTab !== 'code') setCenterTab('code')
  }, [engineStatus, centerTab, setCenterTab])

  const outputPanel = (
    <section className="output-panel glass">
      <div className="output-tabs">
        <button className={`output-tab ${centerTab === 'code' ? 'active' : ''}`} onClick={() => setCenterTab('code')}>
          {t('codeTab', lang)}
        </button>
        <button
          className={`output-tab ${centerTab === 'results' ? 'active' : ''}`}
          onClick={() => setCenterTab('results')}
          disabled={engineStatus === 'offline'}
          title={engineStatus === 'offline' ? t('offlineHint', lang) : undefined}
        >
          {t('resultsTab', lang)}
        </button>
        <button
          className="btn btn-sm expand-toggle"
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
      <main className="workspace" data-expanded={expandedPanel ?? undefined}>
        <Library />
        <div className="center">
          <PipelineGraph />
          {outputPanel}
        </div>
        <Inspector />
      </main>
      <HelpPanel />
    </div>
  )
}
