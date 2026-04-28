function isIso4217(code) {
  return typeof code === 'string' && /^[A-Za-z]{3}$/.test(code)
}

export function validateDebtsForCalcs(debts) {
  const issues = []

  if (!Array.isArray(debts) || debts.length === 0) {
    return { ok: false, issues: ['No debts'], items: [] }
  }

  const items = []

  for (const d of debts) {
    const id = d?.id
    const name = d?.name

    if (!isIso4217(d?.currency)) {
      issues.push(`Debt "${name ?? id ?? 'unknown'}" is missing a valid currency (ISO 4217).`)
      continue
    }

    const currency = String(d.currency).toUpperCase()
    const balance = Number(d.amount)
    const minPayment = Number(d.min_payment)
    const aprRaw = d?.apr
    const apr = aprRaw == null || aprRaw === '' ? 0 : Number(aprRaw)

    if (!Number.isFinite(balance) || balance <= 0) {
      issues.push(`Debt "${name ?? id ?? 'unknown'}" has an invalid amount.`)
      continue
    }
    if (!Number.isFinite(minPayment) || minPayment <= 0) {
      issues.push(`Debt "${name ?? id ?? 'unknown'}" has an invalid minimum payment.`)
      continue
    }
    if (!Number.isFinite(apr) || apr < 0) {
      issues.push(`Debt "${name ?? id ?? 'unknown'}" has an invalid APR.`)
      continue
    }

    items.push({
      id,
      name,
      currency,
      amount: balance,
      min_payment: minPayment,
      apr,
    })
  }

  if (items.length === 0) {
    return { ok: false, issues, items: [] }
  }

  const currencies = new Set(items.map((d) => d.currency))
  if (currencies.size !== 1) {
    issues.push('All debts must use the same currency to compute portfolio totals.')
    return { ok: false, issues, items: [] }
  }

  return { ok: true, issues, items, currency: [...currencies][0] }
}
