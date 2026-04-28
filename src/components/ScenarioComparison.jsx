import { formatMoney } from './format.js'
import { glassClassName } from './glass.js'
import { Skeleton } from './Skeleton.jsx'

function scenarioTone(isBest) {
  return isBest
    ? 'ring-2 ring-emerald-400/35 bg-gradient-to-b from-emerald-500/[0.10] to-sky-500/[0.04]'
    : 'ring-1 ring-white/10 bg-white/5'
}

function badgeTone(badge) {
  if (badge === 'BEST') return 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/25'
  if (badge === 'FASTEST') return 'bg-sky-500/15 text-sky-100 ring-1 ring-sky-400/25'
  if (badge === 'CHEAPEST') return 'bg-indigo-500/15 text-indigo-100 ring-1 ring-indigo-400/25'
  return 'bg-white/5 text-slate-200 ring-1 ring-white/10'
}

export function ScenarioComparison({ scenarios }) {
  const isLoading = !Array.isArray(scenarios) || scenarios.length === 0

  return (
    <div className={glassClassName('p-6 md:col-span-2')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-300">
            What-if Scenario Engine
          </div>
          <div className="mt-2 text-lg font-semibold tracking-tight text-white/95">
            Strategy comparison
          </div>
          <p className="mt-1 text-sm text-slate-300/80">
            Compare payoff speed and interest across common payment plans.
          </p>
        </div>
        <div className="rounded-xl bg-sky-500/10 p-3 ring-1 ring-sky-400/20">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-sky-200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 19V5m0 14h16M8 15v-5m4 5V9m4 6V7"
            />
          </svg>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </>
        ) : (
          (scenarios ?? []).map((s) => (
          <div
            key={s.name}
            className={[
              'flex min-h-fit w-full flex-col gap-4 rounded-2xl p-5 transition duration-300 ease-out',
              'hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_18px_55px_-40px_rgba(0,0,0,0.95)]',
              scenarioTone(s.isBest),
            ].join(' ')}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0 break-words">
                <div className="truncate text-sm font-semibold text-white">
                  {s.name}
                </div>
                <div className="mt-1 text-xs text-slate-300/80">
                  Payoff in{' '}
                  <span className="font-semibold text-slate-100/95">
                    {s.payoffMonths}m
                  </span>
                </div>
              </div>
              {s.badge ? (
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${badgeTone(
                    s.badge,
                  )}`}
                >
                  {s.badge}
                </span>
              ) : null}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-300/80">
                <span>Timeline</span>
                <span className="font-medium text-slate-200">{Math.round(s.barPct)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400/70 via-indigo-400/50 to-emerald-400/60"
                  style={{ width: `${Math.max(6, Math.min(100, s.barPct))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="text-[11px] font-medium text-slate-300/80">
                  Interest
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {formatMoney(s.interestPaid)}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                <div className="text-[11px] font-medium text-slate-300/80">Saved</div>
                <div
                  className={[
                    'mt-1 text-sm font-semibold',
                    s.savingsVsBaseline > 0 ? 'text-emerald-100' : 'text-white',
                  ].join(' ')}
                >
                  {formatMoney(Math.max(0, s.savingsVsBaseline))}
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  )
}

