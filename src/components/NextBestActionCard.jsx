import { glassClassName } from './glass.js'

export function NextBestActionCard({ action }) {
  return (
    <section className="mb-6">
      <div className={glassClassName('p-5')}>
        <div className="text-sm font-semibold tracking-tight text-white/95">Next best action</div>
        <div className="mt-1 text-sm text-slate-200/85">{action}</div>
      </div>
    </section>
  )
}

