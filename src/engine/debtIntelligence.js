import { validateDebtsForCalcs } from './debtValidation.js'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function cloneDebtsInput(debts) {
  if (!Array.isArray(debts)) return []
  return debts.map((d) => ({ ...(d ?? {}) }))
}

function withEffectiveApr(debts) {
  // Derived APR is used ONLY in engine copies (never written back to real debts).
  return (Array.isArray(debts) ? debts : []).map((d) => ({
    ...d,
    apr: d?.apr && Number(d.apr) > 0 ? d.apr : 5,
  }))
}

function monthlyRateFromApr(apr) {
  // `apr` is stored as an annual rate.
  // - If apr <= 1, treat it as a fraction (e.g. 0.2299 == 22.99%/yr) => monthly = apr/12
  // - If apr > 1, treat it as a percent (e.g. 22.99 == 22.99%/yr) => monthly = (apr/100)/12
  if (!Number.isFinite(apr) || apr < 0) return null
  if (apr <= 1) return apr / 12
  return apr / 100 / 12
}

function aprPercentForUi(apr) {
  if (!Number.isFinite(apr) || apr < 0) return null
  if (apr <= 1) return apr * 100
  return apr
}

function weightedAprPercent(items) {
  const totalDebt = items.reduce((s, d) => s + d.amount, 0)
  if (!(totalDebt > 0)) return null

  const weighted = items.reduce((s, d) => {
    const pct = aprPercentForUi(d.apr)
    if (pct == null) return s
    return s + (d.amount / totalDebt) * pct
  }, 0)

  return Number.isFinite(weighted) ? weighted : null
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function fmtPct1(n) {
  return `${round1(n)}%`
}

function fmtMoneyCompact(n) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

function dominantDriverKey({ aprScore, debtScore, coverageScore }) {
  const a = aprScore ?? 0
  const d = debtScore ?? 0
  const c = coverageScore ?? 0
  if (a > d && a > c) return 'apr'
  if (d > a && d > c) return 'debt'
  if (c > a && c > d) return 'coverage'
  // Deterministic tie-break: APR > debt > coverage
  if (a >= d && a >= c) return 'apr'
  if (d >= c) return 'debt'
  return 'coverage'
}

function toEngineItems(validatedItems) {
  return validatedItems.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.amount,
    minPayment: d.min_payment,
    apr: d.apr,
  }))
}

function sortDebts(items, strategy) {
  if (strategy === 'snowball') {
    return [...items].sort(
      (a, b) =>
        a.balance -
          b.balance ||
        b.apr - a.apr ||
        String(a.id).localeCompare(String(b.id)),
    )
  }
  return [...items].sort((a, b) => {
    const rb = monthlyRateFromApr(b.apr) ?? 0
    const ra = monthlyRateFromApr(a.apr) ?? 0
    if (rb !== ra) return rb - ra
    if (b.balance !== a.balance) return b.balance - a.balance
    return String(a.id).localeCompare(String(b.id))
  })
}

function simulatePayoffMonthsFromValidatedItems(validatedItems, { strategy, extraMonthly } = {}) {
  const items = toEngineItems(validatedItems).map((d) => ({ ...d }))
  const monthlyExtra = Number(extraMonthly)
  const extra = Number.isFinite(monthlyExtra) && monthlyExtra > 0 ? monthlyExtra : 0

  if (items.length === 0) return null

  const totalMin = items.reduce((sum, d) => sum + d.minPayment, 0)
  const totalPayBudget = totalMin + extra
  if (totalPayBudget <= 0) return null

  const MAX_MONTHS = 900
  let months = 0

  while (months < MAX_MONTHS) {
    const remaining = items.reduce((sum, d) => sum + Math.max(0, d.balance), 0)
    if (remaining <= 0.01) return months

    months += 1

    const interestDue = items.reduce((sum, d) => {
      if (d.balance <= 0) return sum
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return sum
      return sum + d.balance * r
    }, 0)

    if (totalPayBudget <= interestDue + 1e-6) return null

    // Compound interest on current balances (monthly compounding)
    for (const d of items) {
      if (d.balance <= 0) continue
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return null
      d.balance = d.balance * (1 + r)
    }

    let paid = 0
    for (const d of items) {
      if (d.balance <= 0) continue
      const p = Math.min(d.minPayment, d.balance)
      d.balance -= p
      paid += p
    }

    let remainingExtra = Math.max(0, totalPayBudget - paid)
    if (remainingExtra > 0) {
      const order = sortDebts(items.filter((d) => d.balance > 0), strategy)
      for (const d of order) {
        if (remainingExtra <= 0) break
        const p = Math.min(remainingExtra, d.balance)
        d.balance -= p
        remainingExtra -= p
      }
    }
  }

  return null
}

