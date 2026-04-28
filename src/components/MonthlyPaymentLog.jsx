import { useEffect, useMemo, useState } from 'react'
import { glassClassName } from './glass.js'
import { formatMoney } from './format.js'

function inputClassName() {
  return [
    'w-full rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white',
    'ring-1 ring-white/10 placeholder:text-slate-400',
    'outline-none transition focus:ring-2 focus:ring-sky-400/30',
  ].join(' ')
}

function buttonClassName(variant = 'primary') {
  if (variant === 'secondary') {
    return [
      'rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100',
      'ring-1 ring-white/10 transition duration-300 hover:bg-white/10',
      'disabled:cursor-not-allowed disabled:opacity-60',
    ].join(' ')
  }
  return [
    'rounded-xl bg-gradient-to-r from-sky-500/80 to-indigo-500/70 px-4 py-2.5',
    'text-sm font-semibold text-white shadow-[0_18px_45px_-30px_rgba(56,189,248,0.55)]',
    'ring-1 ring-sky-400/25 transition duration-300 hover:scale-[1.01]',
    'disabled:cursor-not-allowed disabled:opacity-60 hover:disabled:scale-100',
  ].join(' ')
}

function monthKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function toMonthInputValue(key) {
  // YYYY-MM is valid for <input type="month">
  return typeof key === 'string' && /^\d{4}-\d{2}$/.test(key) ? key : monthKey(new Date())
}

function safeNum(n) {
  const x = Number(n)
  return Number.isFinite(x) ? x : 0
}

