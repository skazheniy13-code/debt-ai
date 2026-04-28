import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

function createValue({ session, loading, error }) {
  return {
    supabase,
    supabaseReady: Boolean(supabase),
    session,
    user: session?.user ?? null,
    loading,
    error,
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined while loading
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isActive = true

    if (!supabase) {
      setSession(null)
      setLoading(false)
      setError(null)
      return () => {
        isActive = false
      }
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error
        if (!isActive) return
        setSession(data.session ?? null)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        if (!isActive) return
        setSession(null)
        setLoading(false)
        setError(err ?? new Error('Failed to load session'))
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isActive) return
      setSession(newSession)
      setLoading(false)
      setError(null)
    })

    return () => {
      isActive = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const value = useMemo(() => createValue({ session, loading, error }), [session, loading, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

