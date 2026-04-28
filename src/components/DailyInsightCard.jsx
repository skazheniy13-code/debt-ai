import { useMemo } from 'react'
import { glassClassName } from './glass.js'

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function seededIndex(seed, mod) {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return mod > 0 ? h % mod : 0
}

export function DailyInsightCard({ userId, todayPctCloser, remainingToMin, tier }) {
  const insight = useMemo(() => {
    const seed = `${userId ?? 'anon'}:${dayKey()}`
    const base = [
      'Small, consistent actions beat big, emotional swings.',
      'Your plan doesn’t need perfection—just repetition.',
      'The goal is freedom and calm, not a spreadsheet.',
      'Stress drops fastest when you close loops: minimums first, then focus.',
      'Momentum is built by showing up even on low‑energy days.',
    ]

    const i = seededIndex(seed, base.length)
    let line = base[i]

    if ((Number(remainingToMin) || 0) > 0) {
      line = 'First win today: finish your minimums. That’s how you keep control.'
    } else if ((Number(todayPctCloser) || 0) > 0) {
      line = `You’re ${Number(todayPctCloser).toFixed(1)}% closer to freedom. Keep the streak gentle.`
    }

    if (tier === 'free') {
      return `${line} PRO unlocks deeper coaching and optimization.`
    }

    return line
  }, [userId, todayPctCloser, remainingToMin, tier])

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="text-sm font-semibold tracking-tight text-white/95">Daily insight</div>
        <div className="mt-1 text-sm text-slate-200/85">{insight}</div>
      </div>
    </section>
  )
}

