import type { Node, Edge } from '@xyflow/react'
import { buildSteps, type BuiltStep, type Step } from '../../store/pipeline'
import { stageColor, type StageId } from '../../catalog'

const NODE_W = 260
const COL_W = 340 // 80px gutter leaves room for the row-count label on each edge
const MAX_COLS = 4 // wrap long chains so big pipelines stay readable instead of shrinking
const DEFAULT_H = 64 // before React Flow has measured a node
const PLOT_GAP = 36
const ROW_GAP = 56
const LANE_PAD = 18
const LANE_LABEL = 28
const LANE_GAP = 28

export interface StepNodeData extends Record<string, unknown> {
  step: Step
  piped: boolean // first arg auto-supplied by the previous step (same rule as buildSteps)
}

export interface LaneNodeData extends Record<string, unknown> {
  stage: StageId
}

interface Line { main: BuiltStep[]; plots: { b: BuiltStep; col: number }[] }
interface Segment { stage: StageId; lines: Line[] }

// deterministic layout: consecutive steps of the same stage share a lane; inside a lane the
// chain flows left→right and wraps every MAX_COLS; plot branches sit right below their input.
// `heights` are React Flow's measured node heights (nodes grow once a result arrives).
// Positions are recomputed from `steps` every time — never persisted (no manual drag).
export function layoutSteps(steps: Step[], heights: Record<string, number> = {}): { nodes: Node[]; edges: Edge[] } {
  const built = buildSteps(steps)
  const stepById = new Map(steps.map((s) => [s.id, s]))
  const segments: Segment[] = []
  const lineOf = new Map<string, Line>()
  const colOf = new Map<string, number>()

  for (const b of built) {
    const isBranch = b.fn.family === 'plot' && b.inputStepId != null && lineOf.has(b.inputStepId)
    if (isBranch) {
      const line = lineOf.get(b.inputStepId!)!
      let col = colOf.get(b.inputStepId!)!
      while (line.plots.some((p) => p.col === col)) col++
      line.plots.push({ b, col })
      lineOf.set(b.stepId, line)
      colOf.set(b.stepId, col)
      continue
    }
    let seg = segments[segments.length - 1]
    if (!seg || seg.stage !== b.fn.stage) segments.push((seg = { stage: b.fn.stage, lines: [] }))
    let line = seg.lines[seg.lines.length - 1]
    if (!line || line.main.length >= MAX_COLS) seg.lines.push((line = { main: [], plots: [] }))
    colOf.set(b.stepId, line.main.length)
    line.main.push(b)
    lineOf.set(b.stepId, line)
  }

  const h = (id: string) => heights[id] || DEFAULT_H
  const stepNode = (b: BuiltStep, x: number, y: number): Node<StepNodeData> => ({
    id: b.stepId,
    type: 'step',
    position: { x, y },
    style: { width: NODE_W },
    draggable: false,
    data: { step: stepById.get(b.stepId)!, piped: b.input != null },
  })

  const lanes: Node<LaneNodeData>[] = []
  const nodes: Node<StepNodeData>[] = []
  let y = 0
  for (const seg of segments) {
    const laneTop = y
    y += LANE_LABEL + LANE_PAD
    let cols = 0
    seg.lines.forEach((line, li) => {
      if (li > 0) y += ROW_GAP
      const mainH = Math.max(...line.main.map((b) => h(b.stepId)))
      line.main.forEach((b, c) => nodes.push(stepNode(b, c * COL_W, y)))
      cols = Math.max(cols, line.main.length, ...line.plots.map((p) => p.col + 1))
      y += mainH
      if (line.plots.length) {
        y += PLOT_GAP
        line.plots.forEach((p) => nodes.push(stepNode(p.b, p.col * COL_W, y)))
        y += Math.max(...line.plots.map((p) => h(p.b.stepId)))
      }
    })
    y += LANE_PAD
    lanes.push({
      id: `lane-${lanes.length}`,
      type: 'lane',
      position: { x: -LANE_PAD, y: laneTop },
      style: { width: (cols - 1) * COL_W + NODE_W + 2 * LANE_PAD, height: y - laneTop, ['--stage' as string]: stageColor(seg.stage) },
      draggable: false,
      selectable: false,
      focusable: false,
      data: { stage: seg.stage },
    })
    y += LANE_GAP
  }

  const edges: Edge[] = built
    .filter((b) => b.inputStepId)
    .map((b) => {
      const branch = b.fn.family === 'plot'
      return {
        id: `${b.inputStepId}-${b.stepId}`,
        source: b.inputStepId!,
        target: b.stepId,
        type: 'smoothstep',
        pathOptions: { borderRadius: 14 },
        ...(branch ? { sourceHandle: 'bottom', targetHandle: 'top' } : {}),
        style: { stroke: stageColor(b.fn.stage), strokeWidth: 1.6, opacity: 0.75 },
      }
    })
  return { nodes: [...lanes, ...nodes], edges }
}
