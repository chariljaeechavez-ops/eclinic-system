import { supabase } from './supabaseClient'

export const VISIT_PAGE_SIZE = 10
const COLS = 'id, visit_no, student_id, visited_at, reason, observations, action_taken, follow_up, students!inner(id, student_no, last_name, first_name), profiles(full_name)'

const friendly = (e) => (e.code === '42501' ? 'You do not have permission to do that.' : 'Something went wrong. Please try again.')
const clean = (t) => t.replace(/[%,()*\\]/g, ' ').trim()

export async function listVisits({ search = '', from = '', to = '', page = 0 }) {
  let q = supabase.from('clinic_visits').select(COLS, { count: 'exact' })
    .order('visited_at', { ascending: false }).range(page * VISIT_PAGE_SIZE, page * VISIT_PAGE_SIZE + VISIT_PAGE_SIZE - 1)
  if (from) q = q.gte('visited_at', new Date(`${from}T00:00:00`).toISOString())
  if (to) q = q.lte('visited_at', new Date(`${to}T23:59:59.999`).toISOString())
  const t = clean(search)
  if (t) q = q.or(`student_no.ilike.%${t}%,last_name.ilike.%${t}%,first_name.ilike.%${t}%`, { referencedTable: 'students' })
  const { data, count, error } = await q
  if (error) throw new Error(friendly(error))
  return { rows: data, total: count ?? 0 }
}

export async function listStudentVisits(studentId) {
  const { data, error } = await supabase.from('clinic_visits').select(COLS).eq('student_id', studentId).order('visited_at', { ascending: false }).limit(100)
  if (error) throw new Error(friendly(error))
  return data
}

export async function getStudent(id) {
  const { data, error } = await supabase.from('students').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(friendly(error))
  return data
}

export async function pickStudents(term) {
  const t = clean(term)
  if (t.length < 2) return []
  const { data, error } = await supabase.from('students').select('id, student_no, last_name, first_name, grade_or_year, section_or_program')
    .eq('is_archived', false).or(`student_no.ilike.%${t}%,last_name.ilike.%${t}%,first_name.ilike.%${t}%`).order('last_name').limit(8)
  if (error) throw new Error(friendly(error))
  return data
}

export async function saveVisit(v, id) {
  const row = {
    student_id: v.student_id, visited_at: new Date(v.visited_at).toISOString(), reason: v.reason.trim(),
    observations: v.observations.trim() || null, action_taken: v.action_taken.trim() || null, follow_up: v.follow_up.trim() || null,
  }
  const { error } = id ? await supabase.from('clinic_visits').update(row).eq('id', id) : await supabase.from('clinic_visits').insert(row)
  if (error) throw new Error(friendly(error))
}
