import { useEffect, useMemo, useState } from 'react'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function useCountUp(value, { durationMs = 650 } = {}) {
  const target = useMemo(() => {
    const v = Number(value)
    return Number.isFinite(v) ? v : null
  }, [value])

  const [display, setDisplay] = useState(target ?? null)

  useEffect(() => {
    if (target == null) {
      setDisplay(null)
      return
    }

    let raf = 0
    const start = performance.now()
    const from = Number(display ?? 0)
    const delta = target - from

    const d = clamp(Number(durationMs) || 650, 120, 1200)

    function tick(now) {
      const t = clamp((now - start) / d, 0, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + delta * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs])

  return display
}