function simulatePayoffStatsFromValidatedItems(validatedItems, { strategy, extraMonthly } = {}) {
  const items = toEngineItems(validatedItems).map((d) => ({ ...d }))
  const monthlyExtra = Number(extraMonthly)
  const extra = Number.isFinite(monthlyExtra) && monthlyExtra > 0 ? monthlyExtra : 0

  if (items.length === 0) return null

  const totalMin = items.reduce((sum, d) => sum + d.minPayment, 0)
  const totalPayBudget = totalMin + extra
  if (totalPayBudget <= 0) return null

  const MAX_MONTHS = 900
  let months = 0
  let interestPaid = 0

  const totalBalance = () => items.reduce((sum, d) => sum + Math.max(0, d.balance), 0)

  while (months < MAX_MONTHS) {
    const remaining = totalBalance()
    if (remaining <= 0.01) return { months, interestPaid }

    months += 1

    const interestDue = items.reduce((sum, d) => {
      if (d.balance <= 0) return sum
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return sum
      return sum + d.balance * r
    }, 0)

    if (totalPayBudget <= interestDue + 1e-6) return null

    // Compound + record interest
    for (const d of items) {
      if (d.balance <= 0) continue
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return null
      const added = d.balance * r
      interestPaid += added
      d.balance = d.balance + added
    }

    // Pay minimums
    let paid = 0
    for (const d of items) {
      if (d.balance <= 0) continue
      const p = Math.min(d.minPayment, d.balance)
      d.balance -= p
      paid += p
    }

    // Extra
    let remainingExtra = Math.max(0, totalPayBudget - paid)
    if (remainingExtra > 0) {
      const order = sortDebts(items.filter((d) => d.balance > 0), strategy)
      for (const d of order) {
        if (remainingExtra <= 0) break
        const p = Math.min(remainingExtra, d.balance)
        d.balance -= p
        remainingExtra -= p
      }
    }
  }

  return null
}

function simulateTimelineFromValidatedItems(
  validatedItems,
  { strategy, extraMonthly, maxMonths = 240 } = {},
) {
  const items = toEngineItems(validatedItems).map((d) => ({ ...d }))
  const monthlyExtra = Number(extraMonthly)
  const extra = Number.isFinite(monthlyExtra) && monthlyExtra > 0 ? monthlyExtra : 0
  const cap = Number(maxMonths)
  const MAX = Number.isFinite(cap) ? Math.max(1, Math.min(900, Math.floor(cap))) : 240

  if (items.length === 0) return null

  const totalMin = items.reduce((sum, d) => sum + d.minPayment, 0)
  const totalPayBudget = totalMin + extra
  if (totalPayBudget <= 0) return null

  const points = []
  const totalBalance = () => items.reduce((sum, d) => sum + Math.max(0, d.balance), 0)

  points.push({ month: 0, balance: totalBalance() })

  for (let month = 1; month <= MAX; month += 1) {
    const remaining = totalBalance()
    if (remaining <= 0.01) {
      points.push({ month, balance: 0 })
      break
    }

    const interestDue = items.reduce((sum, d) => {
      if (d.balance <= 0) return sum
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return sum
      return sum + d.balance * r
    }, 0)

    if (totalPayBudget <= interestDue + 1e-6) return null

    for (const d of items) {
      if (d.balance <= 0) continue
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return null
      d.balance = d.balance * (1 + r)
    }

    let paid = 0
    for (const d of items) {
      if (d.balance <= 0) continue
      const p = Math.min(d.minPayment, d.balance)
      d.balance -= p
      paid += p
    }

    let remainingExtra = Math.max(0, totalPayBudget - paid)
    if (remainingExtra > 0) {
      const order = sortDebts(items.filter((d) => d.balance > 0), strategy)
      for (const d of order) {
        if (remainingExtra <= 0) break
        const p = Math.min(remainingExtra, d.balance)
        d.balance -= p
        remainingExtra -= p
      }
    }

    points.push({ month, balance: totalBalance() })
  }

  return points
}

