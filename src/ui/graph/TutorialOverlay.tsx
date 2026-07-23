import { usePipeline } from '../../store/pipeline'
import { byName } from '../../catalog'
import { TUTORIALS } from '../../tutorials/respiratorio'
import { t } from '../../i18n'

export default function TutorialOverlay() {
  const {
    tutorialStep, activeTutorialId, steps, lang,
    nextTutorialStep, prevTutorialStep, endTutorial,
  } = usePipeline()

  if (tutorialStep == null || !activeTutorialId) return null
  const tutorial = TUTORIALS.find((t) => t.id === activeTutorialId)
  const def = tutorial?.steps[tutorialStep]
  const step = steps[tutorialStep]
  const fn = step ? byName.get(step.fn) : undefined
  if (!tutorial || !def || !fn) return null

  const isLast = tutorialStep === tutorial.steps.length - 1

  return (
    <div className="tutorial-overlay glass">
      <div className="tutorial-head">
        <span className="tutorial-title">{tutorial.title[lang]}</span>
        <button className="tutorial-close" title={t('tutorialExit', lang)} onClick={endTutorial}>✕</button>
      </div>
      <div className="tutorial-progress">
        {t('tutorialStepOf', lang).replace('{n}', String(tutorialStep + 1)).replace('{total}', String(tutorial.steps.length))}
        <span className="mono tutorial-fn"> — {fn.name}()</span>
      </div>
      <p className="tutorial-explain">{def.explain[lang]}</p>
      <div className="tutorial-nav">
        <button className="btn btn-sm" disabled={tutorialStep === 0} onClick={prevTutorialStep}>
          {t('tutorialPrev', lang)}
        </button>
        {isLast ? (
          <button className="btn btn-sm btn-primary" onClick={endTutorial}>{t('tutorialFinish', lang)}</button>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={nextTutorialStep}>{t('tutorialNext', lang)}</button>
        )}
      </div>
    </div>
  )
}
