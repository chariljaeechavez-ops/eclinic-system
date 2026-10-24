import { supabase } from './supabaseClient'

const SAFE = /^(At least one active administrator|No login exists|That account is already|Not authorized|Invalid input)/
const friendly = (e) => (SAFE.test(e.message || '') ? e.message : e.code === '42501' ? 'You do not have permission to do that.' : 'Something went wrong. Please try again.')

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, role, is_active, created_at').order('full_name')
  if (error) throw new Error(friendly(error))
  return data
}

export async function updateProfile(id, { full_name, role, is_active }) {
  const { error } = await supabase.from('profiles').update({ full_name: full_name.trim(), role, is_active }).eq('id', id)
  if (error) throw new Error(friendly(error))
}

export async function linkUser({ email, full_name, role }) {
  const { error } = await supabase.rpc('admin_link_user', { p_email: email, p_full_name: full_name, p_role: role })
  if (error) throw new Error(friendly(error))
}

export const AUDIT_PAGE_SIZE = 20

export async function listAudit({ table = '', action = '', from = '', to = '', page = 0 }) {
  let q = supabase.from('audit_logs').select('id, actor_id, action, table_name, record_id, changed_fields, created_at', { count: 'exact' })
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(page * AUDIT_PAGE_SIZE, page * AUDIT_PAGE_SIZE + AUDIT_PAGE_SIZE - 1)
  if (table) q = q.eq('table_name', table)
  if (action) q = q.eq('action', action)
  if (from) q = q.gte('created_at', new Date(`${from}T00:00:00+08:00`).toISOString())
  if (to) q = q.lte('created_at', new Date(`${to}T23:59:59.999+08:00`).toISOString())
  const { data, count, error } = await q
  if (error) throw new Error(friendly(error))
  return { rows: data, total: count ?? 0 }
}