function simulateTimelineDetailedFromValidatedItems(
  validatedItems,
  { strategy, extraMonthly, maxMonths = 240 } = {},
) {
  const items = toEngineItems(validatedItems).map((d) => ({ ...d }))
  const monthlyExtra = Number(extraMonthly)
  const extra = Number.isFinite(monthlyExtra) && monthlyExtra > 0 ? monthlyExtra : 0
  const cap = Number(maxMonths)
  const MAX = Number.isFinite(cap) ? Math.max(1, Math.min(900, Math.floor(cap))) : 240

  if (items.length === 0) return null

  const totalMin = items.reduce((sum, d) => sum + d.minPayment, 0)
  const totalPayBudget = totalMin + extra
  if (totalPayBudget <= 0) return null

  const points = []
  const totalBalance = () => items.reduce((sum, d) => sum + Math.max(0, d.balance), 0)
  const perDebt = () => {
    const out = {}
    for (const d of items) out[String(d.id)] = Math.max(0, d.balance)
    return out
  }

  points.push({ month: 0, balance: totalBalance(), perDebt: perDebt() })

  for (let month = 1; month <= MAX; month += 1) {
    const remaining = totalBalance()
    if (remaining <= 0.01) {
      points.push({ month, balance: 0, perDebt: perDebt() })
      break
    }

    const interestDue = items.reduce((sum, d) => {
      if (d.balance <= 0) return sum
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return sum
      return sum + d.balance * r
    }, 0)

    if (totalPayBudget <= interestDue + 1e-6) return null

    for (const d of items) {
      if (d.balance <= 0) continue
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return null
      d.balance = d.balance * (1 + r)
    }

    let paid = 0
    for (const d of items) {
      if (d.balance <= 0) continue
      const p = Math.min(d.minPayment, d.balance)
      d.balance -= p
      paid += p
    }

    let remainingExtra = Math.max(0, totalPayBudget - paid)
    if (remainingExtra > 0) {
      const order = sortDebts(items.filter((d) => d.balance > 0), strategy)
      for (const d of order) {
        if (remainingExtra <= 0) break
        const p = Math.min(remainingExtra, d.balance)
        d.balance -= p
        remainingExtra -= p
      }
    }

    points.push({ month, balance: totalBalance(), perDebt: perDebt() })
  }

  return points
}

