import { supabase } from './supabaseClient'

const COLS = 'id, student_no, last_name, first_name, middle_name, level, grade_or_year, section_or_program, contact_no, guardian_name, guardian_contact, is_archived'
export const PAGE_SIZE = 10

function friendly(error) {
  if (error.code === '23505') return 'A student with that ID already exists.'
  if (error.code === '42501') return 'You do not have permission to do that.'
  return 'Something went wrong. Please try again.'
}

export async function listStudents({ search = '', level = '', showArchived = false, page = 0 }) {
  let q = supabase.from('students').select(COLS, { count: 'exact' })
    .order('last_name').order('first_name').range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
  if (!showArchived) q = q.eq('is_archived', false)
  if (level) q = q.eq('level', level)
  const term = search.replace(/[%,()*\\]/g, ' ').trim()
  if (term) q = q.or(`student_no.ilike.%${term}%,last_name.ilike.%${term}%,first_name.ilike.%${term}%`)
  const { data, count, error } = await q
  if (error) throw new Error(friendly(error))
  return { rows: data, total: count ?? 0 }
}

export async function saveStudent(values, id) {
  const clean = Object.fromEntries(Object.entries(values).map(([k, v]) => {
    const t = typeof v === 'string' ? v.trim() : v
    return [k, t === '' && !['student_no', 'last_name', 'first_name'].includes(k) ? null : t]
  }))
  const req = id ? supabase.from('students').update(clean).eq('id', id) : supabase.from('students').insert(clean)
  const { error } = await req
  if (error) throw new Error(friendly(error))
}

export async function setArchived(id, archived) {
  const { error } = await supabase.from('students').update({ is_archived: archived }).eq('id', id)
  if (error) throw new Error(friendly(error))
}
