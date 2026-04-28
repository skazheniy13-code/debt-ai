export function SparkBar({ value = 0, max = 1, tone = 'indigo' }) {
  const safeMax = max <= 0 ? 1 : max
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100))

  const toneMap = {
    indigo: 'from-indigo-400/70 to-indigo-300/10',
    sky: 'from-sky-400/70 to-sky-300/10',
    violet: 'from-violet-400/70 to-violet-300/10',
    emerald: 'from-emerald-400/70 to-emerald-300/10',
    rose: 'from-rose-400/70 to-rose-300/10',
    amber: 'from-amber-400/70 to-amber-300/10',
  }
  const gradient = toneMap[tone] ?? toneMap.indigo

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

