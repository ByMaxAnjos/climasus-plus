import { useEffect } from 'react'
import { usePipeline, type UsageMode } from '../store/pipeline'
import { t } from '../i18n'

type MessageKey = Parameters<typeof t>[0]

// Foundation for the two usage modes (vigilância/gestão vs. pesquisa avançada): a persisted
// per-project choice with no behavioral differences yet — it doesn't hide, gate or validate
// anything. Future work (guided scenario templates, decision pages, reproducibility sheet,
// quality traffic-light) builds on top of this choice; see project notes.
const CARDS: { mode: UsageMode; goalKey: MessageKey; userKey: MessageKey; languageKey: MessageKey; decisionKey: MessageKey }[] = [
  { mode: 'vigilancia', goalKey: 'modeVigilanciaGoal', userKey: 'modeVigilanciaUser', languageKey: 'modeVigilanciaLanguage', decisionKey: 'modeVigilanciaDecision' },
  { mode: 'pesquisa', goalKey: 'modePesquisaGoal', userKey: 'modePesquisaUser', languageKey: 'modePesquisaLanguage', decisionKey: 'modePesquisaDecision' },
]

export default function ModeSelector() {
  const { modeOpen, closeModeSelector, setMode, mode, lang } = usePipeline()

  useEffect(() => {
    if (!modeOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModeSelector()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modeOpen, closeModeSelector])

  if (!modeOpen) return null

  return (
    <div className="about-backdrop" onClick={closeModeSelector}>
      <div className="about-panel glass mode-panel" role="dialog" aria-modal="true" aria-labelledby="mode-title" onClick={(e) => e.stopPropagation()}>
        <div className="about-head">
          <div>
            <h2 id="mode-title">{t('modeSelectorTitle', lang)}</h2>
            <p className="about-lede">{t('modeSelectorLede', lang)}</p>
          </div>
          <button className="tutorial-close" title={t('close', lang)} onClick={closeModeSelector}>✕</button>
        </div>
        <div className="mode-card-grid">
          {CARDS.map((card) => (
            <button
              key={card.mode}
              className={`mode-card ${mode === card.mode ? 'active' : ''}`}
              onClick={() => setMode(card.mode)}
            >
              <h3>{t(card.mode === 'vigilancia' ? 'modeVigilancia' : 'modePesquisa', lang)}</h3>
              <dl>
                <dt>{t('modeGoalLabel', lang)}</dt>
                <dd>{t(card.goalKey, lang)}</dd>
                <dt>{t('modeUserLabel', lang)}</dt>
                <dd>{t(card.userKey, lang)}</dd>
                <dt>{t('modeLanguageLabel', lang)}</dt>
                <dd className="mode-card-quote">{t(card.languageKey, lang)}</dd>
                <dt>{t('modeDecisionLabel', lang)}</dt>
                <dd>{t(card.decisionKey, lang)}</dd>
              </dl>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
