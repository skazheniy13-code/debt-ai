import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useUserDebts } from '../hooks/useUserDebts.js'
import { UserDebtsPanel } from '../components/UserDebtsPanel.jsx'
import { SupabaseDebtSummary } from '../components/SupabaseDebtSummary.jsx'
import { AIDebtIntelligenceCard } from '../components/AIDebtIntelligenceCard.jsx'
import {
  getDebtEngine,
  safeExplainDebtIntelligence,
  safeSimulateDebts,
  safeSimulatePayoffTimelineDetailedSchedule,
  safeValidateDebtsForCalcs,
} from '../engine/safeDebtEngine.js'
import { DebtTimelineChart } from '../components/DebtTimelineChart.jsx'
import { DebtFreedomProgress } from '../components/DebtFreedomProgress.jsx'
import { DebtProjectionKpis } from '../components/DebtProjectionKpis.jsx'
import { WhatIfExtraPayment } from '../components/WhatIfExtraPayment.jsx'
import { MonthlyPaymentLog } from '../components/MonthlyPaymentLog.jsx'
import { DailyFreedomMessage } from '../components/DailyFreedomMessage.jsx'
import { DebtFreedomStory } from '../components/DebtFreedomStory.jsx'
import { DailyInsightCard } from '../components/DailyInsightCard.jsx'
import { WeeklySummaryCard } from '../components/WeeklySummaryCard.jsx'
import { NextBestActionCard } from '../components/NextBestActionCard.jsx'
import { CoreMetricsRow } from '../components/CoreMetricsRow.jsx'
import { UpgradeCtaCard } from '../components/UpgradeCtaCard.jsx'
import { useProStatus } from '../hooks/useProStatus.js'
import { unlockPro } from '../lib/unlockPro.js'

