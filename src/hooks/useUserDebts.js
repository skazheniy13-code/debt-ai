import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

function normalizeRow(row) {
  const aprRaw = row.apr
  const aprNum = aprRaw == null || aprRaw === '' ? 0 : Number(aprRaw)

  const curRaw = row.currency
  const cur =
    typeof curRaw === 'string' && /^[A-Za-z]{3}$/.test(curRaw.trim())
      ? curRaw.trim().toUpperCase()
      : 'USD'

  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    min_payment: Number(row.min_payment),
    apr: Number.isFinite(aprNum) && aprNum >= 0 ? aprNum : 0,
    currency: cur,
    created_at: row.created_at ?? null,
  }
}

function upsertById(items, item) {
  const idx = items.findIndex((x) => x.id === item.id)
  if (idx === -1) return [item, ...items]
  const copy = items.slice()
  copy[idx] = { ...copy[idx], ...item }
  return copy
}

export function useUserDebts({ userId }) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const ready = Boolean(supabase) && Boolean(userId)
  const channelRef = useRef(null)

  const reload = useCallback(async () => {
    if (!ready) return
    const { data, error } = await supabase
      .from('debts')
      .select('id,name,amount,min_payment,apr,currency,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    setDebts((data ?? []).map(normalizeRow))
  }, [ready, userId])

  const load = useCallback(async () => {
    if (!ready) return
    setLoading(true)
    setError(null)
    try {
      await reload()
    } catch (err) {
      setError(err ?? new Error('Failed to load debts'))
      setDebts([])
    } finally {
      setLoading(false)
    }
  }, [ready, reload])

  useEffect(() => {
    if (!ready) {
      setDebts([])
      setLoading(false)
      setError(null)
      return
    }
    load()
  }, [ready, load])

  useEffect(() => {
    if (!ready) return
    if (!supabase) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`debts:user:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'debts', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = payload.old?.id
            if (!id) return
            setDebts((prev) => prev.filter((d) => d.id !== id))
            return
          }

          const row = payload.new
          if (!row?.id) return
          const normalized = normalizeRow(row)
          setDebts((prev) => upsertById(prev, normalized))
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // fallback: polling via manual reload (we keep state, just surface error)
          setError(new Error('Realtime channel error. Please reload.'))
        }
      })

    channelRef.current = channel

    return () => {
      if (!channelRef.current) return
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [ready, userId])

  const deleteDebt = useCallback(
    async (id) => {
      if (!ready) throw new Error('Not authenticated')
      if (!id) throw new Error('Missing id')
      setSaving(true)
      setError(null)
      try {
        const { error } = await supabase.from('debts').delete().eq('id', id).eq('user_id', userId)
        if (error) throw error
        try {
          await reload()
        } catch (err) {
          setError(err ?? new Error('Deleted, but failed to refresh debts'))
        }
      } finally {
        setSaving(false)
      }
    },
    [ready, userId, reload],
  )

  const addDebt = useCallback(
    async ({ name, amount, min_payment, apr, currency }) => {
      if (!ready) throw new Error('Not authenticated')
      setSaving(true)
      setError(null)
      try {
        const amountNum = Number(amount)
        const minNum = Number(min_payment)

        const aprProvided = apr != null && String(apr).trim() !== ''
        const aprNum = aprProvided ? Number(apr) : 0

        const curProvided = typeof currency === 'string' && currency.trim() !== ''
        const cur = curProvided ? currency.trim().toUpperCase() : 'USD'

        if (!Number.isFinite(amountNum) || amountNum <= 0) throw new Error('Invalid amount')
        if (!Number.isFinite(minNum) || minNum <= 0) throw new Error('Invalid minimum payment')
        if (aprProvided && (!Number.isFinite(aprNum) || aprNum < 0)) throw new Error('Invalid APR')
        if (!/^[A-Z]{3}$/.test(cur)) throw new Error('Invalid currency (use ISO 4217, e.g. USD)')

        const payload = {
          user_id: userId,
          name: name.trim(),
          amount: amountNum,
          min_payment: minNum,
          apr: Number.isFinite(aprNum) && aprNum >= 0 ? aprNum : 0,
          currency: cur,
        }

        const { data, error } = await supabase
          .from('debts')
          .insert(payload)
          .select('id,name,amount,min_payment,apr,currency,created_at')
          .single()

        if (error) throw error
        console.log('[debts] inserted', data)
        const inserted = normalizeRow(data)
        try {
          await reload()
        } catch (err) {
          setError(err ?? new Error('Saved, but failed to refresh debts'))
          setDebts((prev) => upsertById(prev, inserted))
        }
        return inserted
      } finally {
        setSaving(false)
      }
    },
    [ready, userId, reload],
  )

  return useMemo(
    () => ({
      ready,
      debts,
      loading,
      saving,
      error,
      reload,
      addDebt,
      deleteDebt,
    }),
    [ready, debts, loading, saving, error, reload, addDebt, deleteDebt],
  )
}

