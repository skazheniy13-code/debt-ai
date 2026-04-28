import { useEffect, useState } from 'react'
import { Login } from './pages/Login.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { supabase } from './lib/supabase.js'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return
      setSession(session)
    })

    return () => {
      active = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div className="p-4 text-white">Loading...</div>
  }

  return session ? (
    <Dashboard session={session} />
  ) : (
    <Login />
  )
}

export default App