import { glassClassName } from './glass.js'
import { formatMoney } from './format.js'

function addMonthsToNow(months) {
  const m = Number(months)
  if (!Number.isFinite(m)) return null
  const d = new Date()
  d.setMonth(d.getMonth() + Math.max(0, Math.floor(m)))
  return d
}

function dateLabel(d) {
  if (!d) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function CaseCard({ tone, title, subtitle, months, currency, interestPaid }) {
  const date = addMonthsToNow(months)
  const when = dateLabel(date)

  const toneClass =
    tone === 'best'
      ? 'ring-emerald-400/25'
      : tone === 'worst'
        ? 'ring-rose-400/25'
        : 'ring-sky-400/25'

  return (
    <div className={['rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10', toneClass].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/95">{title}</div>
          <div className="mt-1 text-xs text-slate-300/80">{subtitle}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-white/95">
            {months == null ? 'Not possible' : `${Math.floor(Number(months))} mo`}
          </div>
          <div className="mt-1 text-[11px] text-slate-300/80">{when ? when : '—'}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-300/85">
        <span>Estimated interest</span>
        <span className="font-semibold text-slate-100/90">
          {currency && Number.isFinite(Number(interestPaid))
            ? formatMoney(Math.max(0, Number(interestPaid)), currency)
            : '—'}
        </span>
      </div>
    </div>
  )
}

export function DebtFreedomStory({ currency, recommended, best, worst, isPro, onUpgrade }) {
  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold tracking-tight text-white/95">
            Debt Freedom Story
          </div>
          <div className="text-sm text-slate-200/85">
            Three futures—so you can choose the one that feels calm and realistic.
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <CaseCard
            tone="worst"
            title="Worst case"
            subtitle="Minimums only. Slow progress can feel heavy."
            months={worst?.stats?.months ?? null}
            interestPaid={worst?.stats?.interestPaid ?? null}
            currency={currency}
          />
          <CaseCard
            tone="recommended"
            title="Recommended"
            subtitle="Simple plan. Consistency beats intensity."
            months={recommended?.stats?.months ?? null}
            interestPaid={recommended?.stats?.interestPaid ?? null}
            currency={currency}
          />
          {isPro ? (
            <CaseCard
              tone="best"
              title="Best case"
              subtitle="Extra focus. Faster relief and confidence."
              months={best?.stats?.months ?? null}
              interestPaid={best?.stats?.interestPaid ?? null}
              currency={currency}
            />
          ) : (
            <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 ring-emerald-400/25">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white/95">Best case</div>
                  <div className="mt-1 text-xs text-slate-300/80">
                    Unlock your fastest path to debt freedom
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white/[0.04] px-4 py-3 text-xs text-slate-200/85 ring-1 ring-white/10">
                You could save months and reduce interest
              </div>

              <div className="mt-4 flex justify-start">
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="rounded-xl bg-gradient-to-r from-sky-500/80 to-indigo-500/70 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-sky-400/25 transition hover:scale-[1.01]"
                >
                  Разблокировать PRO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