function simulateTimelineDetailedScheduleFromValidatedItems(
  validatedItems,
  { strategy, extraSchedule, extraMonthlyDefault = 0, maxMonths = 240 } = {},
) {
  const items = toEngineItems(validatedItems).map((d) => ({ ...d }))
  const cap = Number(maxMonths)
  const MAX = Number.isFinite(cap) ? Math.max(1, Math.min(900, Math.floor(cap))) : 240

  if (items.length === 0) return null

  const totalMin = items.reduce((sum, d) => sum + d.minPayment, 0)
  if (totalMin <= 0) return null

  const schedule = extraSchedule && typeof extraSchedule === 'object' ? extraSchedule : {}
  const defaultExtraRaw = Number(extraMonthlyDefault)
  const defaultExtra = Number.isFinite(defaultExtraRaw) && defaultExtraRaw > 0 ? defaultExtraRaw : 0

  const extraForMonth = (month) => {
    const raw = Number(schedule[String(month)])
    if (Number.isFinite(raw) && raw >= 0) return raw
    return defaultExtra
  }

  const points = []
  const totalBalance = () => items.reduce((sum, d) => sum + Math.max(0, d.balance), 0)
  const perDebt = () => {
    const out = {}
    for (const d of items) out[String(d.id)] = Math.max(0, d.balance)
    return out
  }

  points.push({ month: 0, balance: totalBalance(), perDebt: perDebt() })

  for (let month = 1; month <= MAX; month += 1) {
    const remaining = totalBalance()
    if (remaining <= 0.01) {
      points.push({ month, balance: 0, perDebt: perDebt() })
      break
    }

    const extra = extraForMonth(month)
    const totalPayBudget = totalMin + extra
    if (totalPayBudget <= 0) return null

    const interestDue = items.reduce((sum, d) => {
      if (d.balance <= 0) return sum
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return sum
      return sum + d.balance * r
    }, 0)

    if (totalPayBudget <= interestDue + 1e-6) return null

    for (const d of items) {
      if (d.balance <= 0) continue
      const r = monthlyRateFromApr(d.apr)
      if (r == null) return null
      d.balance = d.balance * (1 + r)
    }

    let paid = 0
    for (const d of items) {
      if (d.balance <= 0) continue
      const p = Math.min(d.minPayment, d.balance)
      d.balance -= p
      paid += p
    }

    let remainingExtra = Math.max(0, totalPayBudget - paid)
    if (remainingExtra > 0) {
      const order = sortDebts(items.filter((d) => d.balance > 0), strategy)
      for (const d of order) {
        if (remainingExtra <= 0) break
        const p = Math.min(remainingExtra, d.balance)
        d.balance -= p
        remainingExtra -= p
      }
    }

    points.push({ month, balance: totalBalance(), perDebt: perDebt() })
  }

  return points
}

export function pickStrategy(debts) {
  const workingDebts = withEffectiveApr(debts)
  const validated = validateDebtsForCalcs(workingDebts)
  if (!validated.ok) {
    return {
      best: 'snowball',
      why: 'Snowball is recommended until your debts have complete APR, currency, and minimum payment data.',
    }
  }

  const baseDebts = validated.items
  const weightedAprPct = weightedAprPercent(baseDebts)
  if (weightedAprPct == null) {
    return { best: 'snowball', why: 'Snowball is recommended until APR is available for all debts.' }
  }

  const avMonths = simulatePayoffMonthsFromValidatedItems(baseDebts, {
    strategy: 'avalanche',
    extraMonthly: 0,
  })
  const snMonths = simulatePayoffMonthsFromValidatedItems(baseDebts, { strategy: 'snowball', extraMonthly: 0 })

  if (avMonths == null || snMonths == null) {
    // Payoff isn't feasible, but we still provide a deterministic recommendation.
    return {
      best: weightedAprPct > 20 ? 'avalanche' : 'snowball',
      why: weightedAprPct > 20
        ? 'Avalanche is recommended because your blended APR is high—focus on the most expensive interest first.'
        : 'Snowball is recommended to simplify and reduce the number of open debts faster.',
    }
  }

  if (avMonths === snMonths) {
    const tieBreak =
      weightedAprPct > 20
        ? 'Both strategies tie on payoff time—Avalanche is used as the tie-break when weighted APR is above 20%.'
        : 'Both strategies tie on payoff time—Snowball is used as the tie-break when weighted APR is 20% or below.'
    return {
      best: weightedAprPct > 20 ? 'avalanche' : 'snowball',
      why: tieBreak,
    }
  }

  if (avMonths < snMonths) {
    return {
      best: 'avalanche',
      why: 'Avalanche finishes sooner with your real APRs because it attacks the most expensive interest first.',
    }
  }

  return {
    best: 'snowball',
    why: 'Snowball finishes sooner with your real balances and APRs because it clears smaller debts faster and frees cashflow earlier.',
  }
}

