import { useMemo, useState } from 'react'
import { usePipeline } from '../store/pipeline'
import { TEMPLATES, type PipelineTemplate, type TemplateCategory } from '../pipelines/templates'
import { t } from '../i18n'

// section order + label key per category
const SECTIONS: { cat: TemplateCategory; labelKey: 'helpPipeline' | 'helpClima' | 'helpThematic' | 'helpCaseStudies' | 'helpModeling' }[] = [
  { cat: 'pipeline', labelKey: 'helpPipeline' },
  { cat: 'clima', labelKey: 'helpClima' },
  { cat: 'tematico', labelKey: 'helpThematic' },
  { cat: 'caso', labelKey: 'helpCaseStudies' },
  { cat: 'modelagem', labelKey: 'helpModeling' },
]

const RECOMMENDED_IDS = new Set([
  'pipeline-importacao-saude',
  'pipeline-preparacao-basica',
  'ec-01-respiratorio-pediatrico',
])

type TemplateView = 'recommended' | TemplateCategory

const VIEW_LABELS: { id: TemplateView; labelKey: 'helpRecommended' | 'helpPipeline' | 'helpClima' | 'helpThematic' | 'helpCaseStudies' | 'helpModeling' }[] = [
  { id: 'recommended', labelKey: 'helpRecommended' },
  ...SECTIONS.map(({ cat, labelKey }) => ({ id: cat, labelKey })),
]

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function stepCountLabel(count: number, lang: 'pt' | 'en' | 'es'): string {
  if (lang === 'en') return `${count} ${count === 1 ? 'step' : 'steps'}`
  if (lang === 'es') return `${count} ${count === 1 ? 'paso' : 'pasos'}`
  return `${count} ${count === 1 ? 'passo' : 'passos'}`
}

function templateCountLabel(count: number, lang: 'pt' | 'en' | 'es'): string {
  if (lang === 'en') return `${count} ${count === 1 ? 'template' : 'templates'}`
  if (lang === 'es') return `${count} ${count === 1 ? 'pipeline' : 'pipelines'}`
  return `${count} ${count === 1 ? 'pipeline' : 'pipelines'}`
}

function TemplateCard({ tpl }: { tpl: PipelineTemplate }) {
  const { lang, loadTemplate } = usePipeline()
  const requiresDataFile = tpl.steps.some((s) => s.fn === 'sus_data_read')
  const downloadsData = tpl.steps.some((s) => s.fn.includes('_import') || s.fn.includes('_inmet') || s.fn.includes('_grid_') || s.fn.includes('_climate_'))
  return (
    <article className="help-card">
      <div className="help-card-head">
        <div className="help-card-title">
          <strong>{tpl.title[lang]}</strong>
          <div className="help-card-meta">
            <span className="help-card-badge">{stepCountLabel(tpl.steps.length, lang)}</span>
            {requiresDataFile && <span className="help-card-badge help-card-badge-warn">{t('requiresPreparedData', lang)}</span>}
            {downloadsData && <span className="help-card-badge">{t('downloadsData', lang)}</span>}
          </div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => loadTemplate(tpl)}>
          {t('helpLoadTemplate', lang)}
        </button>
      </div>
      <p className="help-card-desc">{tpl.description[lang]}</p>
      {requiresDataFile && <p className="help-card-note">{t('requiresPreparedDataHint', lang)}</p>}
      <details className="help-card-details">
        <summary>{t('helpShowFunctions', lang)}</summary>
        <div className="help-chips">
          {tpl.steps.map((s, i) => (
            <span key={i} className="help-chip mono">{s.fn}</span>
          ))}
        </div>
      </details>
    </article>
  )
}

export default function HelpPanel() {
  const { helpOpen, closeHelp, lang } = usePipeline()
  const [activeView, setActiveView] = useState<TemplateView>('recommended')
  const [query, setQuery] = useState('')
  const normalizedQuery = normalizeText(query.trim())

  const visibleTemplates = useMemo(() => {
    const base = normalizedQuery
      ? TEMPLATES
      : activeView === 'recommended'
        ? TEMPLATES.filter((tpl) => RECOMMENDED_IDS.has(tpl.id))
        : TEMPLATES.filter((tpl) => tpl.category === activeView)

    if (!normalizedQuery) return base

    return base.filter((tpl) => {
      const haystack = [
        tpl.title[lang],
        tpl.description[lang],
        tpl.category,
        ...tpl.steps.map((s) => s.fn),
      ].join(' ')
      return normalizeText(haystack).includes(normalizedQuery)
    })
  }, [activeView, lang, normalizedQuery])

  if (!helpOpen) return null

  return (
    <div className="help-backdrop" onClick={closeHelp}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()}>
        <div className="help-head">
          <div>
            <h2>{t('helpTitle', lang)}</h2>
            <p className="help-intro">{t('helpIntro', lang)}</p>
          </div>
          <button className="tutorial-close" title={t('close', lang)} onClick={closeHelp}>✕</button>
        </div>

        <div className="help-tools">
          <input
            className="help-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('helpSearchPlaceholder', lang)}
            aria-label={t('helpSearchPlaceholder', lang)}
          />
          <div className="help-tabs" role="tablist" aria-label={t('helpTitle', lang)}>
            {VIEW_LABELS.map(({ id, labelKey }) => (
              <button
                key={id}
                className={activeView === id ? 'help-tab active' : 'help-tab'}
                role="tab"
                aria-selected={activeView === id}
                onClick={() => setActiveView(id)}
              >
                {t(labelKey, lang)}
              </button>
            ))}
          </div>
        </div>

        <div className="help-results-head">
          <h3 className="help-section">
            {normalizedQuery ? t('helpSearchResults', lang) : t(VIEW_LABELS.find((view) => view.id === activeView)!.labelKey, lang)}
          </h3>
          <span>{templateCountLabel(visibleTemplates.length, lang)}</span>
        </div>

        {visibleTemplates.length ? (
          <div className="help-cards">{visibleTemplates.map((tpl) => <TemplateCard key={tpl.id} tpl={tpl} />)}</div>
        ) : (
          <p className="help-empty">{t('helpNoResults', lang)}</p>
        )}
      </div>
    </div>
  )
}