export function Dashboard({ session }) {
  const supabaseReady = Boolean(supabase)

  const userId = session?.user?.id ?? null
  const userEmail = session?.user?.email ?? null
  const userDebts = useUserDebts({ userId })
  const pro = useProStatus({ email: userEmail })

  // SINGLE SOURCE OF TRUTH
  const debts = useMemo(() => userDebts.debts ?? [], [userDebts.debts])
  const stableDebts = debts

  // Recommended: memoize engine (do not depend on it)
  const engine = useMemo(() => getDebtEngine(), [])
  const intel = useMemo(() => {
    if (!engine) {
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
    return safeExplainDebtIntelligence(stableDebts)
  }, [stableDebts])

  // Raw totals from Supabase snapshot (principal-only).
  const totalDebt = useMemo(() => stableDebts.reduce((sum, d) => sum + Number(d?.amount || 0), 0), [stableDebts])
  const totalMinPayment = useMemo(
    () => stableDebts.reduce((sum, d) => sum + Number(d?.min_payment || 0), 0),
    [stableDebts],
  )
  const count = stableDebts.length

  const validated = safeValidateDebtsForCalcs(stableDebts)

  const safeDbTotalDebt = Number.isFinite(totalDebt) ? totalDebt : 0
  const safeTotalMin = Number.isFinite(totalMinPayment) ? totalMinPayment : 0
  const safeCount = Number.isFinite(count) ? count : 0
  const currency = validated.ok ? validated.currency : null

  const startDebtStorageKey = userId ? `debt-ai:startDebt:${userId}` : null
  const [startDebt, setStartDebt] = useState(null)

  useEffect(() => {
    if (!startDebtStorageKey) return
    if (!Number.isFinite(safeDbTotalDebt) || safeDbTotalDebt <= 0) return

    const storedRaw = localStorage.getItem(startDebtStorageKey)
    const stored = storedRaw == null ? null : Number(storedRaw)

    // If no stored baseline, set it. If debt increased (new debt added), raise baseline.
    const next =
      stored == null || !Number.isFinite(stored)
        ? safeDbTotalDebt
        : Math.max(stored, safeDbTotalDebt)

    if (startDebt !== next) {
      setStartDebt(next)
      localStorage.setItem(startDebtStorageKey, String(next))
    }
  }, [startDebtStorageKey, safeDbTotalDebt, startDebt])

  const [extraPayment, setExtraPayment] = useState(0)
  const isPro = Boolean(pro?.isPro)
  const [upgradeBusy, setUpgradeBusy] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')

  async function handleUpgrade() {
    if (upgradeBusy) return
    setUpgradeError('')
    setUpgradeBusy(true)
    try {
      await unlockPro(userEmail)
    } catch (e) {
      setUpgradeError(e?.message ?? 'Upgrade failed')
      setUpgradeBusy(false)
    }
  }

  // Single source of truth for engine behavior.
  const effectiveExtraMonthly = isPro ? extraPayment : 0
  const bestCaseExtraMonthly = isPro ? 500 : 0

  const strategy = intel?.engine?.strategy?.best ?? 'avalanche'
  const [monthlyPaid, setMonthlyPaid] = useState(0)
  const [payments, setPayments] = useState([])

  const immediatePaymentNow = useMemo(() => {
    const dNow = new Date()
    const nowKey = `${dNow.getFullYear()}-${String(dNow.getMonth() + 1).padStart(2, '0')}`

    const safeAmount = (n) => {
      const x = Number(n)
      return Number.isFinite(x) && x > 0 ? x : 0
    }

    const monthlyRateFromApr = (apr) => {
      const a = Number(apr)
      if (!Number.isFinite(a) || a < 0) return 0
      if (a <= 1) return a / 12
      return a / 100 / 12
    }

    // Payments for the current period:
    // - If payment has debtId => apply ONLY to that debt.
    // - If payment has no debtId => "All debts (auto)" pool (min + strategy allocation).
    const monthPayments = (Array.isArray(payments) ? payments : []).filter(
      (p) => String(p?.key ?? '') === nowKey,
    )

    const paidTotalAll = monthPayments.reduce((s, p) => s + safeAmount(p?.amount), 0)
    const paidAutoPool = monthPayments
      .filter((p) => p?.debtId == null)
      .reduce((s, p) => s + safeAmount(p?.amount), 0)

    const paidByDebt = monthPayments.reduce((acc, p) => {
      const id = p?.debtId == null ? null : String(p.debtId)
      if (!id) return acc
      acc[id] = (acc[id] ?? 0) + safeAmount(p?.amount)
      return acc
    }, {})

    if (!(paidTotalAll > 0) || stableDebts.length === 0) {
      const byId = {}
      for (const d of stableDebts) byId[String(d?.id)] = safeAmount(d?.amount)
      return { byId, total: safeDbTotalDebt, paidApplied: 0 }
    }

    const items = stableDebts.map((d) => ({
      id: String(d?.id),
      balance: safeAmount(d?.amount),
      apr: d?.apr,
      minPayment: safeAmount(d?.min_payment),
    }))

    // Apply debt-specific payments first (do not spread across other debts).
    for (const it of items) {
      const pay = safeAmount(paidByDebt[it.id])
      if (!(pay > 0) || it.balance <= 0) continue
      const p = Math.min(pay, it.balance)
      it.balance -= p
    }

    const totalMin = items.reduce((s, d) => s + d.minPayment, 0)
    const minPaidBudget = totalMin > 0 ? Math.min(paidAutoPool, totalMin) : 0
    const minScale = totalMin > 0 ? minPaidBudget / totalMin : 0

    // Apply minimums proportionally if user paid less than total minimum.
    for (const d of items) {
      if (d.balance <= 0) continue
      const p = Math.min(d.balance, d.minPayment * minScale)
      d.balance -= p
    }

    const order =
      strategy === 'snowball'
        ? [...items].sort(
            (a, b) =>
              a.balance - b.balance ||
              monthlyRateFromApr(b.apr) - monthlyRateFromApr(a.apr) ||
              String(a.id).localeCompare(String(b.id)),
          )
        : [...items].sort((a, b) => {
            const rb = monthlyRateFromApr(b.apr)
            const ra = monthlyRateFromApr(a.apr)
            if (rb !== ra) return rb - ra
            if (b.balance !== a.balance) return b.balance - a.balance
            return String(a.id).localeCompare(String(b.id))
          })

    let remainingExtra = Math.max(0, paidAutoPool - minPaidBudget)
    for (const d of order) {
      if (remainingExtra <= 0) break
      const p = Math.min(remainingExtra, d.balance)
      d.balance -= p
      remainingExtra -= p
    }

    const byId = {}
    let total = 0
    for (const d of items) {
      byId[String(d.id)] = Math.max(0, d.balance)
      total += Math.max(0, d.balance)
    }

    const extraApplied = Math.max(0, paidAutoPool - minPaidBudget) - remainingExtra

    const debtSpecificApplied = items.reduce((s, it) => {
      const amt = safeAmount(paidByDebt[it.id])
      if (!(amt > 0)) return s
      const before = safeAmount(stableDebts.find((x) => String(x?.id) === String(it.id))?.amount)
      return s + Math.min(before, amt)
    }, 0)

    const autoApplied = minPaidBudget + extraApplied
    const totalApplied = debtSpecificApplied + autoApplied
    return { byId, total, paidApplied: totalApplied }
  }, [stableDebts, payments, strategy, safeDbTotalDebt])

  // Displayed "current debt" includes this month's paid amount (local log).
  const safeTotalDebt = useMemo(() => {
    const t = Number(immediatePaymentNow?.total)
    return Number.isFinite(t) && t >= 0 ? t : safeDbTotalDebt
  }, [immediatePaymentNow?.total, safeDbTotalDebt])

  useEffect(() => {
    console.log('DB TOTAL:', safeDbTotalDebt, 'DISPLAY TOTAL:', safeTotalDebt)
  }, [safeDbTotalDebt, safeTotalDebt])
  const payoffBaseline = useMemo(
    () => safeSimulateDebts(stableDebts, { strategy, extraMonthly: 0, maxMonths: 240 }),
    [stableDebts, strategy],
  )
  const payoffExtra = useMemo(
    () => safeSimulateDebts(stableDebts, { strategy, extraMonthly: effectiveExtraMonthly, maxMonths: 240 }),
    [stableDebts, strategy, effectiveExtraMonthly, isPro],
  )

  useEffect(() => {
    if (!userId) return
    const d = new Date()
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const newStorageKey = `debt-ai:payments:${userId}`
    const oldStorageKey = `debt-ai:monthlyExtra:${userId}`
    try {
      // Load new format (array). Migrate from old map if present.
      const rawNew = localStorage.getItem(newStorageKey)
      const rawOld = localStorage.getItem(oldStorageKey)
      const parsedNew = rawNew ? JSON.parse(rawNew) : null
      const parsedOld = rawOld ? JSON.parse(rawOld) : null

      let next = Array.isArray(parsedNew) ? parsedNew : []

      // Migrate ONLY when the new key doesn't exist yet.
      // If the user cleared history (stored as []), we must not resurrect it from the old key.
      if (rawNew == null && parsedOld && typeof parsedOld === 'object') {
        // Migrate: { "YYYY-MM": number } -> [{id,key,amount,createdAt}]
        const migrated = []
        for (const [k, v] of Object.entries(parsedOld)) {
          if (typeof k !== 'string' || !/^\d{4}-\d{2}$/.test(k)) continue
          const n = Number(v)
          if (!Number.isFinite(n) || n < 0) continue
          migrated.push({
            id: `migrated:${k}`,
            key: k,
            amount: n,
            createdAt: `${k}-01T00:00:00.000Z`,
            debtId: null,
          })
        }
        migrated.sort((a, b) => String(b.key).localeCompare(String(a.key)))
        next = migrated
        localStorage.setItem(newStorageKey, JSON.stringify(next))
      }

      setPayments(next)

      const monthTotal = next
        .filter((p) => String(p?.key ?? '') === key)
        .reduce((s, p) => s + (Number.isFinite(Number(p?.amount)) ? Number(p.amount) : 0), 0)

      setMonthlyPaid(Number.isFinite(monthTotal) ? monthTotal : 0)
      setExtraPayment(Math.max(0, (Number.isFinite(monthTotal) ? monthTotal : 0) - safeTotalMin))
    } catch {
      setMonthlyPaid(0)
      setPayments([])
    }
  }, [userId])

  const paymentsHistory = useMemo(() => {
    const debtNameById = new Map(stableDebts.map((d) => [String(d?.id), String(d?.name ?? '')]))
    const items = (Array.isArray(payments) ? payments : [])
      .map((p) => ({
        id: String(p?.id ?? ''),
        key: String(p?.key ?? ''),
        amount: Number(p?.amount),
        createdAt: String(p?.createdAt ?? ''),
        debtId: p?.debtId == null || p?.debtId === 'all' ? null : String(p.debtId),
        debtName:
          p?.debtId == null || p?.debtId === 'all'
            ? ''
            : debtNameById.get(String(p.debtId)) || '',
      }))
      .filter((p) => p.id && /^\d{4}-\d{2}$/.test(p.key))
      .filter((p) => Number.isFinite(p.amount) && p.amount >= 0)
      .sort((a, b) => String(b.createdAt || b.key).localeCompare(String(a.createdAt || a.key)))
    return items.slice(0, 100)
  }, [payments, stableDebts])

  const payoffExtraDetailed = useMemo(() => {
    // We simulate using a schedule keyed by relative month number strings ("1", "2", ...)
    // built from the per-user per-month log and the baseline start month.
    if (!userId) {
      return safeSimulatePayoffTimelineDetailedSchedule(stableDebts, {
        strategy,
        extraSchedule: {},
        extraMonthlyDefault: effectiveExtraMonthly,
        maxMonths: 240,
      })
    }

    const now = new Date()
    const nowMonthIndex = now.getFullYear() * 12 + now.getMonth()
    // Build YYYY-MM -> paid total from payments list
    const monthMap = {}
    for (const p of Array.isArray(payments) ? payments : []) {
      const k = String(p?.key ?? '')
      if (!/^\d{4}-\d{2}$/.test(k)) continue
      const n = Number(p?.amount)
      if (!Number.isFinite(n) || n < 0) continue
      monthMap[k] = (Number(monthMap[k]) || 0) + n
    }

    // Convert YYYY-MM -> extra into relative month # since "now" baseline (month 1 == current month).
    // This makes "paid this month" affect month 1 of the simulation used for progress.
    const schedule = {}
    for (const [k, v] of Object.entries(monthMap ?? {})) {
      if (typeof k !== 'string') continue
      const m = /^(\d{4})-(\d{2})$/.exec(k)
      if (!m) continue
      const y = Number(m[1])
      const mm = Number(m[2]) - 1
      if (!Number.isFinite(y) || !Number.isFinite(mm)) continue
      const idx = y * 12 + mm
      const rel = nowMonthIndex - idx + 1
      if (rel < 1 || rel > 240) continue
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) continue
      schedule[String(rel)] = n
    }

    return safeSimulatePayoffTimelineDetailedSchedule(stableDebts, {
      strategy,
      extraSchedule: schedule,
      extraMonthlyDefault: effectiveExtraMonthly,
      maxMonths: 240,
    })
  }, [stableDebts, strategy, effectiveExtraMonthly, isPro, userId, payments])

  const debtProgress = useMemo(() => {
    const now = new Date()
    const nowMonthIndex = now.getFullYear() * 12 + now.getMonth()

    const safeAmount = (n) => {
      const x = Number(n)
      return Number.isFinite(x) && x > 0 ? x : 0
    }

    const parseMonthIndex = (raw) => {
      const n = Number(raw)
      return Number.isFinite(n) ? Math.floor(n) : null
    }

    const storageKey = userId ? `debt-ai:debtProgressStart:${userId}` : null
    let stored = { debts: {} }
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey)
        stored = raw ? JSON.parse(raw) : stored
      } catch {
        stored = { debts: {} }
      }
    }

    const nextStored = { debts: { ...(stored?.debts ?? {}) } }
    const seen = new Set(stableDebts.map((d) => String(d?.id)))

    // Seed/refresh baselines for debts we see now.
    for (const d of stableDebts) {
      const id = String(d?.id)
      if (!id) continue
      const cur = safeAmount(d?.amount)
      const prev = nextStored.debts[id]
      const startBalance = safeAmount(prev?.startBalance)
      const startMonth = parseMonthIndex(prev?.startMonth)

      const nextStartBalance = startBalance > 0 ? Math.max(startBalance, cur) : cur
      const nextStartMonth = startMonth == null ? nowMonthIndex : startMonth

      nextStored.debts[id] = { startBalance: nextStartBalance, startMonth: nextStartMonth }
    }

    // Cleanup deleted debts.
    for (const id of Object.keys(nextStored.debts)) {
      if (!seen.has(String(id))) delete nextStored.debts[id]
    }

    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextStored))
      } catch {
        // ignore
      }
    }

    // If we don't have a detailed simulation, fall back to "0% paid" based on current snapshot.
    const lookupAtMonth = (id, month) => {
      if (!Array.isArray(payoffExtraDetailed) || payoffExtraDetailed.length === 0) return null
      const last = payoffExtraDetailed[payoffExtraDetailed.length - 1]
      const maxMonth = Number(last?.month)
      const m = Number.isFinite(maxMonth) ? Math.max(0, Math.min(maxMonth, Math.floor(month))) : 0
      const point = payoffExtraDetailed.find((p) => Number(p?.month) === m) ?? payoffExtraDetailed[0]
      const perDebt = point?.perDebt ?? null
      if (!perDebt || typeof perDebt !== 'object') return null
      const v = Number(perDebt[String(id)])
      return Number.isFinite(v) ? v : null
    }

    const byId = {}
    let totalStart = 0
    let totalRemaining = 0
    let closedCount = 0

    for (const d of stableDebts) {
      const id = String(d?.id)
      if (!id) continue

      const base = nextStored.debts[id] ?? {}
      const startBalance = safeAmount(base.startBalance)
      const startMonth = parseMonthIndex(base.startMonth) ?? nowMonthIndex
      const elapsedMonths = Math.max(0, nowMonthIndex - startMonth)

      const remainingFromSim = lookupAtMonth(id, elapsedMonths)
      const remainingNow = Number(immediatePaymentNow?.byId?.[String(id)])
      const hasNow = Number.isFinite(remainingNow) && remainingNow >= 0
      const remaining =
        elapsedMonths === 0 && hasNow
          ? remainingNow
          : remainingFromSim == null
            ? safeAmount(d?.amount)
            : Math.max(0, remainingFromSim)

      const paidAmount = Math.max(0, startBalance - remaining)
      const pct =
        startBalance > 0 ? Math.max(0, Math.min(100, ((startBalance - remaining) / startBalance) * 100)) : 0
      const progressPct = Number.isFinite(pct) ? pct : 0
      const isClosed = remaining <= 0.01

      if (isClosed) closedCount += 1
      totalStart += startBalance
      totalRemaining += remaining

      byId[id] = {
        remaining,
        startBalance,
        paidAmount,
        progressPct,
        isClosed,
      }
    }

    const totalPaidPct =
      totalStart > 0
        ? Math.max(0, Math.min(100, ((totalStart - totalRemaining) / totalStart) * 100))
        : 0

    return {
      byId,
      totals: {
        totalPaidPct: Number.isFinite(totalPaidPct) ? totalPaidPct : 0,
        closedCount,
      },
    }
  }, [stableDebts, payoffExtraDetailed, userId])

  const payoffRecommended = payoffBaseline
  const payoffWorst = payoffBaseline
  const payoffBest = useMemo(
    () => safeSimulateDebts(stableDebts, { strategy, extraMonthly: bestCaseExtraMonthly, maxMonths: 240 }),
    [stableDebts, strategy, bestCaseExtraMonthly, isPro],
  )

  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <header className="mb-5 flex flex-col gap-3 md:mb-7 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-tight text-white/95">
              Your Freedom Plan
            </div>
            <div className="mt-1 truncate text-xs text-slate-300/80">
              {session?.user?.email ?? ''}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleUpgrade()
              }}
              className="rounded-xl bg-gradient-to-r from-sky-500/70 to-indigo-500/60 px-3 py-2.5 text-sm font-semibold text-white ring-1 ring-sky-400/25 transition hover:scale-[1.01]"
            >
              Get debt-free plan
            </button>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 ring-1 ring-white/10 transition duration-300 hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </header>

        {userDebts.loading ? (
          <div className="mb-5 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm text-slate-100/90 ring-1 ring-white/10">
            Loading financial data…
          </div>
        ) : null}

        <SupabaseDebtSummary
          loading={userDebts.loading}
          totalDebt={safeTotalDebt}
          totalMinPayment={safeTotalMin}
          count={safeCount}
          currency={currency}
          totalPaidPct={debtProgress?.totals?.totalPaidPct ?? 0}
          closedCount={debtProgress?.totals?.closedCount ?? 0}
        />

        <DailyFreedomMessage startDebt={startDebt ?? safeTotalDebt} totalDebt={safeTotalDebt} />

        <DailyInsightCard
          userId={userId}
          todayPctCloser={(() => {
            const s = Number(startDebt ?? safeTotalDebt)
            const c = Number(safeTotalDebt)
            if (!Number.isFinite(s) || s <= 0) return 0
            if (!Number.isFinite(c) || c < 0) return 0
            return ((s - c) / s) * 100
          })()}
          remainingToMin={Math.max(0, safeTotalMin - Math.max(0, Number(monthlyPaid) || 0))}
          tier={isPro ? 'pro' : 'free'}
        />

        <WeeklySummaryCard payments={payments} currency={currency} />

        <CoreMetricsRow
          controlScore={(() => {
            const risk = intel?.engine?.risk?.score
            if (!Number.isFinite(Number(risk))) return 50
            return Math.max(0, 100 - Number(risk))
          })()}
          stressScore={Number.isFinite(Number(intel?.engine?.risk?.score)) ? Number(intel.engine.risk.score) : 50}
          momentumScore={(() => {
            const total = Number(startDebt ?? safeTotalDebt)
            const cur = Number(safeTotalDebt)
            if (!Number.isFinite(total) || total <= 0) return 0
            if (!Number.isFinite(cur) || cur < 0) return 0
            return Math.max(0, Math.min(100, ((total - cur) / total) * 100))
          })()}
        />

        <NextBestActionCard
          action={(() => {
            if (!stableDebts || stableDebts.length === 0) return 'Add your first debt. One clear starting point is a powerful win.'
            const remaining = Math.max(0, safeTotalMin - Math.max(0, Number(monthlyPaid) || 0))
            if (remaining > 0) return `Finish your minimums. You’re ${Math.round(remaining)} away from staying in control.`
            const missingApr = stableDebts.some((d) => !Number.isFinite(Number(d?.apr)))
            if (missingApr) return 'Add APR for each debt. Better inputs unlock better coaching.'
            if (tier === 'free') return 'Upgrade to unlock your debt‑free plan and the next best action every week.'
            return 'Make one extra payment toward your highest‑APR debt today. Small focus, big relief.'
          })()}
        />

        <MonthlyPaymentLog
          currency={currency}
          totalMinPayment={safeTotalMin}
          value={monthlyPaid}
          debts={stableDebts}
          history={paymentsHistory}
          onSave={(payload) => {
            if (!userId) return
            const key =
              payload && typeof payload === 'object'
                ? String(payload.key ?? '')
                : (() => {
                    const d = new Date()
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                  })()

            if (!/^\d{4}-\d{2}$/.test(key)) return

            const amount =
              payload && typeof payload === 'object'
                ? Number(payload.amount)
                : Number(payload)
            const debtIdRaw = payload && typeof payload === 'object' ? String(payload.debtId ?? 'all') : 'all'
            const debtId = debtIdRaw === 'all' ? null : debtIdRaw

            const storageKey = `debt-ai:payments:${userId}`
            try {
              const raw = localStorage.getItem(storageKey)
              const data = raw ? JSON.parse(raw) : []
              const next = Array.isArray(data) ? [...data] : []
              next.push({
                id: `p:${Date.now()}:${Math.random().toString(16).slice(2)}`,
                key,
                amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
                createdAt: new Date().toISOString(),
                debtId,
              })
              localStorage.setItem(storageKey, JSON.stringify(next))
              setPayments(next)

              // If user saved the current month, update the derived totals.
              const d = new Date()
              const curKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
              if (key === curKey) {
                const monthTotal = next
                  .filter((p) => String(p?.key ?? '') === curKey)
                  .reduce((s, p) => s + (Number.isFinite(Number(p?.amount)) ? Number(p.amount) : 0), 0)
                setMonthlyPaid(Number.isFinite(monthTotal) ? monthTotal : 0)
                setExtraPayment(Math.max(0, (Number.isFinite(monthTotal) ? monthTotal : 0) - safeTotalMin))
              }
            } catch {
              // ignore
            }
          }}
          onDelete={(id) => {
            if (!userId) return
            const storageKey = `debt-ai:payments:${userId}`
            try {
              const raw = localStorage.getItem(storageKey)
              const data = raw ? JSON.parse(raw) : []
              const next = (Array.isArray(data) ? data : []).filter((p) => String(p?.id ?? '') !== String(id))
              localStorage.setItem(storageKey, JSON.stringify(next))
              setPayments(next)
              const d = new Date()
              const curKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
              const monthTotal = next
                .filter((p) => String(p?.key ?? '') === curKey)
                .reduce((s, p) => s + (Number.isFinite(Number(p?.amount)) ? Number(p.amount) : 0), 0)
              setMonthlyPaid(Number.isFinite(monthTotal) ? monthTotal : 0)
              setExtraPayment(Math.max(0, (Number.isFinite(monthTotal) ? monthTotal : 0) - safeTotalMin))
            } catch {
              // ignore
            }
          }}
          onClearAll={() => {
            if (!userId) return
            const storageKey = `debt-ai:payments:${userId}`
            const oldStorageKey = `debt-ai:monthlyExtra:${userId}`
            try {
              localStorage.setItem(storageKey, JSON.stringify([]))
              // Also clear the legacy key so it can't be migrated back.
              localStorage.removeItem(oldStorageKey)
              setPayments([])
              setMonthlyPaid(0)
              setExtraPayment(0)
            } catch {
              // ignore
            }
          }}
        />

        <DebtFreedomStory
          currency={currency}
          worst={payoffWorst}
          recommended={payoffRecommended}
          best={payoffBest}
          isPro={isPro}
          onUpgrade={handleUpgrade}
        />

        {isPro ? (
          <AIDebtIntelligenceCard
            intel={intel}
            baselinePayoff={payoffBaseline}
            extraPayoff={payoffExtra}
            extraPayment={effectiveExtraMonthly}
            isPro={true}
          />
        ) : (
          <UpgradeCtaCard
            title="AI Debt Coach (PRO)"
            subtitle="Unlock deep insights and optimization recommendations."
            valueLine={upgradeError ? String(upgradeError) : null}
            busy={upgradeBusy}
            onUpgrade={handleUpgrade}
          />
        )}

        <DebtFreedomProgress
          totalDebt={safeTotalDebt}
          startDebt={startDebt ?? safeTotalDebt}
          currency={currency}
        />

        {isPro ? (
          <WhatIfExtraPayment value={extraPayment} onChange={setExtraPayment} currency={currency} isPro={true} />
        ) : (
          <UpgradeCtaCard
            title="What‑if scenarios (PRO)"
            subtitle="Try extra payments and see how fast freedom arrives."
            valueLine={upgradeError ? String(upgradeError) : null}
            busy={upgradeBusy}
            onUpgrade={handleUpgrade}
          />
        )}

        {isPro ? (
          <DebtProjectionKpis
            baseline={payoffBaseline?.stats ?? null}
            withExtra={payoffExtra?.stats ?? null}
            currency={currency}
            extraMonthly={effectiveExtraMonthly}
            isPro={true}
          />
        ) : (
          <UpgradeCtaCard
            title="Freedom date + savings (PRO)"
            subtitle="See your freedom date and interest saved."
            valueLine={upgradeError ? String(upgradeError) : null}
            busy={upgradeBusy}
            onUpgrade={handleUpgrade}
          />
        )}

        {isPro ? (
          <DebtTimelineChart
            baseline={payoffBaseline?.timeline ?? null}
            withExtra={payoffExtra?.timeline ?? null}
            currency={currency}
            isPro={true}
          />
        ) : (
          <UpgradeCtaCard
            title="Freedom timeline (PRO)"
            subtitle="Unlock the advanced timeline chart."
            valueLine={upgradeError ? String(upgradeError) : null}
            busy={upgradeBusy}
            onUpgrade={handleUpgrade}
          />
        )}

        <UserDebtsPanel debtsState={userDebts} progressById={debtProgress?.byId ?? {}} currency={currency} />
      </div>
    </div>
  )
}