export function simulatePayoffMonths(debts, { strategy, extraMonthly } = {}) {
  const workingDebts = withEffectiveApr(debts)
  const validated = validateDebtsForCalcs(workingDebts)
  if (!validated.ok) return null
  return simulatePayoffMonthsFromValidatedItems(validated.items, { strategy, extraMonthly })
}

export function simulatePayoffStats(debts, { strategy, extraMonthly } = {}) {
  const workingDebts = withEffectiveApr(debts)
  const validated = validateDebtsForCalcs(workingDebts)
  if (!validated.ok) return null
  return simulatePayoffStatsFromValidatedItems(validated.items, { strategy, extraMonthly })
}

export function simulatePayoffTimeline(debts, { strategy, extraMonthly, maxMonths } = {}) {
  const workingDebts = withEffectiveApr(debts)
  const validated = validateDebtsForCalcs(workingDebts)
  if (!validated.ok) return null
  return simulateTimelineFromValidatedItems(validated.items, { strategy, extraMonthly, maxMonths })
}

export function simulatePayoffTimelineDetailed(debts, { strategy, extraMonthly, maxMonths } = {}) {
  const workingDebts = withEffectiveApr(debts)
  const validated = validateDebtsForCalcs(workingDebts)
  if (!validated.ok) return null
  return simulateTimelineDetailedFromValidatedItems(validated.items, { strategy, extraMonthly, maxMonths })
}

export function simulatePayoffTimelineDetailedSchedule(
  debts,
  { strategy, extraSchedule, extraMonthlyDefault, maxMonths } = {},
) {
  const workingDebts = withEffectiveApr(debts)
  const validated = validateDebtsForCalcs(workingDebts)
  if (!validated.ok) return null
  return simulateTimelineDetailedScheduleFromValidatedItems(validated.items, {
    strategy,
    extraSchedule,
    extraMonthlyDefault,
    maxMonths,
  })
}

export function simulateDebts(debts, { strategy, extraMonthly, maxMonths } = {}) {
  const workingDebts = withEffectiveApr(debts)
  const validated = validateDebtsForCalcs(workingDebts)
  if (!validated.ok) return null

  const stats = simulatePayoffStatsFromValidatedItems(validated.items, { strategy, extraMonthly })
  const timeline = simulateTimelineFromValidatedItems(validated.items, { strategy, extraMonthly, maxMonths })
  const timelineDetailed = simulateTimelineDetailedFromValidatedItems(validated.items, {
    strategy,
    extraMonthly,
    maxMonths,
  })

  return { stats, timeline, timelineDetailed }
}

export function computeRisk(debts) {
  const workingDebts = withEffectiveApr(debts)
  const validated = validateDebtsForCalcs(workingDebts)
  if (!validated.ok) return null

  const items = validated.items
  const totalDebt = items.reduce((s, d) => s + d.amount, 0)
  const totalMin = items.reduce((s, d) => s + d.min_payment, 0)

  const weightedAprPct =
    totalDebt > 0
      ? items.reduce((s, d) => {
          const pct = aprPercentForUi(d.apr)
          if (pct == null) return s
          return s + (d.amount / totalDebt) * pct
        }, 0)
      : null

  if (!Number.isFinite(weightedAprPct)) return null

  // (1) High APR increases risk heavily, especially above 20%.
  const aprExcess = Math.max(0, weightedAprPct - 20)
  const aprScore = clamp(weightedAprPct * 1.2 + aprExcess * 2.2, 0, 85)

  // (2) High total debt increases risk (log-scaled, saturating).
  const debtScore = clamp(Math.log10(totalDebt) * 22, 0, 55)

  // (3) Low minimum-payment coverage increases risk.
  // Coverage = (annualized minimum payments) / principal.
  const coverage = totalDebt > 0 ? (totalMin * 12) / totalDebt : null
  const coverageScore = coverage == null ? 0 : clamp((1 / coverage) * 140, 0, 85)

  const score = clamp(Math.round(aprScore * 0.55 + debtScore * 0.25 + coverageScore * 0.2), 5, 95)

  let level = 'low'
  if (score >= 70) level = 'high'
  else if (score >= 40) level = 'medium'

  const label = level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low'
  return {
    level,
    score,
    label,
    weightedAprPct,
    coverage,
    totalDebt,
    totalMin,
    aprScore,
    debtScore,
    coverageScore,
    driver: dominantDriverKey({ aprScore, debtScore, coverageScore }),
  }
}