export function MonthlyPaymentLog({
  currency,
  totalMinPayment = 0,
  value,
  debts = [],
  history = [],
  onSave,
  onDelete,
  onClearAll,
}) {
  const [raw, setRaw] = useState('')
  const [status, setStatus] = useState({ kind: 'idle', message: '' })
  const [historyOpen, setHistoryOpen] = useState(false)
  const [periodKey, setPeriodKey] = useState(() => monthKey(new Date()))
  const [selectedKey, setSelectedKey] = useState(null)

  const key = useMemo(() => monthKey(new Date()), [])
  const parsed = Number(raw)
  const canSave = Number.isFinite(parsed) && parsed >= 0

  useEffect(() => {
    // After refresh, we intentionally start with 0 stats and empty input.
    // Payments remain visible in history, and user can select a period to view it.
    setRaw('')
    setSelectedKey(null)
  }, [])

  const [debtId, setDebtId] = useState('all')
  const [debtMenuOpen, setDebtMenuOpen] = useState(false)

  const sumPaid = useMemo(() => {
    const items = Array.isArray(history) ? history : []
    const period = String(periodKey ?? '')
    const selectedDebt = debtId === 'all' ? null : String(debtId)

    return items
      .filter((p) => String(p?.key ?? '') === period)
      .filter((p) => {
        const pid = p?.debtId == null ? null : String(p.debtId)
        if (selectedDebt == null) return true // total paid across all debts
        return pid === selectedDebt
      })
      .reduce((s, p) => s + (Number.isFinite(Number(p?.amount)) ? Number(p.amount) : 0), 0)
  }, [history, debtId, periodKey])

  const effectiveMin = useMemo(() => {
    if (debtId === 'all') return safeNum(totalMinPayment)
    const match = Array.isArray(debts) ? debts.find((d) => String(d?.id) === String(debtId)) : null
    // If debts haven't loaded yet (or id mismatch), fall back to global minimum
    // so we never show "Minimums 0" incorrectly.
    return match ? safeNum(match?.min_payment) : safeNum(totalMinPayment)
  }, [debtId, debts, totalMinPayment])

  const paidNow = safeNum(sumPaid)
  const min = safeNum(effectiveMin)
  const remainingToMin = Math.max(0, min - paidNow)
  const overpaid = Math.max(0, paidNow - min)

  const debtLabel = useMemo(() => {
    if (debtId === 'all') return 'All debts (auto)'
    const match = Array.isArray(debts) ? debts.find((d) => String(d?.id) === String(debtId)) : null
    return match ? String(match?.name ?? 'Debt') : 'Debt'
  }, [debtId, debts])

  const minimumLabel = debtId === 'all' ? 'Minimums (all debts)' : `Minimum (${debtLabel})`

  const fmt = (n) => {
    const v = safeNum(n)
    return currency ? formatMoney(v, currency) : String(v)
  }

  const display = () => {
    const v = Number.isFinite(Number(value)) ? Number(value) : 0
    if (currency) return formatMoney(v, currency)
    return String(v)
  }

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white/95">
              This month payment
            </div>
            <div className="mt-1 text-xs text-slate-300/80">
              Log extra payment per period (saved to history)
            </div>
          </div>
          <div className="text-[11px] font-medium text-slate-300/85 md:text-right">
            {minimumLabel} {fmt(min)}
            <span className="mx-2 text-slate-300/50">·</span>
            Remaining {fmt(remainingToMin)}
            <span className="mx-2 text-slate-300/50">·</span>
            Overpaid {overpaid > 0 ? `+${fmt(overpaid)}` : fmt(0)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end">
          <label className="block">
            <div className="mb-2 text-xs font-medium text-slate-300/85">Period</div>
            <input
              type="month"
              className={inputClassName()}
              value={toMonthInputValue(periodKey)}
              onChange={(e) => {
                setStatus({ kind: 'idle', message: '' })
                setPeriodKey(e.target.value)
                setSelectedKey(e.target.value)
                setRaw('')
              }}
              max={toMonthInputValue(key)}
            />
          </label>
          <div className="relative">
            <div className="mb-2 text-xs font-medium text-slate-300/85">Debt</div>
            <button
              type="button"
              className={[inputClassName(), 'flex items-center justify-between gap-2'].join(' ')}
              onClick={() => setDebtMenuOpen((v) => !v)}
            >
              <span className="truncate">{debtLabel}</span>
              <span className="text-slate-300/70">{debtMenuOpen ? '▲' : '▼'}</span>
            </button>

            {debtMenuOpen ? (
              <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-white/10 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.85)]">
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-sm text-white/95 hover:bg-white/5"
                  onClick={() => {
                    setStatus({ kind: 'idle', message: '' })
                    setDebtId('all')
                    setDebtMenuOpen(false)
                  }}
                >
                  All debts (auto)
                </button>
                <div className="max-h-56 overflow-y-auto">
                  {Array.isArray(debts)
                    ? debts.map((d) => (
                        <button
                          key={String(d?.id)}
                          type="button"
                          className="block w-full px-4 py-3 text-left text-sm text-white/95 hover:bg-white/5"
                          onClick={() => {
                            setStatus({ kind: 'idle', message: '' })
                            setDebtId(String(d?.id))
                            setDebtMenuOpen(false)
                          }}
                        >
                          {String(d?.name ?? 'Debt')}
                        </button>
                      ))
                    : null}
                </div>
              </div>
            ) : null}
          </div>
          <label className="block">
            <div className="mb-2 text-xs font-medium text-slate-300/85">Paid (total)</div>
            <input
              className={inputClassName()}
              value={raw}
              onChange={(e) => {
                setStatus({ kind: 'idle', message: '' })
                setRaw(e.target.value)
              }}
              inputMode="decimal"
              placeholder="0"
            />
          </label>

          <button
            type="button"
            className={buttonClassName('primary')}
            disabled={!canSave}
            onClick={() => {
              setStatus({ kind: 'busy', message: '' })
              try {
                onSave?.({ key: periodKey, amount: parsed, debtId })
                setRaw('')
                setStatus({ kind: 'ok', message: 'Saved.' })
              } catch (e) {
                setStatus({ kind: 'error', message: e?.message ?? 'Failed to save' })
              }
            }}
          >
            Save
          </button>

          <button
            type="button"
            className={buttonClassName('secondary')}
            onClick={() => {
              setStatus({ kind: 'idle', message: '' })
              setRaw('')
              onSave?.({ key: periodKey, amount: 0, debtId })
            }}
          >
            Reset
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3"
            onClick={() => setHistoryOpen((v) => !v)}
          >
            <div className="text-xs font-semibold text-slate-200/90">
              Payment history{' '}
              <span className="text-slate-300/75">
                ({history?.length ?? 0})
              </span>
            </div>
            <div className="text-[11px] font-semibold text-slate-200 ring-1 ring-white/10 rounded-lg bg-white/5 px-2.5 py-1">
              {historyOpen ? 'Hide' : 'Open'}
            </div>
          </button>

          {historyOpen ? (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-medium text-slate-300/75">
                  Scroll to review each period
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-white/10"
                  onClick={() => onClearAll?.()}
                  disabled={!history || history.length === 0}
                >
                  Clear
                </button>
              </div>

              {history && history.length > 0 ? (
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {history.map((h) => (
                    <div
                      key={String(h?.id ?? h?.createdAt ?? h?.key ?? '')}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.02] px-3 py-2 ring-1 ring-white/10"
                    >
                      <button
                        type="button"
                        className="min-w-0 text-left"
                        onClick={() => {
                          const k = String(h?.key ?? '')
                          if (!k) return
                          setSelectedKey(k)
                          setPeriodKey(k)
                        }}
                      >
                        <div className="text-[11px] font-medium text-slate-300/85">
                          {String(h?.key ?? '')}
                        </div>
                        {h?.debtId ? (
                          <div className="mt-0.5 text-[11px] font-medium text-slate-300/75">
                            {String(h?.debtName ?? 'Debt')}
                          </div>
                        ) : (
                          <div className="mt-0.5 text-[11px] font-medium text-slate-300/75">
                            All debts
                          </div>
                        )}
                        <div className="mt-0.5 truncate text-sm font-semibold text-white/95">
                          {fmt(h?.amount ?? 0)}
                        </div>
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-rose-500/10 hover:text-rose-100 hover:ring-rose-400/25"
                        onClick={() => onDelete?.(String(h?.id ?? ''))}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-300/75">No saved payments yet.</div>
              )}
            </div>
          ) : null}
        </div>

        {status.kind !== 'idle' ? (
          <div
            className={[
              'mt-3 rounded-xl px-4 py-3 text-sm ring-1',
              status.kind === 'error'
                ? 'bg-rose-500/10 text-rose-100 ring-rose-400/20'
                : status.kind === 'ok'
                  ? 'bg-emerald-500/10 text-emerald-100 ring-emerald-400/20'
                  : 'bg-white/5 text-slate-200 ring-white/10',
            ].join(' ')}
          >
            {status.message || (status.kind === 'busy' ? 'Saving…' : '')}
          </div>
        ) : null}
      </div>
    </section>
  )
}

