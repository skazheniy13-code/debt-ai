import { SparkBar } from './SparkBar.jsx'
import { formatMoney, formatPct } from './format.js'
import { glassClassName } from './glass.js'
import { Skeleton } from './Skeleton.jsx'

export function DebtList({
  debts,
  maxBalance,
  maxApr,
  targetDebtId,
  strategyLabel,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <section className="lg:col-span-3">
        <div className={glassClassName('p-5')}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="mt-5 space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="lg:col-span-3">
      <div className={glassClassName('p-5')}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-white/95">
            Debts
          </h2>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300/90 ring-1 ring-white/10">
            {debts.length} accounts
          </span>
        </div>

        {debts.length === 0 ? (
          <div className="mt-5 rounded-2xl bg-white/4 p-6 text-center ring-1 ring-white/10">
            <div className="text-sm font-semibold text-white">No debts yet</div>
            <div className="mt-1 text-sm text-slate-300/80">
              Add a mock debt to see strategy recommendations and simulations.
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {debts.map((d) => (
            <div
              key={d.id}
              className={[
                'group flex min-h-fit w-full flex-col gap-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10',
                'transition duration-300 ease-out',
                'hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white/[0.06] hover:shadow-[0_18px_55px_-40px_rgba(0,0,0,0.95)]',
                d.id === targetDebtId
                  ? 'bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-violet-500/10 ring-2 ring-indigo-400/40'
                  : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {d.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-300/80">{d.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white/95">
                    {formatMoney(d.balance)}
                  </div>
                  <div className="mt-1 text-xs text-slate-300/80">
                    Min {formatMoney(d.minPayment)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-medium text-slate-300/85">
                    APR
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-100/95">
                    {formatPct(d.apr)}
                  </div>
                  <div className="mt-2">
                    <SparkBar value={d.apr} max={maxApr} tone="amber" />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-300/85">
                    Balance
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-100/95">
                    {formatMoney(d.balance)}
                  </div>
                  <div className="mt-2">
                    <SparkBar value={d.balance} max={maxBalance} tone="indigo" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-300/90">
                <span className="rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-white/10">
                  {d.apr >= 20 ? 'High APR' : 'Standard APR'}
                </span>
                <span className="font-medium text-slate-200">{d.minRatioLabel}</span>
              </div>

              {d.id === targetDebtId ? (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-indigo-500/10 px-3 py-2.5 text-[11px] ring-1 ring-indigo-400/20">
                  <span className="font-semibold text-indigo-100/95">
                    Recommended target
                  </span>
                  <span className="text-slate-200">{strategyLabel}</span>
                </div>
              ) : null}
            </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

