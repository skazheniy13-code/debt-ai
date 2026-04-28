import { glassClassName } from './glass.js'

export function DebtInsightsPanel({ intel }) {
  if (!intel?.insights?.length) return null

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="text-sm font-semibold tracking-tight text-white/95">Insights</div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {intel.insights.map((x, idx) => (
            <div key={String(x.key ?? idx)} className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="text-[11px] font-medium text-slate-300/85">{String(x.title ?? '—')}</div>
              <div className="mt-2 text-sm leading-relaxed text-slate-100/90">{String(x.body ?? '—')}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
