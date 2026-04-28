import { glassClassName } from './glass.js'
import { formatMoney } from './format.js'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function WhatIfExtraPayment({ value, onChange, currency }) {
  const v = Number.isFinite(Number(value)) ? Number(value) : 0
  const safe = clamp(v, 0, 2000)

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold tracking-tight text-white/95">What if</div>
            <div className="mt-1 text-xs text-slate-300/80">
              Extra monthly payment to accelerate payoff
            </div>
          </div>
          <div className="text-sm font-semibold text-white/95">
            {currency ? `+${formatMoney(safe, currency)}/mo` : `+${safe}/mo`}
          </div>
        </div>

        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={2000}
            step={25}
            value={safe}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300/75">
            <span>0</span>
            <span>500</span>
            <span>1000</span>
            <span>1500</span>
            <span>2000</span>
          </div>
        </div>
      </div>
    </section>
  )
}

