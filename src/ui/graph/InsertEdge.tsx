import { memo, useMemo, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, useStore, type EdgeProps } from '@xyflow/react'
import { CATALOG, STAGES, searchFn, friendlyName, stageColor } from '../../catalog'
import { usePipeline } from '../../store/pipeline'
import { t, STAGE_LABELS } from '../../i18n'

const MAX_RESULTS = 12
const PICKER_TOP = 56 // px from the canvas top where the "+" lands when its picker opens

// smoothstep edge with the row-count label and a "+" that inserts a step between its two cards
function InsertEdge({ target, label, style, markerEnd, ...p }: EdgeProps) {
  const [path, lx, ly] = getSmoothStepPath({ ...p, borderRadius: 14 })
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const lang = usePipeline((s) => s.lang)
  const mode = usePipeline((s) => s.mode)
  const insertStep = usePipeline((s) => s.insertStep)
  const [vx, , zoom] = useStore((s) => s.transform)
  const { setViewport } = useReactFlow()
  // the picker opens downward and the canvas clips it — pan so the "+" sits near the top first
  const openPicker = () => {
    setViewport({ x: vx, y: PICKER_TOP - ly * zoom, zoom }, { duration: 200 })
    setOpen(true)
  }
  // empty query: the whole catalog; typed: the best-ranked hits. Either way grouped by stage
  // (Preparação → Integração → Análise) so every stage is reachable, not just the catalog's first
  const matches = useMemo(() => (query.trim() ? searchFn(query).slice(0, MAX_RESULTS) : CATALOG), [query])
  const groups = useMemo(
    () => STAGES.map((st) => ({ stage: st.id, fns: matches.filter((f) => f.stage === st.id) })).filter((g) => g.fns.length),
    [matches],
  )
  const close = () => { setOpen(false); setQuery('') }

  return (
    <>
      <BaseEdge path={path} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className={`edge-mid nodrag nopan ${open ? 'open' : ''}`}
          style={{ transform: `translate(-50%, -50%) translate(${lx}px, ${ly}px)` }}
        >
          {label && <span className="edge-rows">{label}</span>}
          <button className="edge-add" title={t('insertStepHere', lang)} onClick={() => (open ? close() : openPicker())}>+</button>
          {open && (
            // counter-scale so the picker stays readable at any canvas zoom
            <div className="insert-picker glass nowheel" style={{ transform: `translateX(-50%) scale(${1 / zoom})` }}>
              <input
                className="input search"
                autoFocus
                placeholder={t('search', lang)}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={close}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') close()
                  if (e.key === 'Enter' && query.trim() && matches[0]) { insertStep(matches[0].name, target); close() }
                }}
              />
              <ul>
                {groups.map((g) => [
                  <li key={g.stage} className="insert-picker-stage" style={{ ['--stage' as string]: stageColor(g.stage) }} onMouseDown={(e) => e.preventDefault()}>
                    {STAGE_LABELS[g.stage][lang]}
                  </li>,
                  ...g.fns.map((f) => (
                    <li
                      key={f.name}
                      style={{ ['--stage' as string]: stageColor(f.stage) }}
                      // mousedown, not click: fires before the input's blur closes the picker
                      onMouseDown={(e) => { e.preventDefault(); insertStep(f.name, target); close() }}
                    >
                      <span>{friendlyName(f, lang, mode)}</span>
                      <span className="mono">{f.name}</span>
                    </li>
                  )),
                ])}
                {!groups.length && <li className="insert-picker-empty">—</li>}
              </ul>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(InsertEdge)
