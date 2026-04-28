import { glassClassName } from './glass.js'
import { Skeleton } from './Skeleton.jsx'

function riskBadgeTone(level) {
  if (level === 'high') return 'bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/25'
  if (level === 'medium')
    return 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/25'
  return 'bg-sky-500/15 text-sky-100 ring-1 ring-sky-400/25'
}

export function AIInsights({ advisor }) {
  const isLoading = !advisor
  const insights = advisor?.insights ?? []
  const actions = advisor?.actions ?? []
  const riskLevel = advisor?.riskLevel ?? 'low'

  return (
    <div className={glassClassName('p-6 md:col-span-2')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-300/85">AI Advisor</div>
          <div className="mt-2 text-lg font-semibold tracking-tight text-white/95">
            Financial insights
          </div>
          <p className="mt-1 text-sm text-slate-300/80">
            Calm, rule-based guidance—no external AI APIs.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${riskBadgeTone(
            riskLevel,
          )}`}
        >
          Risk: {riskLevel}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-b from-sky-500/[0.10] to-indigo-500/[0.05] p-5 ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">Summary</div>
          <div className="rounded-lg bg-sky-500/10 p-2 ring-1 ring-sky-400/20">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-sky-200"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.5 9.5h5m-5 3h5M7 20h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9L5 8v10a2 2 0 0 0 2 2Z"
              />
            </svg>
          </div>
        </div>
        {isLoading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
          </div>
        ) : (
          <p className="mt-2 break-words text-sm leading-relaxed text-slate-200/90">
            {advisor?.summary ?? '—'}
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-xs font-medium text-slate-300/85">Key insights</div>
          {isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-8/12" />
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-200/95">
              {(insights.length ? insights.slice(0, 3) : ['—']).map((t, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300/80" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <div className="text-xs font-medium text-slate-300/85">
            Recommended actions
          </div>
          {isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-200/95">
              {(actions.length ? actions.slice(0, 4) : ['—']).map((t, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300/80" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

