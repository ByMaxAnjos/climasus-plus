import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { usePipeline } from '../../../store/pipeline'
import { STAGE_LABELS } from '../../../i18n'
import type { LaneNodeData } from '../layout'

// background band grouping consecutive steps of one stage (Preparação / Integração / Análise)
function LaneNode({ data }: NodeProps & { data: LaneNodeData }) {
  const lang = usePipeline((s) => s.lang)
  return (
    <div className="graph-lane">
      <span className="graph-lane-label">{STAGE_LABELS[data.stage][lang]}</span>
    </div>
  )
}

export default memo(LaneNode)
