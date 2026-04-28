import { useMemo, useState } from 'react'
import { glassClassName } from './glass.js'
import { formatMoney, formatPct } from './format.js'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

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

export function UserDebtsPanel({ debtsState, progressById = {}, currency: summaryCurrency = null }) {
  const { debts, loading, saving, error, addDebt, deleteDebt } = debtsState
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [minPayment, setMinPayment] = useState('')
  const [apr, setApr] = useState('')
  const [currency, setCurrency] = useState('')

  const lockedCurrency = useMemo(() => {
    const codes = debts
      .map((d) => (typeof d.currency === 'string' ? d.currency.trim().toUpperCase() : ''))
      .filter((c) => /^[A-Z]{3}$/.test(c))
    const uniq = [...new Set(codes)]
    return uniq.length === 1 ? uniq[0] : null
  }, [debts])

  const canSubmit = useMemo(() => {
    if (saving) return false
    if (name.trim().length < 2) return false
    const a = Number(amount)
    const m = Number(minPayment)
    const aprTrim = apr.trim()
    const curTrim = currency.trim()
    if (!Number.isFinite(a) || a <= 0) return false
    if (!Number.isFinite(m) || m <= 0) return false
    if (aprTrim !== '') {
      const r = Number(aprTrim)
      if (!Number.isFinite(r) || r < 0) return false
    }
    if (curTrim !== '') {
      const c = curTrim.toUpperCase()
      if (!/^[A-Z]{3}$/.test(c)) return false
    }
    return true
  }, [saving, name, amount, minPayment, apr, currency])

  async function onSubmit(e) {
    e.preventDefault()
    setStatus({ kind: 'busy', message: '' })
    try {
      const curTrim = currency.trim()
      const c = (curTrim ? curTrim.toUpperCase() : lockedCurrency ?? 'USD')
      if (lockedCurrency && c !== lockedCurrency) {
        throw new Error(`All debts must use the same currency (${lockedCurrency}).`)
      }

      await addDebt({
        name,
        amount: Number(amount),
        min_payment: Number(minPayment),
        apr: apr.trim() === '' ? null : Number(apr),
        currency: curTrim === '' ? null : c,
      })
      setStatus({ kind: 'ok', message: 'Debt added.' })
      setName('')
      setAmount('')
      setMinPayment('')
      setApr('')
      setCurrency(lockedCurrency ?? '')
      setIsOpen(false)
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err?.message ?? 'Failed to add debt',
      })
    }
  }

  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-white/95">
              Debts
            </h2>
            <div className="mt-1 text-xs text-slate-300/80">{loading ? 'Loading…' : null}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={buttonClassName('secondary')}
              onClick={() => {
                setStatus({ kind: 'idle', message: '' })
                setCurrency((prev) => (prev ? prev : lockedCurrency ?? ''))
                setIsOpen((v) => !v)
              }}
              disabled={saving}
            >
              Add debt
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-100 ring-1 ring-rose-400/20">
            {error?.message ?? 'Failed to load debts'}
          </div>
        ) : null}

        {isOpen ? (
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <div className="mb-2 text-xs font-medium text-slate-300/85">Name</div>
              <input
                className={inputClassName()}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Visa"
                required
              />
            </label>
            <label className="block">
              <div className="mb-2 text-xs font-medium text-slate-300/85">Amount</div>
              <input
                className={inputClassName()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 1200"
                required
              />
            </label>
            <label className="block">
              <div className="mb-2 text-xs font-medium text-slate-300/85">Min payment</div>
              <input
                className={inputClassName()}
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 45"
                required
              />
            </label>

            <label className="block">
              <div className="mb-2 text-xs font-medium text-slate-300/85">APR (optional)</div>
              <input
                className={inputClassName()}
                value={apr}
                onChange={(e) => setApr(e.target.value)}
                inputMode="decimal"
                placeholder="Defaults to 0"
              />
            </label>

            <label className="block md:col-span-2 lg:col-span-1">
              <div className="mb-2 text-xs font-medium text-slate-300/85">Currency (optional)</div>
              <input
                className={inputClassName()}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder={lockedCurrency ? `${lockedCurrency} (locked)` : 'Defaults to USD'}
              />
            </label>

            {status.kind !== 'idle' ? (
              <div
                className={[
                  'md:col-span-2 lg:col-span-3 rounded-xl px-4 py-3 text-sm ring-1',
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

            <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-2 md:flex-row md:justify-end">
              <button className={buttonClassName('primary')} disabled={!canSubmit}>
                Save
              </button>
              <button
                type="button"
                className={buttonClassName('secondary')}
                onClick={() => {
                  setIsOpen(false)
                  setStatus({ kind: 'idle', message: '' })
                }}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="text-sm font-semibold text-white">Loading…</div>
            </div>
          ) : debts.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="text-sm font-semibold text-white">No debts yet</div>
              <div className="mt-1 text-sm text-slate-300/80">
                Add your first debt to unlock projections and payoff timeline.
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className={buttonClassName('primary')}
                  onClick={() => {
                    setStatus({ kind: 'idle', message: '' })
                    setCurrency((prev) => (prev ? prev : lockedCurrency ?? ''))
                    setIsOpen(true)
                  }}
                  disabled={saving}
                >
                  Add your first debt
                </button>
              </div>
            </div>
          ) : (
            debts.map((d) => (
              (() => {
                const p = progressById?.[String(d.id)] ?? null
                const progressPct = clamp(Number(p?.progressPct ?? 0), 0, 100)
                const isClosed = Boolean(p?.isClosed)
                const remaining = Number(p?.remaining)
                const canShowRemaining = Number.isFinite(remaining) && remaining >= 0
                const paidAmount = Number(p?.paidAmount)
                const canShowPaid = Number.isFinite(paidAmount) && paidAmount >= 0
                const cur = typeof d.currency === 'string' ? d.currency : summaryCurrency
                return (
              <div
                key={d.id}
                className={[
                  'rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10',
                  'transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{d.name}</div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-rose-500/10 hover:text-rose-100 hover:ring-rose-400/25"
                    disabled={saving}
                    onClick={async () => {
                      setStatus({ kind: 'busy', message: '' })
                      try {
                        await deleteDebt(d.id)
                        setStatus({ kind: 'ok', message: 'Debt deleted.' })
                      } catch (err) {
                        setStatus({
                          kind: 'error',
                          message: err?.message ?? 'Failed to delete debt',
                        })
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-300/85">Amount</div>
                    <div className="mt-1 text-sm font-semibold text-white/95">
                      {Number.isFinite(Number(d.amount)) && typeof cur === 'string'
                        ? formatMoney(Number(d.amount), cur)
                        : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-medium text-slate-300/85">
                      Min payment
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/95">
                      {Number.isFinite(Number(d.min_payment)) && typeof cur === 'string'
                        ? formatMoney(Number(d.min_payment), cur)
                        : '—'}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300/90">
                  <span className="rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-white/10">
                    APR{' '}
                    {formatPct(Number.isFinite(Number(d.apr)) ? Number(d.apr) : 0)}
                  </span>
                  <div className="flex items-center gap-2">
                    {isClosed ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-100 ring-1 ring-emerald-400/20">
                        Completed
                      </span>
                    ) : null}
                    <span className="font-medium text-slate-200">
                      {typeof cur === 'string' ? cur.toUpperCase() : '—'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-300/90">
                    <span className="font-medium text-slate-200">
                      {Math.round(progressPct)}% paid
                    </span>
                    <div className="flex items-center gap-3 text-slate-300/80">
                      <span>
                        Paid{' '}
                        {canShowPaid && typeof cur === 'string' ? formatMoney(paidAmount, cur) : '—'}
                      </span>
                      <span>
                        Remaining{' '}
                        {canShowRemaining && typeof cur === 'string'
                          ? formatMoney(remaining, cur)
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500/70 to-indigo-500/60"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
                )
              })()
            ))
          )}
        </div>
      </div>
    </section>
  )
}

