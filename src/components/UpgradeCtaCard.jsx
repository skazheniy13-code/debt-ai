import { glassClassName } from './glass.js'

export function UpgradeCtaCard({ title, subtitle, valueLine, onUpgrade, busy }) {
  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white/95">{title}</div>
            {subtitle ? <div className="mt-1 text-sm text-slate-200/85">{subtitle}</div> : null}
            {valueLine ? (
              <div className="mt-3 rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-slate-100/90 ring-1 ring-white/10">
                {valueLine}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUpgrade}
              disabled={Boolean(busy)}
              className="rounded-xl bg-gradient-to-r from-sky-500/80 to-indigo-500/70 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-sky-400/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Unlock PRO
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

