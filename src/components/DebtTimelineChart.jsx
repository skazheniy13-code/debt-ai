import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { glassClassName } from './glass.js'
import { formatMoney } from './format.js'

function TooltipContent({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  const byName = new Map(payload.map((p) => [p.name, p.value]))
  const base = byName.get('Baseline') ?? null
  const extra = byName.get('With extra') ?? null

  return (
    <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-100 ring-1 ring-white/10 backdrop-blur">
      <div className="font-semibold text-white/95">Month {label}</div>
      <div className="mt-1 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-300">Baseline</span>
          <span className="font-semibold">{base == null ? '—' : formatMoney(base, currency)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-300">With extra</span>
          <span className="font-semibold">{extra == null ? '—' : formatMoney(extra, currency)}</span>
        </div>
      </div>
    </div>
  )
}

export function DebtTimelineChart({ baseline, withExtra, currency }) {
  const data = useMemo(() => {
    if (!Array.isArray(baseline) || !Array.isArray(withExtra)) return null
    const maxMonth = Math.max(
      baseline.at(-1)?.month ?? 0,
      withExtra.at(-1)?.month ?? 0,
      0,
    )

    const baseMap = new Map(baseline.map((p) => [p.month, p.balance]))
    const extraMap = new Map(withExtra.map((p) => [p.month, p.balance]))

    const rows = []
    for (let m = 0; m <= maxMonth; m += 1) {
      rows.push({
        month: m,
        Baseline: baseMap.get(m) ?? null,
        'With extra': extraMap.get(m) ?? null,
      })
    }
    return rows
  }, [baseline, withExtra])

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white/95">
              Freedom timeline
            </div>
            <div className="mt-1 text-xs text-slate-300/80">
              Watch the stress fade as the balance falls
            </div>
          </div>
        </div>

        <div className="mt-4 h-64 w-full">
          {data ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'rgba(226,232,240,0.72)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.10)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.10)' }}
                />
                <YAxis
                  tick={{ fill: 'rgba(226,232,240,0.72)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.10)' }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.10)' }}
                  tickFormatter={(v) => (currency ? formatMoney(v, currency) : String(v))}
                  width={72}
                />
                <Tooltip content={(props) => <TooltipContent {...props} currency={currency} />} />
                <Legend
                  wrapperStyle={{ color: 'rgba(226,232,240,0.72)', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="Baseline"
                  stroke="rgba(148,163,184,0.9)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="With extra"
                  stroke="rgba(56,189,248,0.95)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-white/[0.04] text-sm text-slate-200/85 ring-1 ring-white/10">
              Timeline unavailable
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

