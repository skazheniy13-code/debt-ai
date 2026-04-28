import { useMemo } from 'react'
import {
  calculateRiskScore,
  calculateTotals,
  compareToBaseline,
  pickTargetDebt,
  simulatePayoff,
} from '../engine/debtEngine.js'
import { generateAdvice } from '../engine/aiAdvisor.js'
import { generateScenarios } from '../engine/scenarioEngine.js'

export function useDebtCalculator({ debts, extraPayment, strategy }) {
  const startDate = useMemo(() => new Date(), [])

  const totals = useMemo(() => calculateTotals(debts), [debts])
  const riskScore = useMemo(() => calculateRiskScore(debts), [debts])

  const debtsView = useMemo(() => {
    const maxBalance = Math.max(1, ...debts.map((d) => d.balance))
    const maxApr = Math.max(1, ...debts.map((d) => d.apr))
    const maxMin = Math.max(1, ...debts.map((d) => d.minPayment))

    const items = debts.map((d) => {
      const ratioPct =
        d.balance <= 0 ? null : Math.round((d.minPayment / d.balance) * 1000) / 10
      return {
        ...d,
        minRatioPct: ratioPct,
        minRatioLabel: ratioPct == null ? '—' : `${ratioPct}%/mo`,
      }
    })

    return {
      items,
      maxBalance,
      maxApr,
      maxMin,
      byBalanceDesc: items.slice().sort((a, b) => b.balance - a.balance),
      byMinDesc: items.slice().sort((a, b) => b.minPayment - a.minPayment),
    }
  }, [debts])

  const baseline = useMemo(
    () =>
      simulatePayoff(debts, {
        extraPayment: 0,
        strategy,
        startDate,
      }),
    [debts, strategy, startDate],
  )

  const current = useMemo(
    () =>
      simulatePayoff(debts, {
        extraPayment,
        strategy,
        startDate,
      }),
    [debts, extraPayment, strategy, startDate],
  )

  const comparison = useMemo(
    () => compareToBaseline(baseline, current),
    [baseline, current],
  )

  const targetDebt = useMemo(
    () => pickTargetDebt(debts, strategy),
    [debts, strategy],
  )

  const advice = useMemo(
    () =>
      generateAdvice({
        debts,
        strategy,
        extraPayment,
        results: {
          baseline,
          current,
          targetDebt,
          riskScore,
        },
      }),
    [debts, strategy, extraPayment, baseline, current, targetDebt, riskScore],
  )

  const scenarioCards = useMemo(() => {
    const scenarios = generateScenarios({ debts })

    const fastestMonths = Math.min(...scenarios.map((s) => s.payoffMonths))
    const cheapestInterest = Math.min(...scenarios.map((s) => s.interestPaid))
    const maxMonths = Math.max(...scenarios.map((s) => s.payoffMonths), 1)

    return scenarios.map((s) => {
      const isFastest = s.payoffMonths === fastestMonths
      const isCheapest = s.interestPaid === cheapestInterest
      const isBest = isFastest || isCheapest

      let badge = null
      if (isFastest && isCheapest) badge = 'BEST'
      else if (isFastest) badge = 'FASTEST'
      else if (isCheapest) badge = 'CHEAPEST'

      return {
        ...s,
        badge,
        isBest,
        barPct: (s.payoffMonths / maxMonths) * 100,
      }
    })
  }, [debts])

  return {
    totalDebt: totals.totalDebt,
    monthlyMin: totals.monthlyMin,
    weightedApr: totals.weightedApr,

    debtsView,

    payoffTime: current.months,
    payoffDate: current.payoffDate,
    baselinePayoffTime: baseline.months,

    interestSaved: comparison.interestSaved,
    monthsGained: comparison.monthsGained,

    strategyResult: {
      strategy,
      baseline,
      current,
      targetDebt,
      riskScore,
    },

    advisor: advice,

    scenarios: scenarioCards,
  }
}

