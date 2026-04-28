import * as debtEngine from './debtIntelligence.js'
import { validateDebtsForCalcs } from './debtValidation.js'

function cloneDebtsInput(debts) {
  if (!Array.isArray(debts)) return []
  return debts.map((d) => ({ ...(d ?? {}) }))
}

function safeStructuredClone(value) {
  try {
    if (typeof structuredClone === 'function') return structuredClone(value)
  } catch {
    // fall through
  }
  // Fallback for plain data (debts are plain JSON objects)
  return JSON.parse(JSON.stringify(value ?? null))
}

export function getDebtEngine() {
  return debtEngine ?? null
}

export function safeExplainDebtIntelligence(debts) {
  const explain = debtEngine?.explainDebtIntelligence
  if (typeof explain !== 'function') {
    return {
      ok: false,
      currency: null,
      insights: [],
      engine: {
        risk: null,
        strategy: { best: null, why: '' },
        payoff: { baselineMonths: null, plusMonths: null, monthsSaved: null },
      },
      meta: { engineMissing: true, error: null },
    }
  }

  try {
    const result = explain(cloneDebtsInput(debts))
    return {
      ok: Boolean(result?.ok),
      currency: result?.currency ?? null,
      insights: Array.isArray(result?.insights) ? result.insights : [],
      engine: result?.engine ?? {
        risk: null,
        strategy: { best: null, why: '' },
        payoff: { baselineMonths: null, plusMonths: null, monthsSaved: null },
      },
      meta: { engineMissing: false, error: null },
    }
  } catch (err) {
    return {
      ok: false,
      currency: null,
      insights: [],
      engine: {
        risk: null,
        strategy: { best: null, why: '' },
        payoff: { baselineMonths: null, plusMonths: null, monthsSaved: null },
      },
      meta: { engineMissing: false, error: err },
    }
  }
}

export function safeValidateDebtsForCalcs(debts) {
  try {
    return validateDebtsForCalcs(cloneDebtsInput(debts))
  } catch {
    return { ok: false, issues: ['Validation failed'], items: [] }
  }
}

export function safeSimulatePayoffTimeline(debts, params) {
  const fn = debtEngine?.simulatePayoffTimeline
  if (typeof fn !== 'function') return null
  try {
    const data = fn(cloneDebtsInput(debts), params)
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

export function safeSimulatePayoffTimelineDetailed(debts, params) {
  const fn = debtEngine?.simulatePayoffTimelineDetailed
  if (typeof fn !== 'function') return null
  try {
    const data = fn(cloneDebtsInput(debts), params)
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

export function safeSimulatePayoffTimelineDetailedSchedule(debts, params) {
  const fn = debtEngine?.simulatePayoffTimelineDetailedSchedule
  if (typeof fn !== 'function') return null
  try {
    const data = fn(cloneDebtsInput(debts), params)
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

export function safeSimulatePayoffStats(debts, params) {
  const fn = debtEngine?.simulatePayoffStats
  if (typeof fn !== 'function') return null
  try {
    const data = fn(cloneDebtsInput(debts), params)
    if (!data) return null
    const months = Number(data.months)
    const interestPaid = Number(data.interestPaid)
    if (!Number.isFinite(months) || months < 0) return null
    if (!Number.isFinite(interestPaid) || interestPaid < 0) return null
    return { months: Math.floor(months), interestPaid }
  } catch {
    return null
  }
}

export function safeSimulateDebts(debts, params) {
  const fn = debtEngine?.simulateDebts
  if (typeof fn !== 'function') return null
  try {
    const working = safeStructuredClone(debts)
    const out = fn(working, params)
    if (!out) return null
    const stats = out.stats
    const timeline = out.timeline
    const timelineDetailed = out.timelineDetailed

    const safeStats =
      stats &&
      Number.isFinite(Number(stats.months)) &&
      Number(stats.months) >= 0 &&
      Number.isFinite(Number(stats.interestPaid)) &&
      Number(stats.interestPaid) >= 0
        ? { months: Math.floor(Number(stats.months)), interestPaid: Number(stats.interestPaid) }
        : null

    const safeTimeline = Array.isArray(timeline) ? timeline : null
    const safeTimelineDetailed = Array.isArray(timelineDetailed) ? timelineDetailed : null

    return { stats: safeStats, timeline: safeTimeline, timelineDetailed: safeTimelineDetailed }
  } catch {
    return null
  }
}
