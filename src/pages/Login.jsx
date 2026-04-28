import { useMemo, useState } from 'react'
import { glassClassName } from '../components/glass.js'
import { supabase } from '../lib/supabase.js'

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
      'w-full rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100',
      'ring-1 ring-white/10 transition duration-300 hover:bg-white/10',
      'disabled:cursor-not-allowed disabled:opacity-60',
    ].join(' ')
  }
  return [
    'w-full rounded-xl bg-gradient-to-r from-sky-500/80 to-indigo-500/70 px-4 py-3',
    'text-sm font-semibold text-white shadow-[0_18px_45px_-30px_rgba(56,189,248,0.55)]',
    'ring-1 ring-sky-400/25 transition duration-300 hover:scale-[1.01]',
    'disabled:cursor-not-allowed disabled:opacity-60 hover:disabled:scale-100',
  ].join(' ')
}

export function Login() {
  if (!supabase) {
    return (
      <div className="min-h-dvh">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white/5 p-6 text-center text-sm text-slate-200 ring-1 ring-white/10">
            Supabase keys not set. Please update <span className="font-semibold">.env</span>
          </div>
        </div>
      </div>
    )
  }

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  const isBusy = status.kind === 'busy'
  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length >= 6 && !isBusy,
    [email, password, isBusy],
  )

  async function onSubmit(e) {
    e.preventDefault()
    setStatus({ kind: 'busy', message: '' })

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (error) throw error
        setStatus({
          kind: 'ok',
          message: 'Account created. Check your email to confirm, then log in.',
        })
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
        setStatus({ kind: 'ok', message: 'Signed in.' })
      }
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err?.message ?? 'Something went wrong. Please try again.',
      })
    }
  }

  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400/80" />
              Supabase Auth
            </div>
            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white">
              Debt AI Assistant
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
              Sign in to access your dashboard. Minimal auth for an MVP—no backend
              server required.
            </p>
          </div>

          <div className={glassClassName('p-6')}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white/95">
                {mode === 'signup' ? 'Create account' : 'Welcome back'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatus({ kind: 'idle', message: '' })
                  setMode((m) => (m === 'signup' ? 'login' : 'signup'))
                }}
                className="text-xs font-semibold text-sky-200/90 transition hover:text-sky-100"
              >
                {mode === 'signup' ? 'Use login' : 'Create account'}
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
              <label className="block">
                <div className="mb-2 text-xs font-medium text-slate-300/85">
                  Email
                </div>
                <input
                  className={inputClassName()}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </label>

              <label className="block">
                <div className="mb-2 text-xs font-medium text-slate-300/85">
                  Password
                </div>
                <input
                  className={inputClassName()}
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </label>

              {status.kind !== 'idle' ? (
                <div
                  className={[
                    'rounded-xl px-4 py-3 text-sm ring-1',
                    status.kind === 'error'
                      ? 'bg-rose-500/10 text-rose-100 ring-rose-400/20'
                      : status.kind === 'ok'
                        ? 'bg-emerald-500/10 text-emerald-100 ring-emerald-400/20'
                        : 'bg-white/5 text-slate-200 ring-white/10',
                  ].join(' ')}
                >
                  {status.message || (status.kind === 'busy' ? 'Working…' : '')}
                </div>
              ) : null}

              <button className={buttonClassName('primary')} disabled={!canSubmit}>
                {mode === 'signup' ? 'Sign up' : 'Log in'}
              </button>

              <button
                type="button"
                className={buttonClassName('secondary')}
                disabled={isBusy}
                onClick={() => {
                  setEmail('')
                  setPassword('')
                  setStatus({ kind: 'idle', message: '' })
                }}
              >
                Clear
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Tip: enable “Email confirmations” in Supabase Auth settings as needed.
          </p>
        </div>
      </div>
    </div>
  )
}

