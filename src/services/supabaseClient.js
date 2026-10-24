import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && key)
export const isDemoMode = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true'
export const supabase = isSupabaseConfigured ? createClient(url, key) : null
