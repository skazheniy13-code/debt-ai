function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

/**
 * @typedef {Object} Debt
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} balance
 * @property {number} apr
 * @property {number} minPayment
 */

/**
 * @typedef {'avalanche'|'snowball'} StrategyId
 */

/**
 * @param {Debt[]} debts
 * @returns {Debt[]}
 */
export function normalizeDebts(debts) {
  return debts.map((d) => ({
    ...d,
    balance: Number.isFinite(d.balance) ? Math.max(0, d.balance) : 0,
    apr: Number.isFinite(d.apr) ? Math.max(0, d.apr) : 0,
    minPayment: Number.isFinite(d.minPayment) ? Math.max(0, d.minPayment) : 0,
  }))
}

/**
 * @param {Debt[]} debts
 */
export function calculateTotals(debts) {
  const items = normalizeDebts(debts)
  const totalDebt = items.reduce((s, d) => s + d.balance, 0)
  const monthlyMin = items.reduce((s, d) => s + d.minPayment, 0)
  const weightedApr =
    totalDebt <= 0 ? 0 : items.reduce((s, d) => s + d.balance * d.apr, 0) / totalDebt

  return { totalDebt, monthlyMin, weightedApr }
}

/**
 * @param {Debt[]} debts
 */
export function calculateRiskScore(debts) {
  const { totalDebt, monthlyMin, weightedApr } = calculateTotals(debts)

  // Heuristic: more debt + higher APR + higher min payment ratio => higher risk.
  const debtScore = clamp((totalDebt / 45000) * 55, 0, 55)
  const aprScore = clamp((weightedApr / 28) * 30, 0, 30)
  const minRatio = totalDebt <= 0 ? 0 : monthlyMin / totalDebt
  const burdenScore = clamp((minRatio / 0.05) * 15, 0, 15)

  return Math.round(clamp(debtScore + aprScore + burdenScore, 0, 100))
}

/**
 * @param {Debt[]} debts
 * @param {StrategyId} strategy
 * @returns {Debt[]}
 */
export function orderDebts(debts, strategy) {
  const items = normalizeDebts(debts).slice()

  if (strategy === 'snowball') {
    return items.sort((a, b) => {
      if (a.balance !== b.balance) return a.balance - b.balance
      return b.apr - a.apr
    })
  }

  // avalanche
  return items.sort((a, b) => {
    if (a.apr !== b.apr) return b.apr - a.apr
    return b.balance - a.balance
  })
}

/**
 * @param {Debt[]} debts
 * @param {StrategyId} strategy
 * @returns {Debt | null}
 */
export function pickTargetDebt(debts, strategy) {
  const ordered = orderDebts(
    debts.filter((d) => (Number.isFinite(d.balance) ? d.balance : 0) > 0.01),
    strategy,
  )
  return ordered[0] ?? null
}

/**
 * @typedef {Object} PayoffResult
 * @property {number} months
 * @property {number} interestPaid
 * @property {Date} payoffDate
 * @property {boolean} paidOff
 * @property {number} initialTotal
 * @property {StrategyId} strategy
 */

/**
 * Simulate payoff by:
 * - accruing interest monthly
 * - paying minimums to all balances
 * - applying extra payment to a target order (avalanche/snowball)
 *
 * @param {Debt[]} debts
 * @param {{ extraPayment: number, strategy: StrategyId, startDate?: Date, maxMonths?: number }} params
 * @returns {PayoffResult}
 */
export function simulatePayoff(debts, params) {
  const start = params.startDate ?? new Date()
  const maxMonths = params.maxMonths ?? 600
  const strategy = params.strategy
  const extraPayment = Math.max(0, params.extraPayment ?? 0)

  const items = orderDebts(
    normalizeDebts(debts).map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      apr: d.apr,
      minPayment: d.minPayment,
      balance: d.balance,
      originalBalance: d.balance,
    })),
    strategy,
  )

  const initialTotal = items.reduce((s, d) => s + d.balance, 0)

  let months = 0
  let interestPaid = 0

  while (months < maxMonths && items.some((d) => d.balance > 0.01)) {
    months += 1

    // 1) Interest accrues
    for (const d of items) {
      if (d.balance <= 0) continue
      const monthlyRate = d.apr / 100 / 12
      const interest = d.balance * monthlyRate
      d.balance += interest
      interestPaid += interest
    }

    // 2) Minimum payments
    for (const d of items) {
      if (d.balance <= 0) continue
      const pay = Math.min(d.balance, d.minPayment)
      d.balance -= pay
    }

    // 3) Extra payment in strategy order
    let remainingExtra = extraPayment
    for (const d of items) {
      if (remainingExtra <= 0) break
      if (d.balance <= 0) continue
      const pay = Math.min(d.balance, remainingExtra)
      d.balance -= pay
      remainingExtra -= pay
    }
  }

  const payoffDate = new Date(start)
  payoffDate.setMonth(payoffDate.getMonth() + months)

  const remaining = items.reduce((s, d) => s + Math.max(0, d.balance), 0)
  const paidOff = remaining <= 0.05

  return {
    months,
    interestPaid,
    payoffDate,
    paidOff,
    initialTotal,
    strategy,
  }
}

export function formatMonths(months) {
  const m = Math.max(0, Math.round(months))
  if (m >= 12) return `${Math.floor(m / 12)}y ${m % 12}m`
  return `${m}m`
}

export function compareToBaseline(baseline, current) {
  const monthsGained = clamp(baseline.months - current.months, -999, 999)
  const interestSaved = baseline.interestPaid - current.interestPaid
  return { monthsGained, interestSaved }
}

