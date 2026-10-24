import { supabase } from './supabaseClient'

const fail = () => { throw new Error('Could not load the report. Check the date range and try again.') }

export async function getVisitReport(from, to, group) {
  const { data, error } = await supabase.rpc('report_visits', { p_from: from, p_to: to, p_group: group })
  if (error) fail()
  return data
}

export async function getMovements(from, to) {
  const { data, error } = await supabase.rpc('report_stock_movements', { p_from: from, p_to: to })
  if (error) fail()
  return data
}

export const EXPORT_LIMIT = 5000

// Never selects observations, action taken, or follow-up: free-text health notes are not exported.
export async function fetchVisitsForExport(from, to) {
  const rows = []
  for (let start = 0; start < EXPORT_LIMIT; start += 1000) {
    const { data, error } = await supabase.from('clinic_visits')
      .select('visit_no, visited_at, reason, students!inner(student_no, last_name, first_name, level, grade_or_year, section_or_program)')
      .gte('visited_at', new Date(`${from}T00:00:00+08:00`).toISOString()).lte('visited_at', new Date(`${to}T23:59:59.999+08:00`).toISOString())
      .order('visited_at').range(start, start + 999)
    if (error) fail()
    rows.push(...data)
    if (data.length < 1000) return { rows, truncated: false }
  }
  return { rows, truncated: true }
}
