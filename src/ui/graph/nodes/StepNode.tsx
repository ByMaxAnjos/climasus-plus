import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { byName, stageColor, friendlyName } from '../../../catalog'
import { usePipeline } from '../../../store/pipeline'
import { t } from '../../../i18n'
import ResultBody from '../../result/ResultBody'
import ResultActions from '../../result/ResultActions'
import type { StepNodeData } from '../layout'

function StatusDot({ state }: { state: 'idle' | 'running' | 'ok' | 'error' | 'stale' | undefined }) {
  if (!state || state === 'idle') return null
  const glyph = state === 'running' ? '⟳' : state === 'ok' ? '✓' : state === 'error' ? '✕' : '•'
  return <span className={`step-status step-status-${state}`}>{glyph}</span>
}

function StepNodeInner({ data }: NodeProps & { data: StepNodeData }) {
  const { step } = data
  const fn = byName.get(step.fn)
  const run = usePipeline((s) => s.stepRun[step.id])
  const result = usePipeline((s) => s.stepResults[step.id])
  const selected = usePipeline((s) => s.selectedStep === step.id)
  const dimmed = usePipeline((s) => s.tutorialStep != null && s.tutorialFocusId !== step.id)
  const focused = usePipeline((s) => s.tutorialStep != null && s.tutorialFocusId === step.id)
  const engineStatus = usePipeline((s) => s.engineStatus)
  const lang = usePipeline((s) => s.lang)
  const select = usePipeline((s) => s.select)
  const removeStep = usePipeline((s) => s.removeStep)
  const moveStep = usePipeline((s) => s.moveStep)
  const runPipeline = usePipeline((s) => s.runPipeline)
  const [showConsole, setShowConsole] = useState(false)

  if (!fn) return null
  const setArgs = fn.args.filter((a) => (step.values[a.name] ?? '').trim())

  return (
    <div
      className={`step-card graph-node ${selected ? 'active' : ''} ${run === 'error' ? 'has-error' : ''} ${dimmed ? 'graph-node-dimmed' : ''} ${focused ? 'tutorial-focus' : ''}`}
      style={{ ['--stage' as string]: stageColor(fn.stage) }}
      onClick={() => select(step.id)}
      data-fn={fn.name}
      data-run={run ?? 'idle'}
    >
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <div className="node-header">
        <StatusDot state={run} />
        <div className="step-body">
          <span className="fn-name-friendly">{friendlyName(fn, lang)}</span>
          <span className="step-args mono">
            {setArgs.length ? setArgs.map((a) => `${a.name}=${step.values[a.name]}`).join(', ') : `${fn.name}()`}
          </span>
        </div>
        <div className="step-actions">
          {engineStatus === 'ready' && (
            <button title={t('runUpToHere', lang)} onClick={(e) => { e.stopPropagation(); runPipeline(step.id) }}>▶</button>
          )}
          <button title="↑" onClick={(e) => { e.stopPropagation(); moveStep(step.id, -1) }}>↑</button>
          <button title="↓" onClick={(e) => { e.stopPropagation(); moveStep(step.id, 1) }}>↓</button>
          <button title="✕" onClick={(e) => { e.stopPropagation(); removeStep(step.id) }}>✕</button>
        </div>
      </div>
      {result && (
        <div className="node-result">
          <ResultActions result={result} lang={lang} showConsole={showConsole} onToggleConsole={() => setShowConsole(!showConsole)} />
          <ResultBody result={result} fn={fn} lang={lang} compact />
          {showConsole && result.console && <pre className="console-out mono compact nowheel">{result.console}</pre>}
        </div>
      )}
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
    </div>
  )
}

export default memo(StepNodeInner)
