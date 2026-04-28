export function Skeleton({ className = '' }) {
  return (
    <div
      className={[
        'animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10',
        className,
      ].join(' ')}
    />
  )
}

