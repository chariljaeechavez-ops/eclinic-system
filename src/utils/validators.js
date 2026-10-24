const PHONE = /^[0-9+\-\s()]{7,20}$/
const STUDENT_NO = /^[A-Za-z0-9-]{3,20}$/

export const LEVELS = { senior_high: 'Senior High', college: 'College' }
export const GRADE_OPTIONS = {
  senior_high: ['Grade 11', 'Grade 12'],
  college: ['1st year', '2nd year', '3rd year', '4th year', '5th year'],
}

export const EMPTY_STUDENT = {
  student_no: '', last_name: '', first_name: '', middle_name: '', level: 'senior_high',
  grade_or_year: '', section_or_program: '', contact_no: '', guardian_name: '', guardian_contact: '',
}

export function validateStudent(v) {
  const e = {}
  if (!STUDENT_NO.test(v.student_no.trim())) e.student_no = 'Use 3-20 letters, numbers, or dashes.'
  if (!v.last_name.trim()) e.last_name = 'Last name is required.'
  if (!v.first_name.trim()) e.first_name = 'First name is required.'
  if (!GRADE_OPTIONS[v.level]?.includes(v.grade_or_year)) e.grade_or_year = 'Choose a grade or year level.'
  if (!v.section_or_program.trim()) e.section_or_program = 'Section or program is required.'
  for (const k of ['contact_no', 'guardian_contact']) {
    if (v[k].trim() && !PHONE.test(v[k].trim())) e[k] = 'Enter a valid phone number.'
  }
  return e
}

export const REASON_SUGGESTIONS = ['Headache', 'Stomachache', 'Fever', 'Dizziness', 'Minor injury', 'Menstrual cramps', 'Allergy symptoms', 'Rest', 'Other']

export function validateVisit(v) {
  const e = {}
  if (!v.student_id) e.student_id = 'Select a student.'
  if (!v.visited_at || Number.isNaN(Date.parse(v.visited_at))) e.visited_at = 'Enter the date and time.'
  else if (Date.parse(v.visited_at) > Date.now() + 5 * 60 * 1000) e.visited_at = 'The visit cannot be in the future.'
  if (!v.reason.trim()) e.reason = 'Reason for visit is required.'
  for (const k of ['reason', 'observations', 'action_taken', 'follow_up']) {
    if (v[k].length > 1000) e[k] = 'Maximum 1000 characters.'
  }
  return e
}

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

export const toLocalInput = (d = new Date()) => {
  const p = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return p.toISOString().slice(0, 16)
}

export const ITEM_CATEGORIES = { medicine: 'Medicine', supply: 'Medical supply' }

export function validateItem(v) {
  const e = {}
  if (!v.name.trim()) e.name = 'Item name is required.'
  if (!ITEM_CATEGORIES[v.category]) e.category = 'Choose a category.'
  if (!v.unit.trim()) e.unit = 'Unit is required (e.g. tablet, box).'
  if (!/^\d{1,6}$/.test(String(v.low_stock_threshold))) e.low_stock_threshold = 'Enter a whole number, 0 or more.'
  if (v.expiry_date && Number.isNaN(Date.parse(v.expiry_date))) e.expiry_date = 'Enter a valid date.'
  return e
}

export function validateStock(v, balance) {
  const e = {}
  if (!/^\d{1,6}$/.test(String(v.quantity)) || Number(v.quantity) < 1) e.quantity = 'Enter a whole number of 1 or more.'
  else if (v.kind === 'out' && Number(v.quantity) > balance) e.quantity = `Only ${balance} available.`
  return e
}

export function validateAccount(v, needEmail = true) {
  const e = {}
  if (needEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Enter a valid email address.'
  if (!v.full_name.trim()) e.full_name = 'Full name is required.'
  if (!['admin', 'staff'].includes(v.role)) e.role = 'Choose a role.'
  return e
}
