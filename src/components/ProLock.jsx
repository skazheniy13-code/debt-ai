import { glassClassName } from './glass.js'

export function ProLock({ title = 'PRO', subtitle = 'Upgrade to unlock', children }) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[1.5px] opacity-55">{children}</div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-black/0 via-black/0 to-black/25" />

      <div className="absolute right-3 top-3">
        <div className={glassClassName('pointer-events-auto flex items-center gap-3 px-3 py-2')}>
          <div className="flex min-w-0 flex-col">
            <div className="inline-flex w-fit items-center rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-200 ring-1 ring-white/10">
              {title}
            </div>
            <div className="mt-1 max-w-[22ch] truncate text-xs font-medium text-slate-200/90">
              {subtitle}
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-sky-500/80 to-indigo-500/70 px-3 py-2 text-xs font-semibold text-white ring-1 ring-sky-400/25 transition hover:scale-[1.01]"
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  )
}

