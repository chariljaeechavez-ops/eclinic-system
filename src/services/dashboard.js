import { supabase } from './supabaseClient'

export async function getSummary() {
  const { data, error } = await supabase.rpc('dashboard_summary')
  if (error) throw new Error('Could not load dashboard figures.')
  return data
}
