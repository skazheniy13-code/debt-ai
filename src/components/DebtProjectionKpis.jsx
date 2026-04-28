import { useMemo } from 'react'
import { glassClassName } from './glass.js'
import { formatMoney } from './format.js'
import { useCountUp } from '../hooks/useCountUp.js'

function Kpi({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
      <div className="text-[11px] font-medium text-slate-300/85">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-white/95">{value}</div>
    </div>
  )
}

export function DebtProjectionKpis({ baseline, withExtra, currency, extraMonthly }) {
  const baseMonths =
    baseline && Number.isFinite(Number(baseline.months)) ? Math.floor(Number(baseline.months)) : null
  const extraMonths =
    withExtra && Number.isFinite(Number(withExtra.months)) ? Math.floor(Number(withExtra.months)) : null

  const baseInterest =
    baseline && Number.isFinite(Number(baseline.interestPaid)) ? Number(baseline.interestPaid) : null
  const extraInterest =
    withExtra && Number.isFinite(Number(withExtra.interestPaid)) ? Number(withExtra.interestPaid) : null

  const saved =
    baseInterest == null || extraInterest == null ? null : Math.max(0, baseInterest - extraInterest)

  const animBaseMonths = useCountUp(baseMonths, { durationMs: 650 })
  const animExtraMonths = useCountUp(extraMonths, { durationMs: 650 })
  const animSaved = useCountUp(saved, { durationMs: 850 })

  const payoffMonths = animExtraMonths ?? animBaseMonths
  const payoffDate = useMemo(() => {
    if (!Number.isFinite(Number(payoffMonths))) return null
    const m = Math.max(0, Math.floor(Number(payoffMonths)))
    const d = new Date()
    d.setMonth(d.getMonth() + m)
    return d
  }, [payoffMonths])

  const payoffDateLabel = payoffDate
    ? payoffDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
    : null

  const extraLabel = Number.isFinite(Number(extraMonthly)) ? Number(extraMonthly) : null
  const extraLabelText =
    extraLabel == null
      ? null
      : currency
        ? formatMoney(Math.max(0, extraLabel), currency)
        : `$${Math.max(0, Math.round(extraLabel))}`

  const payoffBlocked = baseMonths == null || extraMonths == null
  const payoffBlockedText =
    'Minimum payments are not enough to reduce debt due to high interest'

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm font-semibold tracking-tight text-white/95">
            Freedom date
          </div>
          <div className="text-xs text-slate-300/80">
            {payoffBlocked
              ? payoffBlockedText
              : animExtraMonths == null || extraLabelText == null
                ? payoffBlockedText
                : `With an extra ${extraLabelText}/month, you become debt-free in ${Math.max(
                    0,
                    Math.floor(Number(animExtraMonths)),
                  )} months`}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi
            label="Months to payoff"
            value={animBaseMonths == null ? 'Not possible' : `${Math.max(0, Math.floor(animBaseMonths))} mo`}
          />
          <Kpi
            label={extraLabel == null ? 'Months with extra' : `Months with +${extraLabel}/mo`}
            value={animExtraMonths == null ? 'Not possible' : `${Math.max(0, Math.floor(animExtraMonths))} mo`}
          />
          <Kpi
            label="Interest saved"
            value={
              animSaved == null || !currency ? 'Not possible' : formatMoney(Math.max(0, animSaved), currency)
            }
          />
        </div>
        <div className="mt-3 text-xs text-slate-300/80">
          {animSaved == null || !currency
            ? payoffBlockedText
            : `You save ${formatMoney(Math.max(0, animSaved), currency)} in interest with extra payments.`}
        </div>
      </div>
    </section>
  )
}

