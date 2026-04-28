export function formatMoney(amount, currency) {
  const code =
    typeof currency === 'string' && currency.trim().length === 3
      ? currency.trim().toUpperCase()
      : null

  if (!code) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(amount)
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(amount)
  }
}

export function formatPct(pct) {
  return `${pct.toFixed(2)}%`
}

export function pillTone(score) {
  if (score >= 75) return 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/25'
  if (score >= 45) return 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/25'
  return 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/25'
}

