export function glassClassName(extra = '') {
  return [
    'rounded-2xl',
    'bg-slate-900/30',
    'backdrop-blur-xl',
    'shadow-[0_10px_35px_-22px_rgba(0,0,0,0.80),0_2px_12px_-8px_rgba(0,0,0,0.55)]',
    'ring-1',
    'ring-white/8',
    'transition duration-300',
    extra,
  ].join(' ')
}