export function explainDebtIntelligence(debts) {
  const debtsCopy = withEffectiveApr(debts)
  const validated = validateDebtsForCalcs(debtsCopy)
  if (!validated.ok) {
    const msg =
      validated.issues && validated.issues.length > 0
        ? validated.issues.map(String).join(' ')
        : `Portfolio has ${debts.length} debt rows, but required fields/currency rules aren’t satisfied yet.`
    return {
      ok: false,
      currency: null,
      insights: [
        { key: 'risk', title: 'Risk', body: msg },
        { key: 'strategy', title: 'Strategy', body: msg },
        { key: 'savings', title: 'Savings', body: msg },
      ],
    }
  }

  const currency = validated.currency ?? null

  const risk = computeRisk(debtsCopy)
  const strategy = pickStrategy(debtsCopy)

  const baselineMonths =
    strategy.best == null
      ? null
      : simulatePayoffMonths(debtsCopy, { strategy: strategy.best, extraMonthly: 0 })
  const plusMonths =
    strategy.best == null
      ? null
      : simulatePayoffMonths(debtsCopy, { strategy: strategy.best, extraMonthly: 100 })
  const monthsSaved =
    baselineMonths == null || plusMonths == null ? null : Math.max(0, baselineMonths - plusMonths)

  const riskBody =
    risk == null
      ? String(strategy.why ?? '').trim()
      : (() => {
          const wApr = fmtPct1(risk.weightedAprPct)
          const debt = fmtMoneyCompact(risk.totalDebt)
          const covPct = fmtPct1((risk.coverage ?? 0) * 100)
          const driver = risk.driver

          if (risk.level === 'low') {
            if (driver === 'apr') return `Your risk reads low mostly from rates—blended APR is ${wApr}.`
            if (driver === 'debt') return `Your risk reads low mostly from size—total balances are ${debt}.`
            return `Your risk reads low mostly from cashflow cushion—minimums cover ${covPct} of balances annually.`
          }

          if (risk.level === 'medium') {
            if (driver === 'apr') return `Your risk reads medium mostly from rates—blended APR is ${wApr}.`
            if (driver === 'debt') return `Your risk reads medium mostly from size—total balances are ${debt}.`
            return `Your risk reads medium mostly from cushion—minimums cover ${covPct} of balances annually.`
          }

          if (driver === 'apr') return `Your risk reads high mostly from rates—blended APR is ${wApr}.`
          if (driver === 'debt') return `Your risk reads high mostly from size—total balances are ${debt}.`
          return `Your risk reads high mostly from cushion—minimums cover ${covPct} of balances annually.`
        })()

  const strategyBody =
    strategy.best == null
      ? String(strategy.why ?? 'Strategy can’t be recommended yet.')
      : `${strategy.best === 'avalanche' ? 'Avalanche' : 'Snowball'}: ${String(strategy.why ?? '').trim()}`

  const savingsBody =
    baselineMonths == null || plusMonths == null || monthsSaved == null
      ? 'Extra-payment savings can’t be shown yet because the payoff months didn’t compute for your current inputs.'
      : monthsSaved === 0
        ? `In the model, an extra payment didn’t reduce payoff months (${baselineMonths} months either way).`
        : `In the model, an extra payment moves payoff from ${baselineMonths} months to ${plusMonths} months (${monthsSaved} fewer).`

  return {
    ok: true,
    currency,
    insights: [
      { key: 'risk', title: 'Risk', body: riskBody },
      { key: 'strategy', title: 'Strategy', body: strategyBody },
      { key: 'savings', title: 'Savings', body: savingsBody },
    ],
    engine: {
      risk,
      strategy,
      payoff: { baselineMonths, plusMonths, monthsSaved },
    },
  }
}
