import { useState } from 'react'
import { byName, pipeArg, stageColor, friendlyName, friendlyDescription, friendlyArgDoc, type ArgSpec, type FnSpec } from '../catalog'
import { usePipeline, type Step } from '../store/pipeline'
import { t } from '../i18n'

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

function ArgField({ arg, fnName, value, onChange, lang }: {
  arg: ArgSpec
  fnName: string
  value: string
  onChange: (v: string) => void
  lang: 'pt' | 'en' | 'es'
}) {
  const hint = arg.default != null ? `${t('defaultHint', lang)}: ${arg.default}` : ''
  return (
    <div className="arg-field">
      <label className="label">
        {arg.name}
        {arg.required && <span className="req">*</span>}
        <ArgHelp doc={friendlyArgDoc(fnName, arg, lang)} />
      </label>
      {arg.type === 'enum' ? (
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
    </div>
  )
}

function AutoArgField({ name, lang }: { name: string; lang: 'pt' | 'en' | 'es' }) {
  return (
    <div className="arg-field arg-auto">
      <label className="label">{name}</label>
      <div className="auto-value mono">↳ {t('autoFromPrevious', lang)}</div>
    </div>
  )
}

function FnDoc({ fn, lang }: { fn: FnSpec; lang: 'pt' | 'en' | 'es' }) {
  return (
    <>
      <h3 className="insp-title" style={{ color: stageColor(fn.stage) }}>{friendlyName(fn, lang)}</h3>
      <p className="insp-technical mono">{fn.name}()</p>
      <p className="insp-desc">{friendlyDescription(fn, lang)}</p>
    </>
  )
}

export default function Inspector() {
  const { steps, selectedStep, inspectFn, lang, addStep, setValue } = usePipeline()
  const stepIndex = steps.findIndex((s) => s.id === selectedStep)
  const step: Step | undefined = steps[stepIndex]
  const fn = step ? byName.get(step.fn) : inspectFn ? byName.get(inspectFn) : undefined

  if (!fn) return <aside className="inspector glass"><p className="empty-hint">{t('selectFn', lang)}</p></aside>

  // first arg is auto-supplied from the previous step's result whenever this step chains
  // (same rule the pipeline builder uses — see pipeArg/buildSteps in store/pipeline.ts)
  const autoArg = step && stepIndex > 0 && pipeArg(fn) ? fn.args[0].name : null

  return (
    <aside className="inspector glass">
      <div className="insp-scroll">
        <FnDoc fn={fn} lang={lang} />
        {!step && (
          <button className="btn btn-primary insp-add" onClick={() => addStep(fn.name)}>
            {t('addToPipeline', lang)}
          </button>
        )}
        {step && (
          <>
            <div className="label insp-params">{t('params', lang)}</div>
            {fn.args.map((a) =>
              a.name === autoArg ? (
                <AutoArgField key={a.name} name={a.name} lang={lang} />
              ) : (
                <ArgField
                  key={a.name}
                  arg={a}
                  fnName={fn.name}
                  lang={lang}
                  value={step.values[a.name] ?? ''}
                  onChange={(v) => setValue(step.id, a.name, v)}
                />
              ),
            )}
          </>
        )}
      </div>
    </aside>
  )
}
