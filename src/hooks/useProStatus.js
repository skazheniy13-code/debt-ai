import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useProStatus({ email }) {
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!supabase || !email) {
      setIsPro(false)
      setLoading(false)
      return
    }

    setLoading(true)

    async function load() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_pro,email')
          .eq('email', email)
          .maybeSingle()

        if (cancelled) return
        if (error) throw error
        setIsPro(Boolean(data?.is_pro))
      } catch {
        if (!cancelled) setIsPro(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    const channel = supabase
      .channel(`profiles:pro:${email}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `email=eq.${email}` },
        (payload) => {
          if (cancelled) return
          const next = payload?.new?.is_pro
          setIsPro(Boolean(next))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [email])

  return { isPro, loading }
}

