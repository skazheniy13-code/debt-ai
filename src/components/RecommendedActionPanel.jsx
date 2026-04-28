import { formatMoney } from './format.js'
import { glassClassName } from './glass.js'

export function RecommendedActionPanel({
  strategy,
  onStrategyChange,
  targetDebtName,
  baselineMonthsLabel,
  monthsGained,
  interestSaved,
}) {
  const recActionTitle =
    strategy === 'snowball' ? 'Snowball momentum' : 'Avalanche savings'
  const recActionSubtitle =
    strategy === 'snowball'
      ? 'Build quick wins by eliminating the smallest balance first.'
      : 'Minimize interest by attacking the highest APR first.'

  return (
    <div className={glassClassName('p-5 md:col-span-2')}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-medium text-slate-300">
            Recommended Action
          </div>
          <div className="mt-2 text-lg font-semibold tracking-tight text-white">
            {recActionTitle}
          </div>
          <p className="mt-1 text-sm text-slate-300">{recActionSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onStrategyChange('avalanche')}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition',
              strategy === 'avalanche'
                ? 'bg-indigo-500/20 text-indigo-100 ring-indigo-400/30'
                : 'bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10',
            ].join(' ')}
          >
            Avalanche
          </button>
          <button
            type="button"
            onClick={() => onStrategyChange('snowball')}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition',
              strategy === 'snowball'
                ? 'bg-emerald-500/20 text-emerald-100 ring-emerald-400/30'
                : 'bg-white/5 text-slate-200 ring-white/10 hover:bg-white/10',
            ].join(' ')}
          >
            Snowball
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-[11px] font-medium text-slate-300">Target debt</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {targetDebtName ?? '—'}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {strategy === 'snowball'
              ? 'Smallest balance first'
              : 'Highest APR first'}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-[11px] font-medium text-slate-300">Months gained</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {monthsGained >= 0 ? `+${monthsGained}` : `${monthsGained}`}m
          </div>
          <div className="mt-1 text-xs text-slate-400">
            vs {baselineMonthsLabel} baseline
          </div>
        </div>
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-[11px] font-medium text-slate-300">Interest saved</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {formatMoney(Math.max(0, interestSaved))}
          </div>
          <div className="mt-1 text-xs text-slate-400">Instant update</div>
        </div>
      </div>
    </div>
  )
}

