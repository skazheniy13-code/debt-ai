import { glassClassName } from './glass.js'
import { formatMoney } from './format.js'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function DebtFreedomProgress({ totalDebt, startDebt, currency }) {
  const current = Number(totalDebt)
  const start = Number(startDebt)

  const safeCurrent = Number.isFinite(current) ? Math.max(0, current) : 0
  const safeStart = Number.isFinite(start) ? Math.max(0, start) : 0

  const paid = Math.max(0, safeStart - safeCurrent)
  const pct = safeStart <= 0 ? 0 : clamp((paid / safeStart) * 100, 0, 100)

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold tracking-tight text-white/95">
              Debt freedom
            </div>
            <div className="mt-1 text-xs text-slate-300/80">
              {safeStart <= 0
                ? 'No baseline yet'
                : currency
                  ? `${formatMoney(paid, currency)} paid down so far`
                  : `${paid.toFixed(0)} paid down so far`}
            </div>
          </div>
          <div className="text-sm font-semibold text-white/95">{Math.round(pct)}%</div>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-white/10 ring-1 ring-white/10">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-sky-500/80 to-indigo-500/70"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  )
}

