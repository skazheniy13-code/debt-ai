import { glassClassName } from './glass.js'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function DailyFreedomMessage({ startDebt, totalDebt }) {
  const start = Number(startDebt)
  const current = Number(totalDebt)

  const safeStart = Number.isFinite(start) && start > 0 ? start : null
  const safeCurrent = Number.isFinite(current) && current >= 0 ? current : null

  const pct =
    safeStart == null || safeCurrent == null
      ? null
      : clamp(((safeStart - safeCurrent) / safeStart) * 100, 0, 100)

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="text-sm font-semibold tracking-tight text-white/95">
          Calm progress, real momentum
        </div>
        <div className="mt-1 text-sm text-slate-200/85">
          {pct == null
            ? 'Today, you’re showing up for your future self.'
            : `Today you are ${pct.toFixed(1)}% closer to freedom.`}
        </div>
      </div>
    </section>
  )
}

