import { formatMoney, formatPct } from './format.js'
import { glassClassName } from './glass.js'

export function Header({ totalDebt, weightedApr }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          Mock portfolio · no backend
        </div>
        <h1 className="mt-3 text-pretty text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Debt AI Assistant
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300/80">
          A premium dashboard to track balances, understand risk, and simulate
          the payoff impact of small monthly changes.
        </p>
      </div>

      <div className={glassClassName('p-5')}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-300/85">Total debt</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-white">
              {formatMoney(totalDebt)}
            </div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div>
            <div className="text-xs font-medium text-slate-300/85">Avg APR</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-white">
              {formatPct(weightedApr)}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

