function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function formatMoney(amount) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * generateAdvice({ debts, strategy, extraPayment, results })
 *
 * results is expected to include:
 * - baseline: { months, interestPaid }
 * - current: { months, interestPaid }
 * - targetDebt: Debt | null
 * - riskScore?: number
 */
export function generateAdvice({ debts, strategy, extraPayment, results }) {
  const safeDebts = Array.isArray(debts) ? debts : []
  const activeDebts = safeDebts.filter((d) => (d?.balance ?? 0) > 0.01)

  const maxAprDebt = activeDebts
    .slice()
    .sort((a, b) => (b.apr ?? 0) - (a.apr ?? 0))[0]

  const hasHighApr = (maxAprDebt?.apr ?? 0) >= 20
  const manyDebts = activeDebts.length >= 4

  const onlyMinimums = (extraPayment ?? 0) <= 0

  const baselineMonths = results?.baseline?.months ?? null
  const currentMonths = results?.current?.months ?? null
  const monthsSaved =
    baselineMonths == null || currentMonths == null
      ? 0
      : clamp(baselineMonths - currentMonths, -999, 999)

  const baselineInterest = results?.baseline?.interestPaid ?? null
  const currentInterest = results?.current?.interestPaid ?? null
  const interestSaved =
    baselineInterest == null || currentInterest == null
      ? 0
      : baselineInterest - currentInterest

  const utilizationProxy = (() => {
    // Mock proxy: credit-card heavy & high APR tends to correlate with high utilization.
    const cc = activeDebts.filter((d) => (d.type ?? '').toLowerCase().includes('credit'))
    const ccBal = cc.reduce((s, d) => s + (d.balance ?? 0), 0)
    const total = activeDebts.reduce((s, d) => s + (d.balance ?? 0), 0)
    if (total <= 0) return 0
    return ccBal / total
  })()

  const missingAutopay = (() => {
    // We don't have real autopay data; simulate via a simple heuristic:
    // if there are 3+ debts, assume autopay isn't fully set up yet.
    return activeDebts.length >= 3
  })()

  const riskFlags = {
    highApr: hasHighApr,
    highUtilization: utilizationProxy >= 0.65,
    missingAutopay,
  }

  const riskScoreLike =
    (riskFlags.highApr ? 40 : 0) +
    (riskFlags.highUtilization ? 35 : 0) +
    (riskFlags.missingAutopay ? 25 : 0)

  /** @type {'low'|'medium'|'high'} */
  const riskLevel =
    riskScoreLike >= 70 ? 'high' : riskScoreLike >= 40 ? 'medium' : 'low'

  const target = results?.targetDebt ?? null
  const targetName = target?.name ?? (maxAprDebt?.name ?? 'your top-priority debt')

  const insights = []
  const actions = []

  if (hasHighApr && maxAprDebt) {
    insights.push(
      `You’re carrying a high-APR balance (${maxAprDebt.name} at ${(maxAprDebt.apr ?? 0).toFixed(
        2,
      )}%). That’s likely your biggest interest lever.`,
    )
    actions.push(`Prioritize extra payments to ${maxAprDebt.name} until the balance is meaningfully lower.`)
  }

  if (onlyMinimums) {
    insights.push(
      'Paying only the minimums usually keeps you in the interest cycle longer—progress feels slow even when you’re doing everything “right”.',
    )
    actions.push('If possible, add even a small monthly extra payment to accelerate payoff and reduce interest.')
  }

  if (monthsSaved >= 6) {
    insights.push(
      `Your extra payment is working: you’re on track to finish about ${monthsSaved} months sooner than baseline.`,
    )
  } else if (monthsSaved >= 2) {
    insights.push(`You’re shaving off time—about ${monthsSaved} months faster than baseline.`)
  } else if (extraPayment > 0) {
    insights.push(
      'Your extra payment helps, but the biggest wins come from consistently targeting one balance until it’s cleared.',
    )
  }

  if (interestSaved > 500) {
    actions.push(`Stay consistent—this plan can save roughly ${formatMoney(interestSaved)} in interest.`)
  }

  if (manyDebts) {
    insights.push(
      `With ${activeDebts.length} active debts, reducing complexity can be as valuable as reducing APR.`,
    )
    if (strategy !== 'snowball') {
      actions.push('If motivation matters, try Snowball for faster early wins and fewer monthly bills.')
    }
  }

  if (riskFlags.missingAutopay) {
    actions.push('Turn on autopay for minimums across all debts to prevent late fees and credit score hits.')
  }

  if (riskFlags.highUtilization) {
    insights.push(
      'A large share of your debt appears to be revolving credit. Bringing those balances down can quickly improve flexibility.',
    )
    actions.push('Aim to reduce revolving balances first—this tends to lower risk the fastest.')
  }

  // Summary: calm, fintech tone, one paragraph.
  const strategyWord = strategy === 'snowball' ? 'Snowball' : 'Avalanche'
  const payoffLine =
    monthsSaved >= 2
      ? `You’re trending ${monthsSaved} months faster with your current extra payment.`
      : extraPayment > 0
        ? 'You’re building momentum with extra payments—keep it consistent.'
        : 'You’re stable on minimums, but the payoff timeline will stay longer without extra principal.'

  const summary = `Using ${strategyWord}, the best next step is to focus on ${targetName}. ${payoffLine}`

  // Keep UI concise: 2–3 insights, 2–4 actions.
  const finalInsights = insights.slice(0, 3)
  const finalActions = actions
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 4)

  if (finalInsights.length === 0) {
    finalInsights.push('You’re in a good spot to optimize—choose one priority and execute consistently for 90 days.')
  }
  if (finalActions.length === 0) {
    finalActions.push('Pick one target balance and keep payments steady; small consistency beats occasional spikes.')
  }

  return {
    summary,
    insights: finalInsights,
    riskLevel,
    actions: finalActions,
  }
}

