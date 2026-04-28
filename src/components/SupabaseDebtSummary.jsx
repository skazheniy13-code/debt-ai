import { glassClassName } from './glass.js'
import { formatMoney } from './format.js'

function StatCard({ label, value, helper }) {
  return (
    <div
      className={[
        'rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10',
        'transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]',
      ].join(' ')}
    >
      <div className="text-[11px] font-medium text-slate-300/85">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-white/95">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-300/75">{helper}</div> : null}
    </div>
  )
}

export function SupabaseDebtSummary({
  loading,
  totalDebt,
  totalMinPayment,
  count,
  currency,
  totalPaidPct = 0,
  closedCount = 0,
}) {
  const safeMoney = (n) => {
    const x = Number(n)
    const safe = Number.isFinite(x) ? x : 0
    return formatMoney(safe, currency)
  }

  const safePct = (n) => {
    const x = Number(n)
    const safe = Number.isFinite(x) ? x : 0
    const clamped = Math.max(0, Math.min(100, safe))
    return `${Math.round(clamped)}%`
  }

  const safeCount = () => {
    const x = Number(count)
    if (!Number.isFinite(x)) return '0'
    return String(Math.max(0, Math.floor(x)))
  }

  const safeClosed = () => {
    const x = Number(closedCount)
    if (!Number.isFinite(x)) return '0'
    return String(Math.max(0, Math.floor(x)))
  }

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <StatCard
            label="Total Debt"
            value={loading ? safeMoney(0) : safeMoney(totalDebt)}
            helper={null}
          />
          <StatCard
            label="Monthly Minimum"
            value={loading ? safeMoney(0) : safeMoney(totalMinPayment)}
            helper={null}
          />
          <StatCard
            label="Number of debts"
            value={loading ? '0' : safeCount()}
            helper={null}
          />
          <StatCard label="% paid (plan)" value={loading ? '0%' : safePct(totalPaidPct)} helper={null} />
          <StatCard label="Closed debts" value={loading ? '0' : safeClosed()} helper={null} />
        </div>
      </div>
    </section>
  )
}

