import { glassClassName } from './glass.js'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function Metric({ label, value, helper }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
      <div className="text-[11px] font-medium text-slate-300/85">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-white/95">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-300/75">{helper}</div> : null}
    </div>
  )
}

export function CoreMetricsRow({ controlScore, stressScore, momentumScore }) {
  const c = clamp(Number(controlScore) || 0, 0, 100)
  const s = clamp(Number(stressScore) || 0, 0, 100)
  const m = clamp(Number(momentumScore) || 0, 0, 100)

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="mb-4 flex flex-col gap-1">
          <div className="text-sm font-semibold tracking-tight text-white/95">Your signals</div>
          <div className="text-sm text-slate-200/85">
            We track stress, control, and momentum—so you always know what to do next.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Metric label="Control Score" value={`${Math.round(c)}`} helper="Higher means you’re on plan." />
          <Metric label="Stress Score" value={`${Math.round(s)}`} helper="Higher means interest pressure is heavier." />
          <Metric label="Financial Momentum" value={`${Math.round(m)}`} helper="Higher means your actions compound." />
        </div>
      </div>
    </section>
  )
}

