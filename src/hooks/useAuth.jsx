import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isDemoMode } from '../services/supabaseClient'

const AuthContext = createContext(null)
const DEMO_PROFILE = { id: 'demo', full_name: 'Demo Admin (fictional)', role: 'admin', is_active: true }

async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('id, full_name, role, is_active').eq('id', userId).single()
  return error ? null : data
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(isDemoMode ? DEMO_PROFILE : null)
  const [loading, setLoading] = useState(!isDemoMode && Boolean(supabase))

  useEffect(() => {
    if (isDemoMode || !supabase) return
    const sync = async (session) => {
      const p = session ? await loadProfile(session.user.id) : null
      setProfile(p && p.is_active ? p : null)
      setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => sync(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => { setTimeout(() => sync(session), 0) })
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { error: 'Supabase is not configured. See README.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? 'Incorrect email or password, or the account is inactive.' : null }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setProfile(null)
  }, [])

  return <AuthContext.Provider value={{ profile, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
