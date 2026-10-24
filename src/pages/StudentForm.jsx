import { useState } from 'react'
import { Button, Field, inputClass } from '../components/ui'
import { EMPTY_STUDENT, GRADE_OPTIONS, LEVELS, validateStudent } from '../utils/validators'
import { saveStudent } from '../services/students'

export default function StudentForm({ student, onSaved, onCancel }) {
  const [v, setV] = useState(student ? Object.fromEntries(Object.keys(EMPTY_STUDENT).map((k) => [k, student[k] ?? ''])) : EMPTY_STUDENT)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target.value, ...(k === 'level' ? { grade_or_year: '' } : {}) }))

  const submit = async (e) => {
    e.preventDefault()
    const errs = validateStudent(v)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true); setServerError('')
    try { await saveStudent(v, student?.id); onSaved(student ? 'Student updated.' : 'Student added.') }
    catch (err) { setServerError(err.message); setBusy(false) }
  }
  const text = (k, label, extra = {}) => (
    <Field label={label} error={errors[k]}><input value={v[k]} onChange={set(k)} className={inputClass} {...extra} /></Field>
  )

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {text('student_no', 'Student ID *', { autoComplete: 'off' })}
      <div className="grid gap-3 sm:grid-cols-2">{text('last_name', 'Last name *')}{text('first_name', 'First name *')}</div>
      {text('middle_name', 'Middle name')}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Level *"><select value={v.level} onChange={set('level')} className={inputClass}>{Object.entries(LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label={v.level === 'college' ? 'Year level *' : 'Grade level *'} error={errors.grade_or_year}>
          <select value={v.grade_or_year} onChange={set('grade_or_year')} className={inputClass}>
            <option value="">Select</option>{GRADE_OPTIONS[v.level].map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
      </div>
      {text('section_or_program', v.level === 'college' ? 'Program *' : 'Strand / section *')}
      <div className="grid gap-3 sm:grid-cols-2">{text('contact_no', 'Student contact no.', { type: 'tel' })}{text('guardian_contact', 'Guardian contact no.', { type: 'tel' })}</div>
      {text('guardian_name', 'Emergency contact (guardian) name')}
      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={busy}>{student ? 'Save changes' : 'Add student'}</Button>
      </div>
    </form>
  )
}
