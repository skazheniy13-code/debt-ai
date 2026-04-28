export function SupabaseMissing() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white/5 p-6 text-center text-sm text-slate-200 ring-1 ring-white/10">
          Supabase keys not set. Please update <span className="font-semibold">.env</span>
          <div className="mt-3 text-xs text-slate-400">
            Required: <span className="font-mono">VITE_SUPABASE_URL</span> and{' '}
            <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>
          </div>
        </div>
      </div>
    </div>
  )
}

