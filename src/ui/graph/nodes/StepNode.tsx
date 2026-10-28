import { memo, useState } from 'react'
import { Handle, NodeToolbar, Position, type NodeProps } from '@xyflow/react'
import { byName, stageColor, friendlyName, type ArgSpec } from '../../../catalog'
import { enumOptionLabel } from '../../../catalog/enum-options'
import { usePipeline } from '../../../store/pipeline'
import { t, tp } from '../../../i18n'
import ResultBody from '../../result/ResultBody'
import ResultActions from '../../result/ResultActions'
import MethodWarningBanner from '../../result/MethodWarningBanner'
import { FN_DRAG_TYPE, type StepNodeData } from '../layout'

function StatusDot({ state }: { state: 'idle' | 'running' | 'ok' | 'error' | 'stale' | undefined }) {
  if (!state || state === 'idle') return null
  const glyph = state === 'running' ? '⟳' : state === 'ok' ? '✓' : state === 'error' ? '✕' : '•'
  return <span className={`step-status step-status-${state}`}>{glyph}</span>
}

// required params editable right on the card; everything else stays in the Inspector.
// Reads the value from the store, not node data (which lags one effect → dropped keystrokes).
function InlineArg({ stepId, fnName, arg }: { stepId: string; fnName: string; arg: ArgSpec }) {
  const value = usePipeline((s) => s.steps.find((x) => x.id === stepId)?.values[arg.name] ?? '')
  const setValue = usePipeline((s) => s.setValue)
  const empty = !value.trim()
  const common = {
    className: `input node-arg-input ${empty ? 'missing' : ''} nodrag`,
    value,
  }
  return (
    <label className="node-arg">
      <span className="node-arg-name mono">{arg.name}<span className="req">*</span></span>
      {arg.type === 'enum' ? (
        <select {...common} onChange={(e) => setValue(stepId, arg.name, e.target.value)}>
          <option value="">—</option>
          {arg.options.map((o) => <option key={o} value={o}>{enumOptionLabel(fnName, arg.name, arg.doc, o)}</option>)}
        </select>
      ) : (
        <input {...common} spellCheck={false} onChange={(e) => setValue(stepId, arg.name, e.target.value)} />
      )}
    </label>
  )
}

