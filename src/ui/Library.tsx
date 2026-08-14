import { useMemo, useState } from 'react'
import { CATALOG, STAGES, stageColor, searchFn, friendlyName, type StageId } from '../catalog'
import { usePipeline } from '../store/pipeline'
import { t, STAGE_LABELS, FAMILY_LABELS } from '../i18n'

const FAMILY_ORDER = ['core', 'spatial', 'censo', 'climate', 'grid', 'plot']

// stage tab icons — chosen from the icon-review artifact (Preparação C, Integração A, Modelagem A)
const STAGE_ICONS: Record<StageId, JSX.Element> = {
  preparacao: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="5" y1="4" x2="5" y2="20" /><circle cx="5" cy="10" r="1.8" />
      <line x1="12" y1="4" x2="12" y2="20" /><circle cx="12" cy="15" r="1.8" />
      <line x1="19" y1="4" x2="19" y2="20" /><circle cx="19" cy="7" r="1.8" />
    </svg>
  ),
  integracao: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9.5" cy="12" r="6" /><circle cx="14.5" cy="12" r="6" />
    </svg>
  ),
  modelagem: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 18.5c3-1 3-9.5 6-9.5s3 8.5 6 8.5 3-6.5 6-6.5" />
      <line x1="3" y1="20.5" x2="21" y2="20.5" strokeWidth="1.3" opacity="0.5" />
    </svg>
  ),
}

export default function Library() {
  const { lang, inspectFn, inspect, addStep } = usePipeline()
  const [stage, setStage] = useState<StageId>('preparacao')
  const [query, setQuery] = useState('')

  const fns = useMemo(() => {
    const filtered = query.trim() ? searchFn(query) : CATALOG.filter((f) => f.stage === stage)
    return query.trim() ? filtered : filtered.filter((f) => f.stage === stage)
  }, [stage, query])

  const families = useMemo(() => {
    const g: Record<string, typeof fns> = {}
    for (const f of fns) (g[f.family] ??= []).push(f)
    return FAMILY_ORDER.filter((k) => g[k]).map((k) => [k, g[k]] as const)
  }, [fns])

  return (
    <aside className="library glass">
      <div className="stage-tabs">
        {STAGES.map((s) => (
          <button
            key={s.id}
            className={`stage-tab ${stage === s.id && !query ? 'active' : ''}`}
            style={{ ['--stage' as string]: s.color }}
            title={STAGE_LABELS[s.id].sub[lang]}
            onClick={() => { setStage(s.id); setQuery('') }}
            data-stage={s.id}
          >
            <span className="stage-icon">{STAGE_ICONS[s.id]}</span>
            <span>{STAGE_LABELS[s.id][lang]}</span>
            <span className="stage-count">{CATALOG.filter((f) => f.stage === s.id).length}</span>
          </button>
        ))}
      </div>
      <input
        className="input search"
        placeholder={t('search', lang)}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="fn-list">
        {families.map(([fam, list]) => (
          <div key={fam}>
            <div className="label">{FAMILY_LABELS[fam]?.[lang] ?? fam}</div>
            {list.map((f) => (
              <div
                key={f.name}
                className={`fn-item ${inspectFn === f.name ? 'active' : ''}`}
                style={{ ['--stage' as string]: stageColor(f.stage) }}
                onClick={() => inspect(f.name)}
                onDoubleClick={() => addStep(f.name)}
                title={f.title}
              >
                <span className="fn-friendly">
                  <span className="fn-friendly-name">{friendlyName(f, lang)}</span>
                  <span className="mono fn-name">{f.name}</span>
                </span>
                <button
                  className="fn-add"
                  aria-label={t('addToPipeline', lang)}
                  title={t('addToPipeline', lang)}
                  onClick={(e) => { e.stopPropagation(); addStep(f.name) }}
                >＋</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
