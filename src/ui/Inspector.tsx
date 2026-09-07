import { useState } from 'react'
import { byName, pipeArg, stageColor, friendlyName, friendlyDescription, friendlyArgDoc, type ArgSpec, type FnSpec } from '../catalog'
import { usePipeline, stepRef, isStepRef, stepRefId, type Step, type UsageMode } from '../store/pipeline'
import { t, tp } from '../i18n'

export interface PriorStepOption {
  id: string
  label: string
}

function ArgHelp({ doc }: { doc: string }) {
  const [open, setOpen] = useState(false)
  if (!doc) return null
  return (
    <span className="arg-help">
      <button
        type="button"
        className="arg-help-icon"
        aria-label="help"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && <div className="arg-help-pop">{doc}</div>}
    </span>
  )
}

function ArgField({ arg, fnName, value, onChange, lang, issue, priorSteps, autoDefault }: {
  arg: ArgSpec
  fnName: string
  value: string
  onChange: (v: string) => void
  lang: 'pt' | 'en' | 'es'
  issue?: string
  priorSteps: PriorStepOption[]
  autoDefault?: boolean
}) {
  const hint = arg.default != null ? `${t('defaultHint', lang)}: ${arg.default}` : ''
  const missingRequired = arg.required && !value.trim()
  const defaultActive = !value.trim() && arg.default != null
  const refId = isStepRef(value) ? stepRefId(value) : ''
  const canReference = (arg.type === 'data' || autoDefault) && priorSteps.length > 0
  return (
    <div className={`arg-field ${missingRequired ? 'arg-field-missing' : ''} ${issue ? 'arg-field-issue' : ''}`}>
      <label className="label">
        {arg.name}
        {arg.required && <span className="req">*</span>}
        <ArgHelp doc={friendlyArgDoc(fnName, arg, lang)} />
      </label>
      {canReference && (
        <select
          className="input step-ref-select"
          value={refId}
          onChange={(e) => onChange(e.target.value ? stepRef(e.target.value) : '')}
        >
          <option value="">{t('freeTextOption', lang)}</option>
          {priorSteps.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      )}
      {refId ? (
        <div className="auto-value mono">↳ {t('stepRefValue', lang)}: {priorSteps.find((p) => p.id === refId)?.label ?? refId}</div>
      ) : arg.type === 'enum' ? (
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{hint || '—'}</option>
          {arg.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : arg.type === 'boolean' ? (
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{hint}</option>
          <option value="TRUE">TRUE</option>
          <option value="FALSE">FALSE</option>
        </select>
      ) : (
        <input
          className="input mono"
          value={value}
          placeholder={arg.default ?? (arg.required ? 'obrigatório' : '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {/* typed literal text in an auto-piped first arg is dropped by stepArgs' skipFirst — warn
          instead of silently ignoring it. Must come before the autoDefault branch below, which
          would otherwise swallow this case. */}
      {autoDefault && !refId && value.trim() ? (
        <p className="arg-note arg-note-required">{t('autoArgIgnoredWarning', lang)}</p>
      ) : missingRequired ? (
        <p className="arg-note arg-note-required">{issue || t('requiredMissingHint', lang)}</p>
      ) : autoDefault && !refId ? (
        <p className="arg-note">↳ {t('autoFromPrevious', lang)}</p>
      ) : defaultActive ? (
        <p className="arg-note">{tp('usingDefault', lang, { value: String(arg.default) })}</p>
      ) : issue ? (
        <p className="arg-note arg-note-required">{issue}</p>
      ) : null}
    </div>
  )
}

function FnDoc({ fn, lang, mode }: { fn: FnSpec; lang: 'pt' | 'en' | 'es'; mode?: UsageMode | null }) {
  return (
    <section className="insp-doc-block">
      <div className="label insp-doc-label">{t('aboutFunction', lang)}</div>
      <h3 className="insp-title" style={{ color: stageColor(fn.stage) }}>{friendlyName(fn, lang, mode)}</h3>
      <p className="insp-technical mono">{fn.name}()</p>
      <p className="insp-desc">{friendlyDescription(fn, lang, mode)}</p>
    </section>
  )
}

export default function Inspector() {
  const { steps, selectedStep, inspectFn, lang, mode, addStep, setValue, validationIssues } = usePipeline()
  const stepIndex = steps.findIndex((s) => s.id === selectedStep)
  const step: Step | undefined = steps[stepIndex]
  const fn = step ? byName.get(step.fn) : inspectFn ? byName.get(inspectFn) : undefined

  if (!fn) return <aside className="inspector glass"><p className="empty-hint">{t('selectFn', lang)}</p></aside>

  // first arg is auto-supplied from the previous step's result whenever this step chains
  // (same rule the pipeline builder uses — see pipeArg/buildSteps in store/pipeline.ts)
  const autoArg = step && stepIndex > 0 && pipeArg(fn) ? fn.args[0].name : null
  const visibleArgs = fn.args.filter((a, index) => a.name === autoArg || a.required || fn.args.length <= 5 || index < 4)
  const advancedArgs = fn.args.filter((a) => !visibleArgs.includes(a))
  const issueByArg = new Map(validationIssues.filter((issue) => issue.stepId === step?.id && issue.arg).map((issue) => [issue.arg!, issue.message]))
  // any earlier step can be wired into another arg (e.g. a second data/weights/covariates
  // input a function needs beyond its piped first arg) — see stepRef in store/pipeline.ts
  const priorSteps: PriorStepOption[] = step
    ? steps.slice(0, stepIndex).flatMap((s, i) => {
        const sFn = byName.get(s.fn)
        return sFn ? [{ id: s.id, label: `${i + 1}. ${friendlyName(sFn, lang, mode)}` }] : []
      })
    : []
  const renderArg = (a: ArgSpec) => (
    <ArgField
      key={a.name}
      arg={a}
      fnName={fn.name}
      lang={lang}
      value={step?.values[a.name] ?? ''}
      issue={issueByArg.get(a.name)}
      priorSteps={priorSteps}
      autoDefault={a.name === autoArg}
      onChange={(v) => step && setValue(step.id, a.name, v)}
    />
  )

  return (
    <aside className="inspector glass">
      <div className="insp-scroll">
        <FnDoc fn={fn} lang={lang} mode={mode} />
        {step && (
          <p className="insp-step-position">
            {tp('stepPosition', lang, { n: String(stepIndex + 1), total: String(steps.length) })}
          </p>
        )}
        {!step && (
          <button className="btn btn-primary insp-add" onClick={() => addStep(fn.name)}>
            {t('addToPipeline', lang)}
          </button>
        )}
        {step && (
          <section className="insp-param-block">
            <div className="insp-param-head">
              <div className="label insp-params">{t('params', lang)}</div>
              <span className="required-legend"><span className="req">*</span> {t('requiredLegend', lang)}</span>
            </div>
            {visibleArgs.map(renderArg)}
            {advancedArgs.length > 0 && (
              <details className="advanced-params" open={mode === 'pesquisa'}>
                <summary>
                  <span>{t('advancedParams', lang)}</span>
                  <span className="advanced-count">{advancedArgs.length}</span>
                </summary>
                <p className="advanced-summary">{t('advancedSummary', lang)}</p>
                {advancedArgs.map(renderArg)}
              </details>
            )}
          </section>
        )}
      </div>
    </aside>
  )
}
