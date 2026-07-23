import { useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow, ReactFlowProvider, Background, Controls,
  useReactFlow, useUpdateNodeInternals, type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { usePipeline } from '../../store/pipeline'
import { t } from '../../i18n'
import { layoutSteps } from './layout'
import StepNode from './nodes/StepNode'
import TutorialOverlay from './TutorialOverlay'

const nodeTypes: NodeTypes = { step: StepNode }

function GraphInner() {
  const { steps, lang, stepResults, tutorialFocusId } = usePipeline()
  const { nodes, edges } = useMemo(() => layoutSteps(steps), [steps])
  const { fitView, setCenter, getNode } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const prevResults = useRef<typeof stepResults>({})

  // refit when steps are added/removed (deliberate edits) — but not on every result arriving
  // mid-run, which would distractingly rezoom while the user is watching a run complete
  useEffect(() => {
    const id = requestAnimationFrame(() => fitView({ padding: 0.25, duration: 200 }))
    return () => cancelAnimationFrame(id)
  }, [steps.length, fitView])

  // tutorial mode: pan the focused step into view as the user advances
  useEffect(() => {
    if (!tutorialFocusId) return
    const id = requestAnimationFrame(() => {
      const node = getNode(tutorialFocusId)
      if (node) setCenter(node.position.x + 130, node.position.y + 80, { zoom: 0.85, duration: 400 })
    })
    return () => cancelAnimationFrame(id)
  }, [tutorialFocusId, getNode, setCenter])

  // a node's body grows once its result arrives (compact table/plot) — tell RF to
  // re-measure just that node so its edge handles stay correctly anchored
  useEffect(() => {
    for (const id of Object.keys(stepResults)) {
      if (stepResults[id] !== prevResults.current[id]) updateNodeInternals(id)
    }
    prevResults.current = stepResults
  }, [stepResults, updateNodeInternals])

  if (!steps.length) return <p className="empty-hint">{t('emptyPipeline', lang)}</p>

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      panOnScroll
      zoomOnScroll={false}
      minZoom={0.3}
      maxZoom={1.2}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={22} size={1} color="var(--border)" />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  )
}

export default function PipelineGraph() {
  const { lang, steps, expandedPanel, toggleExpand } = usePipeline()
  return (
    <section className="canvas glass">
      <div className="canvas-head">
        <div className="canvas-head-title">
          <h2>{t('pipeline', lang)}</h2>
          <span className="canvas-count">{steps.length} {t('steps', lang)}</span>
        </div>
        <button
          className="btn btn-sm expand-toggle"
          onClick={() => toggleExpand('graph')}
          title={expandedPanel === 'graph' ? t('collapsePanel', lang) : t('expandPanel', lang)}
        >
          {expandedPanel === 'graph' ? '⤡' : '⤢'}
        </button>
      </div>
      <div className="graph-canvas">
        <ReactFlowProvider>
          <GraphInner />
        </ReactFlowProvider>
      </div>
      <TutorialOverlay />
    </section>
  )
}
