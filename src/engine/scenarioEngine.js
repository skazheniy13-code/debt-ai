import { simulatePayoff } from './debtEngine.js'

/**
 * generateScenarios({ debts })
 *
 * IMPORTANT: uses existing debtEngine logic only (no duplicated math).
 */
export function generateScenarios({ debts }) {
  const startDate = new Date()

  const baseline = simulatePayoff(debts, {
    extraPayment: 0,
    strategy: 'avalanche',
    startDate,
  })

  const s200 = simulatePayoff(debts, {
    extraPayment: 200,
    strategy: 'avalanche',
    startDate,
  })

  const s500 = simulatePayoff(debts, {
    extraPayment: 500,
    strategy: 'avalanche',
    startDate,
  })

  const toScenario = (name, result) => ({
    name,
    payoffMonths: result.months,
    interestPaid: result.interestPaid,
    savingsVsBaseline: baseline.interestPaid - result.interestPaid,
  })

  return [
    toScenario('Baseline (minimums)', baseline),
    toScenario('+200/mo (avalanche)', s200),
    toScenario('+500/mo (aggressive)', s500),
  ]
}

