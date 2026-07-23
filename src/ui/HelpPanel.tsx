import { usePipeline } from '../store/pipeline'
import { TEMPLATES, type PipelineTemplate, type TemplateCategory } from '../pipelines/templates'
import { RESPIRATORIO_RO } from '../tutorials/respiratorio'
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
  return (
    <div className="help-card glass">
      <div className="help-card-head">
        <strong>{tpl.title[lang]}</strong>
        <button className="btn btn-sm btn-primary" onClick={() => loadTemplate(tpl)}>
          {t('helpLoadTemplate', lang)}
        </button>
      </div>
      <p className="help-card-desc">{tpl.description[lang]}</p>
      <div className="help-chips">
        {tpl.steps.map((s, i) => (
          <span key={i} className="help-chip mono">{s.fn}</span>
        ))}
      </div>
      {tpl.vignetteUrl && (
        <a className="help-link" href={tpl.vignetteUrl} target="_blank" rel="noreferrer">
          {t('helpViewTutorial', lang)}
        </a>
      )}
    </div>
  )
}

export default function HelpPanel() {
  const { helpOpen, closeHelp, lang, startTutorial } = usePipeline()
  if (!helpOpen) return null

  return (
    <div className="help-backdrop" onClick={closeHelp}>
      <div className="help-panel glass" onClick={(e) => e.stopPropagation()}>
        <div className="help-head">
          <h2>{t('helpTitle', lang)}</h2>
          <button className="tutorial-close" title={t('close', lang)} onClick={closeHelp}>✕</button>
        </div>
        <p className="help-intro">{t('helpIntro', lang)}</p>

        <button className="btn btn-primary help-tutorial-btn" onClick={() => { closeHelp(); startTutorial(RESPIRATORIO_RO) }}>
          {t('guidedTutorial', lang)}
        </button>

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
