import { formatMoney, formatPct } from './format.js'
import { glassClassName } from './glass.js'
import { SparkBar } from './SparkBar.jsx'

export function ImpactSimulator({
  strategy,
  extraPayment,
  onExtraPaymentChange,
  monthsLabel,
  payoffDateLabel,
  baselineMonthsLabel,
  interestPaidLabel,
  interestSaved,
  monthlyMin,
  monthlyWithExtra,
  targetDebtName,
}) {
  return (
    <section className="lg:col-span-3">
      <div className={glassClassName('p-4')}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-white">
            AI impact simulator
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-white/10">
            {strategy === 'snowball' ? 'Snowball payoff' : 'Avalanche payoff'}
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-4 ring-1 ring-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-300">Extra payment</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {formatMoney(extraPayment)}
                <span className="ml-1 text-sm font-medium text-slate-300">/mo</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {strategy === 'snowball'
                  ? 'Applied to smallest balance first.'
                  : 'Applied to highest APR balance first.'}
              </div>
            </div>
            <div className="rounded-xl bg-violet-500/10 p-3 ring-1 ring-violet-400/20">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-violet-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v18m9-9H3"
                />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={600}
              step={25}
              value={extraPayment}
              onChange={(e) => onExtraPaymentChange(Number(e.target.value))}
              className="w-full accent-indigo-300"
              aria-label="Extra payment slider"
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>$0</span>
              <span>$600</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-xs font-medium text-slate-300">
              Estimated payoff time
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-white">
              {monthsLabel}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Target date: {payoffDateLabel}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
              <span>Baseline</span>
              <span className="font-medium text-slate-200">{baselineMonthsLabel}</span>
            </div>
            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-300">
                <span>Progress</span>
                <span className="font-medium text-slate-200">Instant</span>
              </div>
              <SparkBar
                value={Math.min(100, Math.max(10, extraPayment / 6))}
                max={100}
                tone="violet"
              />
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="text-xs font-medium text-slate-300">Interest impact</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-white">
              {interestPaidLabel}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Saved: {formatMoney(Math.max(0, interestSaved))} vs baseline
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                <div className="text-[11px] font-medium text-slate-300">
                  Baseline min
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {formatMoney(monthlyMin)}
                  <span className="text-xs font-medium text-slate-300">/mo</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                <div className="text-[11px] font-medium text-slate-300">
                  With extra
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {formatMoney(monthlyWithExtra)}
                  <span className="text-xs font-medium text-slate-300">/mo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300">
                Debt strategy engine (mock)
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-100 ring-1 ring-emerald-400/20">
                Ready
              </span>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                Focus: <span className="font-semibold">{targetDebtName ?? '—'}</span>{' '}
                ({strategy === 'snowball' ? 'smallest balance' : 'highest APR'}).
              </li>
              <li className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                Keep total payment under {formatMoney(monthlyMin + 350)} to preserve
                cash buffer.
              </li>
              <li className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
                If APR stays above {formatPct(18)}, explore refinance offers.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

