import { glassClassName } from './glass.js'
import { formatMoney } from './format.js'

function toneClass(level) {
  const lvl = level === 'high' || level === 'medium' || level === 'low' ? level : 'low'
  if (lvl === 'high') return 'bg-rose-500/12 text-rose-100 ring-1 ring-rose-400/25'
  if (lvl === 'medium') return 'bg-amber-500/12 text-amber-100 ring-1 ring-amber-400/25'
  return 'bg-emerald-500/12 text-emerald-100 ring-1 ring-emerald-400/25'
}

export function AIDebtIntelligenceCard({
  intel,
  baselinePayoff,
  extraPayoff,
  extraPayment,
}) {
  const rec = intel?.engine?.strategy ?? { best: null, why: '' }
  const currency = intel?.currency ?? null

  const baselineMonths = baselinePayoff?.stats?.months ?? null
  const plusMonths = extraPayoff?.stats?.months ?? null
  const monthsSaved =
    baselineMonths == null || plusMonths == null ? null : Math.max(0, baselineMonths - plusMonths)

  const risk = intel?.engine?.risk ?? null
  const extra = Number.isFinite(Number(extraPayment)) ? Math.max(0, Math.floor(Number(extraPayment))) : null
  const extraLabel =
    extra == null
      ? '—'
      : currency
        ? `+${formatMoney(extra, currency)}/mo`
        : `+$${extra}/mo`

  const fmtMo = (m) => {
    const x = Number(m)
    if (!Number.isFinite(x)) return '—'
    return `${Math.max(0, Math.floor(x))} mo`
  }

  const payoffBlocked = baselineMonths == null || plusMonths == null
  const payoffBlockedText =
    'Minimum payments are not enough to reduce debt due to high interest'

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white/95">
              Coach’s note
            </div>
            <div className="mt-1 text-sm text-slate-200/85">
              {String(rec.why ?? '').trim() || 'One step at a time. We’ll keep this simple and steady.'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10">
              {rec.best == null ? '—' : rec.best === 'avalanche' ? 'Avalanche' : 'Snowball'}
            </span>
            {risk ? (
              <span
                className={['rounded-full px-2.5 py-1 text-[11px] font-semibold', toneClass(risk.level)].join(' ')}
              >
                Risk: {String(risk.label ?? '—')}
              </span>
            ) : (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10">
                Risk: —
              </span>
            )}
          </div>
        </div>

        {payoffBlocked ? (
          <div className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-100 ring-1 ring-amber-400/20">
            {payoffBlockedText}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <div className="text-[11px] font-medium text-slate-300/85">Payoff (min payments)</div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white/95">
              {baselineMonths == null ? 'Not possible' : fmtMo(baselineMonths)}
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <div className="text-[11px] font-medium text-slate-300/85">With {extraLabel}</div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white/95">
              {plusMonths == null ? 'Not possible' : fmtMo(plusMonths)}
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <div className="text-[11px] font-medium text-slate-300/85">Months saved</div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-white/95">
              {monthsSaved == null ? '0 mo' : fmtMo(monthsSaved)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

