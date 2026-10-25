import { memo, useMemo, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useStore, type EdgeProps } from '@xyflow/react'
import { CATALOG, searchFn, friendlyName, stageColor } from '../../catalog'
import { usePipeline } from '../../store/pipeline'
import { t } from '../../i18n'

const MAX_RESULTS = 8

// smoothstep edge with the row-count label and a "+" that inserts a step between its two cards
function InsertEdge({ target, label, style, markerEnd, ...p }: EdgeProps) {
  const [path, lx, ly] = getSmoothStepPath({ ...p, borderRadius: 14 })
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const lang = usePipeline((s) => s.lang)
  const mode = usePipeline((s) => s.mode)
  const insertStep = usePipeline((s) => s.insertStep)
  const zoom = useStore((s) => s.transform[2])
  const matches = useMemo(() => (query.trim() ? searchFn(query) : CATALOG).slice(0, MAX_RESULTS), [query])
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
          <button className="edge-add" title={t('insertStepHere', lang)} onClick={() => setOpen(!open)}>+</button>
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
                  if (e.key === 'Enter' && matches[0]) { insertStep(matches[0].name, target); close() }
                }}
              />
              <ul>
                {matches.map((f) => (
                  <li
                    key={f.name}
                    style={{ ['--stage' as string]: stageColor(f.stage) }}
                    // mousedown, not click: fires before the input's blur closes the picker
                    onMouseDown={(e) => { e.preventDefault(); insertStep(f.name, target); close() }}
                  >
                    <span>{friendlyName(f, lang, mode)}</span>
                    <span className="mono">{f.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(InsertEdge)
