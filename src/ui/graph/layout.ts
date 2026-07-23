import type { Node, Edge } from '@xyflow/react'
import { buildSteps, type Step } from '../../store/pipeline'

const COL_W = 300
const ROW_MAIN = 0
const ROW_PLOT = 260
const NODE_W = 260

export interface StepNodeData extends Record<string, unknown> {
  step: Step
}

// deterministic layout: column = pipeline order (left-to-right, matches conventional
// pipeline-tool flow direction), plot branches drop to a row below the main chain.
// Positions are recomputed from `steps` every time — never persisted (see plan: no manual drag in v1).
export function layoutSteps(steps: Step[]): { nodes: Node<StepNodeData>[]; edges: Edge[] } {
  const built = buildSteps(steps)
  const nodes: Node<StepNodeData>[] = built.map((b, i) => ({
    id: b.stepId,
    type: 'step',
    position: { x: i * COL_W, y: b.fn.family === 'plot' ? ROW_PLOT : ROW_MAIN },
    style: { width: NODE_W },
    draggable: false,
    data: { step: steps.find((s) => s.id === b.stepId)! },
  }))
  const edges: Edge[] = built
    .filter((b) => b.inputStepId)
    .map((b) => ({
      id: `${b.inputStepId}-${b.stepId}`,
      source: b.inputStepId!,
      target: b.stepId,
      style: { stroke: 'var(--border-strong)', strokeWidth: 1.5 },
    }))
  return { nodes, edges }
}
