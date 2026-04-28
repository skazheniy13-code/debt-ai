import { SparkBar } from './SparkBar.jsx'
import { formatMoney, formatPct, pillTone } from './format.js'
import { glassClassName } from './glass.js'

export function SummaryDashboard({
  debtsCount,
  weightedApr,
  totalDebt,
  monthlyMin,
  riskScore,
  byBalanceDesc,
  byMinDesc,
  maxBalance,
  maxMin,
  maxApr,
  monthlyMinRatioLabel,
}) {
  return (
    <>
      <div className={glassClassName('flex min-h-fit w-full flex-col gap-4 p-6')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-300">Total debt</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {formatMoney(totalDebt)}
              </div>
              <div className="mt-1 text-sm text-slate-300/80">
                Across {debtsCount} accounts
              </div>
            </div>
            <div className="rounded-xl bg-indigo-500/10 p-3 ring-1 ring-indigo-400/20">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-indigo-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m6-6H6"
                />
              </svg>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-slate-300/80">
              <span>Balance distribution</span>
              <span className="font-medium text-slate-200">
                {formatPct(weightedApr)} avg APR
              </span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[360px] space-y-2">
                {byBalanceDesc.map((d, idx) => (
                  <div key={d.id} className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0 flex-1 truncate text-xs text-slate-300/85">
                      {d.name}
                    </div>
                    <div className="min-w-[140px] flex-[2]">
                      <SparkBar
                        value={d.balance}
                        max={maxBalance}
                        tone={idx % 2 === 0 ? 'sky' : 'violet'}
                      />
                    </div>
                    <div className="shrink-0 text-right text-xs font-medium text-slate-200">
                      {formatMoney(d.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>

      <div className={glassClassName('flex min-h-fit w-full flex-col gap-4 p-6')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-300">
                Monthly minimum
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                {formatMoney(monthlyMin)}
              </div>
              <div className="mt-1 text-sm text-slate-300/80">
                Baseline cash outflow
              </div>
            </div>
            <div className="rounded-xl bg-sky-500/10 p-3 ring-1 ring-sky-400/20">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-sky-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h10"
                />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[360px] space-y-3">
              {byMinDesc.map((d, idx) => (
                <div key={d.id} className="flex min-w-0 items-center gap-3">
                  <div className="min-w-0 flex-1 truncate text-xs text-slate-300/85">
                    {d.name}
                  </div>
                  <div className="min-w-[140px] flex-[2]">
                    <SparkBar
                      value={d.minPayment}
                      max={maxMin}
                      tone={idx % 2 === 0 ? 'emerald' : 'indigo'}
                    />
                  </div>
                  <div className="shrink-0 text-right text-xs font-medium text-slate-200">
                    {formatMoney(d.minPayment)}
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>

      <div className={glassClassName('flex min-h-fit w-full flex-col gap-4 p-6 md:col-span-2')}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-medium text-slate-300">Risk score</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="text-2xl font-semibold tracking-tight text-white">
                  {riskScore}
                  <span className="text-sm font-medium text-slate-300">/100</span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${pillTone(
                    riskScore,
                  )}`}
                >
                  {riskScore >= 75 ? 'High' : riskScore >= 45 ? 'Moderate' : 'Low'}
                </span>
              </div>
              <p className="mt-1 break-words text-sm text-slate-300/80">
                Based on balance size, APR, and minimum payment burden.
              </p>
            </div>

            <div className="w-full max-w-sm">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                <span>Exposure</span>
                <span className="font-medium text-slate-200">
                  {formatMoney(totalDebt)}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400/80 via-sky-400/60 to-violet-400/70"
                  style={{ width: `${Math.min(100, Math.max(0, riskScore))}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Lower</span>
                <span>Higher</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex min-h-fit w-full flex-col gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-[11px] font-medium text-slate-300">
                Highest APR
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {formatPct(maxApr)}
              </div>
              <div className="mt-2">
                <SparkBar value={maxApr} max={maxApr} tone="amber" />
              </div>
            </div>
            <div className="flex min-h-fit w-full flex-col gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-[11px] font-medium text-slate-300">
                Largest balance
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {formatMoney(maxBalance)}
              </div>
              <div className="mt-2">
                <SparkBar value={maxBalance} max={maxBalance} tone="indigo" />
              </div>
            </div>
            <div className="flex min-h-fit w-full flex-col gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-[11px] font-medium text-slate-300">
                Monthly min ratio
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {monthlyMinRatioLabel}
              </div>
              <div className="mt-2">
                <SparkBar value={monthlyMin} max={Math.max(monthlyMin, 1)} tone="sky" />
              </div>
            </div>
          </div>
      </div>
    </>
  )
}