function StepNodeInner({ data }: NodeProps & { data: StepNodeData }) {
  const { step, piped } = data
  const fn = byName.get(step.fn)
  const run = usePipeline((s) => s.stepRun[step.id])
  const result = usePipeline((s) => s.stepResults[step.id])
  const selected = usePipeline((s) => s.selectedStep === step.id)
  // don't dim a step that has actually run (or is running) just because tutorial narration
  // hasn't reached it yet — otherwise "Executar" on a ready-made template fades every node
  // except whichever one the (unrelated) walkthrough happens to be spotlighting
  const dimmed = usePipeline((s) => s.tutorialStep != null && s.tutorialFocusId !== step.id && (s.stepRun[step.id] ?? 'idle') === 'idle')
  const focused = usePipeline((s) => s.tutorialStep != null && s.tutorialFocusId === step.id)
  const engineStatus = usePipeline((s) => s.engineStatus)
  const lang = usePipeline((s) => s.lang)
  const mode = usePipeline((s) => s.mode)
  const select = usePipeline((s) => s.select)
  const removeStep = usePipeline((s) => s.removeStep)
  const insertStep = usePipeline((s) => s.insertStep)
  const duplicateStep = usePipeline((s) => s.duplicateStep)
  const setNote = usePipeline((s) => s.setNote)
  const moveStep = usePipeline((s) => s.moveStep)
  const reorderStep = usePipeline((s) => s.reorderStep)
  const runPipeline = usePipeline((s) => s.runPipeline)
  const [showConsole, setShowConsole] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  // read straight from the store, not `data.step`: node data reaches us one effect later, which
  // makes a controlled textarea drop keystrokes when typing fast
  const note = usePipeline((s) => s.steps.find((x) => x.id === step.id)?.note)

  if (!fn) return null
  const setArgs = fn.args.filter((a) => (step.values[a.name] ?? '').trim())
  const required = fn.args.filter((a, i) => a.required && !(i === 0 && piped))
  // data-type args need the Inspector's step picker, so they only get the badge
  const inline = required.filter((a) => a.type !== 'data')
  const missing = required.filter((a) => a.type === 'data' && !(step.values[a.name] ?? '').trim())

  return (
    <div
      className={`step-card graph-node ${selected ? 'active' : ''} ${run === 'error' ? 'has-error' : ''} ${dimmed ? 'graph-node-dimmed' : ''} ${focused ? 'tutorial-focus' : ''} ${dragOver ? 'drag-over' : ''}`}
      style={{ ['--stage' as string]: stageColor(fn.stage) }}
      onClick={() => select(step.id)}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation() // the canvas behind would otherwise also append a dropped library fn
        setDragOver(false)
        const fnName = e.dataTransfer.getData(FN_DRAG_TYPE)
        const draggedId = e.dataTransfer.getData('text/plain')
        if (fnName) insertStep(fnName, step.id)
        else if (draggedId) reorderStep(draggedId, step.id)
      }}
      data-fn={fn.name}
      data-run={run ?? 'idle'}
    >
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="target" id="top" position={Position.Top} style={{ visibility: 'hidden' }} />
      <NodeToolbar isVisible={selected} position={Position.Top} align="start" className="node-toolbar">
        {engineStatus === 'ready' && (
          <button title={t('runUpToHereHint', lang)} onClick={() => runPipeline(step.id)}>▶ {t('runUpToHere', lang)}</button>
        )}
        <button onClick={() => { select(step.id); setEditingNote(true) }}>✎ {t('addNote', lang)}</button>
        <button onClick={() => duplicateStep(step.id)}>⧉ {t('duplicateStep', lang)}</button>
        <button className="danger" onClick={() => removeStep(step.id)}>✕ {t('removeStep', lang)}</button>
      </NodeToolbar>
      <div className="node-header">
        <span
          className="step-drag-handle"
          title={t('dragToReorder', lang)}
          draggable
          onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', step.id); e.dataTransfer.effectAllowed = 'move' }}
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </span>
        <StatusDot state={run} />
        <div className="step-body">
          <span className="fn-name-friendly">
            <span className="fn-name-text">{friendlyName(fn, lang, mode)}</span>
            {run === 'running' && <span className="step-running-label">{t('running', lang)}</span>}
          </span>
          <span className="step-args mono">
            {setArgs.length ? setArgs.map((a) => `${a.name}=${step.values[a.name]}`).join(', ') : `${fn.name}()`}
          </span>
        </div>
        <div className="step-actions">
          <button title={t('moveStepUp', lang)} onClick={(e) => { e.stopPropagation(); moveStep(step.id, -1) }}>←</button>
          <button title={t('moveStepDown', lang)} onClick={(e) => { e.stopPropagation(); moveStep(step.id, 1) }}>→</button>
        </div>
      </div>
      {inline.length > 0 && (
        <div className="node-args">
          {inline.map((a) => <InlineArg key={a.name} stepId={step.id} fnName={fn.name} arg={a} />)}
        </div>
      )}
      {missing.length > 0 && run !== 'running' && (
        <span className="node-missing" title={missing.map((a) => a.name).join(', ')}>
          ⚠ {tp('requiredMissing', lang, { n: String(missing.length) })}
        </span>
      )}
      {editingNote ? (
        <textarea
          className="node-note node-note-edit nodrag nowheel"
          autoFocus
          rows={3}
          value={note ?? ''}
          placeholder={t('notePlaceholder', lang)}
          onChange={(e) => setNote(step.id, e.target.value)}
          onBlur={() => setEditingNote(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur() }}
        />
      ) : note ? (
        <p className="node-note" onDoubleClick={() => setEditingNote(true)}>{note}</p>
      ) : null}
      {result && (
        <div className="node-result">
          <MethodWarningBanner consoleText={result.console} />
          <ResultActions result={result} lang={lang} showConsole={showConsole} onToggleConsole={() => setShowConsole(!showConsole)} />
          <ResultBody result={result} fn={fn} lang={lang} compact />
          {showConsole && result.console && <pre className="console-out mono compact nowheel">{result.console}</pre>}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" id="bottom" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  )
}

export default memo(StepNodeInner)
