import { useMemo } from 'react'
import { glassClassName } from './glass.js'
import { formatMoney } from './format.js'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export function WeeklySummaryCard({ payments, currency }) {
  const summary = useMemo(() => {
    const items = Array.isArray(payments) ? payments : []
    const since = daysAgo(7).getTime()
    const week = items.filter((p) => {
      const t = Date.parse(String(p?.createdAt ?? ''))
      if (!Number.isFinite(t)) return false
      return t >= since
    })
    const totalPaid = week.reduce((s, p) => s + (Number.isFinite(Number(p?.amount)) ? Number(p.amount) : 0), 0)
    const days = new Set(
      week
        .map((p) => {
          const t = Date.parse(String(p?.createdAt ?? ''))
          if (!Number.isFinite(t)) return null
          const d = new Date(t)
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        })
        .filter(Boolean),
    )
    return { totalPaid, activeDays: days.size, entries: week.length }
  }, [payments])

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold tracking-tight text-white/95">Weekly summary</div>
          <div className="text-sm text-slate-200/85">
            A calm check‑in. Focus on actions you can repeat.
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <div className="text-[11px] font-medium text-slate-300/85">Paid (7 days)</div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white/95">
              {currency ? formatMoney(Math.max(0, summary.totalPaid), currency) : Math.round(summary.totalPaid)}
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <div className="text-[11px] font-medium text-slate-300/85">Days you showed up</div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white/95">{summary.activeDays}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <div className="text-[11px] font-medium text-slate-300/85">Logged payments</div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white/95">{summary.entries}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

