import { usePipeline } from '../store/pipeline'
import { TEMPLATES, type PipelineTemplate, type TemplateCategory } from '../pipelines/templates'
import { t } from '../i18n'

// section order + label key per category
const SECTIONS: { cat: TemplateCategory; labelKey: 'helpPipeline' | 'helpClima' | 'helpThematic' | 'helpCaseStudies' | 'helpModeling' | 'helpRap' }[] = [
  { cat: 'pipeline', labelKey: 'helpPipeline' },
  { cat: 'clima', labelKey: 'helpClima' },
  { cat: 'tematico', labelKey: 'helpThematic' },
  { cat: 'caso', labelKey: 'helpCaseStudies' },
  { cat: 'modelagem', labelKey: 'helpModeling' },
  { cat: 'rap', labelKey: 'helpRap' },
]

function TemplateCard({ tpl }: { tpl: PipelineTemplate }) {
  const { lang, loadTemplate } = usePipeline()
  const requiresDataFile = tpl.steps.some((s) => s.fn === 'sus_data_read')
  return (
    <div className="help-card glass">
      <div className="help-card-head">
        <div className="help-card-title">
          <strong>{tpl.title[lang]}</strong>
          {requiresDataFile && <span className="help-card-badge">{t('requiresPreparedData', lang)}</span>}
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => loadTemplate(tpl)}>
          {t('helpLoadTemplate', lang)}
        </button>
      </div>
      <p className="help-card-desc">{tpl.description[lang]}</p>
      {requiresDataFile && <p className="help-card-note">{t('requiresPreparedDataHint', lang)}</p>}
      <div className="help-chips">
        {tpl.steps.map((s, i) => (
          <span key={i} className="help-chip mono">{s.fn}</span>
        ))}
      </div>
    </div>
  )
}

export default function HelpPanel() {
  const { helpOpen, closeHelp, lang } = usePipeline()
  if (!helpOpen) return null

  return (
    <div className="help-backdrop" onClick={closeHelp}>
      <div className="help-panel glass" onClick={(e) => e.stopPropagation()}>
        <div className="help-head">
          <h2>{t('helpTitle', lang)}</h2>
          <button className="tutorial-close" title={t('close', lang)} onClick={closeHelp}>✕</button>
        </div>
        <p className="help-intro">{t('helpIntro', lang)}</p>

        {SECTIONS.map(({ cat, labelKey }) => {
          const list = TEMPLATES.filter((tpl) => tpl.category === cat)
          if (!list.length) return null
          return (
            <div key={cat}>
              <h3 className="help-section">{t(labelKey, lang)}</h3>
              <div className="help-cards">{list.map((tpl) => <TemplateCard key={tpl.id} tpl={tpl} />)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
