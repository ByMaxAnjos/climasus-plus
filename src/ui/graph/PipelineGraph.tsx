import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  useReactFlow, useUpdateNodeInternals, applyNodeChanges, getNodesBounds,
  type Node, type NodeChange, type NodeTypes, type EdgeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { usePipeline } from '../../store/pipeline'
import { byName, friendlyName, stageColor } from '../../catalog'
import { PREP_SEQUENCE, PREP_SEQUENCE_CID_ONLY, PREP_SEQUENCE_SINAN } from '../../pipelines/templates'
import { t } from '../../i18n'
import { layoutSteps, FN_DRAG_TYPE, COL_W } from './layout'
import StepNode from './nodes/StepNode'
import LaneNode from './nodes/LaneNode'
import TutorialOverlay from './TutorialOverlay'
import InsertEdge from './InsertEdge'

const nodeTypes: NodeTypes = { step: StepNode, lane: LaneNode }
const edgeTypes: EdgeTypes = { insert: InsertEdge }
const READABLE_ZOOM = 0.8 // auto-fit never shrinks cards below this; pan/zoom/minimap for the rest
const FIT_PAD = 28

function GraphInner() {
  const { steps, lang, stepResults, stepRun, tutorialFocusId, mode, openModeSelector, addSteps, select, engineStatus } = usePipeline()
  const { setCenter, getNode, setViewport } = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const prevResults = useRef<typeof stepResults>({})
  const wrapRef = useRef<HTMLDivElement | null>(null)
  // cards per row: as many as fit the canvas width at READABLE_ZOOM, so collapsing the side
  // panels (or a wider window) reflows the pipeline instead of leaving it tiny or cut off
  const [maxCols, setMaxCols] = useState(4)
  const [wrapEl, setWrapEl] = useState<HTMLDivElement | null>(null)
  wrapRef.current = wrapEl
  useEffect(() => {
    if (!wrapEl) return
    const ro = new ResizeObserver(([entry]) => {
      const fit = Math.floor((entry.contentRect.width / READABLE_ZOOM - 2 * FIT_PAD) / COL_W)
      setMaxCols(Math.max(2, Math.min(8, fit)))
    })
    ro.observe(wrapEl)
    return () => ro.disconnect()
  }, [wrapEl])

  // nodes live in state so React Flow's measured sizes survive re-layouts (controlled mode drops
  // `measured` on fresh node objects → remeasure → relayout loop); layout reads those heights
  const [rfNodes, setRfNodes] = useState<Node[]>([])
  const rfNodesRef = useRef<Node[]>([])
  rfNodesRef.current = rfNodes
  const onNodesChange = useCallback((ch: NodeChange[]) => setRfNodes((ns) => applyNodeChanges(ch, ns)), [])
  const heightKey = rfNodes.filter((n) => n.type === 'step').map((n) => `${n.id}:${Math.round(n.measured?.height ?? 0)}`).join(',')
  const { nodes, edges } = useMemo(() => {
    const heights = Object.fromEntries(heightKey.split(',').filter(Boolean).map((p) => { const [id, v] = p.split(':'); return [id, Number(v)] }))
    return layoutSteps(steps, heights, maxCols)
  }, [steps, heightKey, maxCols])
  useEffect(() => {
    setRfNodes((prev) => {
      const old = new Map(prev.map((n) => [n.id, n]))
      return nodes.map((n) => ({ ...n, measured: old.get(n.id)?.measured, selected: old.get(n.id)?.selected }))
    })
  }, [nodes])

  // edge decoration from run state: animate while the target runs, label with the rows flowing in
  const liveEdges = useMemo(() => edges.map((e) => {
    const nrow = stepResults[e.source]?.dims?.nrow ?? stepResults[e.source]?.preview?.nrow
    return {
      ...e,
      animated: stepRun[e.target] === 'running',
      label: nrow != null ? `≡ ${nrow.toLocaleString(lang)}` : undefined,
    }
  }), [edges, stepResults, stepRun, lang])

  // fit the whole pipeline, but never below READABLE_ZOOM — if it doesn't fit, start at its
  // top-left instead of shrinking every card into an unreadable strip
  const fitReadable = useCallback(() => {
    const el = wrapRef.current
    if (!el || !rfNodesRef.current.length) return
    const b = getNodesBounds(rfNodesRef.current)
    const w = el.clientWidth, h = el.clientHeight
    const zoom = Math.max(READABLE_ZOOM, Math.min(1, (w - 2 * FIT_PAD) / b.width, (h - 2 * FIT_PAD) / b.height))
    const x = b.width * zoom <= w - 2 * FIT_PAD ? (w - b.width * zoom) / 2 - b.x * zoom : FIT_PAD - b.x * zoom
    const y = b.height * zoom <= h - 2 * FIT_PAD ? (h - b.height * zoom) / 2 - b.y * zoom : FIT_PAD - b.y * zoom
    setViewport({ x, y, zoom }, { duration: 180 })
  }, [setViewport])
  // refit when steps are added/removed (deliberate edits) — not on param typing or results
  // arriving mid-run, which would distractingly rezoom while the user is watching
  const structureKey = steps.map((s) => s.id).join(',')
  useEffect(() => {
    const timeout = window.setTimeout(fitReadable, 120)
    return () => window.clearTimeout(timeout)
  }, [structureKey, maxCols, fitReadable])

  // ...and once more when a run finishes, since cards grow to show their results
  const busy = engineStatus === 'busy'
  useEffect(() => {
    if (busy || tutorialFocusId) return
    const timeout = window.setTimeout(fitReadable, 400)
    return () => window.clearTimeout(timeout)
  }, [busy, fitReadable, tutorialFocusId])

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

  if (!steps.length) {
    return (
      <div className="pipeline-empty">
        <p className="empty-hint">{t('emptyPipeline', lang)}</p>
        <ol className="pipeline-empty-steps">
          <li>{t('emptyPipelinePick', lang)}</li>
          <li>{t('emptyPipelineTune', lang)}</li>
          <li>{t('emptyPipelineRun', lang)}</li>
        </ol>
        {mode === null && (
          <button type="button" className="pipeline-empty-note pipeline-empty-mode" onClick={openModeSelector}>
            {t('emptyPipelineChooseMode', lang)}
          </button>
        )}
        <section className="prep-recipe">
          <h3 className="prep-recipe-title">{t('prepSequenceTitle', lang)}</h3>
          <p className="prep-recipe-lede">{t('prepSequenceLede', lang)}</p>
          <ol className="prep-recipe-chain">
            {PREP_SEQUENCE.map((name, i) => {
              const fn = byName.get(name)
              if (!fn) return null
              return (
                <li key={name} className={name === PREP_SEQUENCE_CID_ONLY ? 'prep-recipe-item optional' : 'prep-recipe-item'} title={name}>
                  <span className="prep-recipe-num">{i + 1}</span>
                  <span className="prep-recipe-name">{friendlyName(fn, lang, mode)}</span>
                  {name === PREP_SEQUENCE_CID_ONLY && <span className="prep-recipe-badge">{t('prepSequenceCidNote', lang)}</span>}
                </li>
              )
            })}
          </ol>
          <div className="prep-recipe-actions">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => addSteps(PREP_SEQUENCE)}>
              {t('prepSequenceUse', lang)}
            </button>
            <button type="button" className="btn btn-sm" onClick={() => addSteps(PREP_SEQUENCE_SINAN)}>
              {t('prepSequenceUseSinan', lang)}
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div ref={setWrapEl} className="graph-wrap">
      <ReactFlow
        nodes={rfNodes}
        edges={liveEdges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        deleteKeyCode={null}
        onPaneClick={() => select(null)}
        // infinite canvas: scroll/two-finger drag pans, pinch or ⌘/Ctrl+scroll zooms, drag pans
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        minZoom={0.15}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={22} size={1} color="var(--border)" />
        <Controls showInteractive={false} showFitView={false} position="top-right" orientation="horizontal">
          <button type="button" className="react-flow__controls-button" title={t('fitView', lang)} onClick={fitReadable}>⤢</button>
        </Controls>
        {steps.length >= 6 && (
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            nodeColor={(n) => n.type === 'lane' ? 'transparent' : stageColor(byName.get((n.data as { step: { fn: string } }).step.fn)?.stage ?? 'preparacao')}
            nodeStrokeWidth={0}
            style={{ width: 150, height: 96 }}
            maskColor="color-mix(in srgb, var(--bg-deep) 70%, transparent)"
          />
        )}
      </ReactFlow>
    </div>
  )
}

export default function PipelineGraph() {
  const { lang, steps, expandedPanel, toggleExpand, addStep } = usePipeline()
  const [dropping, setDropping] = useState(false)
  return (
    <section className="canvas glass">
      <div className="canvas-head">
        <div className="canvas-head-title">
          <h2>{t('pipeline', lang)}</h2>
          <span className="canvas-count">{steps.length} {t('steps', lang)}</span>
          <span className="canvas-shortcuts" title={t('shortcutsTitle', lang)} aria-label={t('shortcutsTitle', lang)}><kbd>⌘</kbd></span>
        </div>
        <button
          className="btn btn-sm expand-toggle"
          onClick={() => toggleExpand('graph')}
          title={expandedPanel === 'graph' ? t('collapsePanel', lang) : t('expandPanel', lang)}
        >
          {expandedPanel === 'graph' ? '⤡' : '⤢'}
        </button>
      </div>
      <div
        className={`graph-canvas ${dropping ? 'drop-target' : ''}`}
        onDragOver={(e) => { if (e.dataTransfer.types.includes(FN_DRAG_TYPE)) { e.preventDefault(); setDropping(true) } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as globalThis.Node)) setDropping(false) }}
        // capture phase: a drop on a card stops propagation, but the highlight must still clear
        onDropCapture={() => setDropping(false)}
        onDrop={(e) => {
          const fn = e.dataTransfer.getData(FN_DRAG_TYPE)
          if (fn) { e.preventDefault(); addStep(fn) }
        }}
      >
        <ReactFlowProvider>
          <GraphInner />
        </ReactFlowProvider>
      </div>
      <TutorialOverlay />
    </section>
  )
}
