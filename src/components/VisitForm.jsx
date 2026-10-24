import { useState } from 'react'
import { Button, Field, inputClass } from './ui'
import StudentPicker from './StudentPicker'
import { REASON_SUGGESTIONS, toLocalInput, validateVisit } from '../utils/validators'
import { saveVisit } from '../services/visits'

// visit: existing visit (edit) | student: preselected student (new from profile) | neither: new visit with picker
export default function VisitForm({ visit, student, onSaved, onCancel }) {
  const s0 = visit ? { ...visit.students, locked: true } : student ? { ...student, locked: true } : null
  const [stu, setStu] = useState(s0)
  const [v, setV] = useState({
    visited_at: visit ? toLocalInput(new Date(visit.visited_at)) : toLocalInput(), reason: visit?.reason ?? '',
    observations: visit?.observations ?? '', action_taken: visit?.action_taken ?? '', follow_up: visit?.follow_up ?? '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const all = { ...v, student_id: stu?.id }
    const errs = validateVisit(all)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true); setServerError('')
    try { await saveVisit(all, visit?.id); onSaved(visit ? 'Visit updated.' : 'Visit recorded.') }
    catch (err) { setServerError(err.message); setBusy(false) }
  }
  const area = (k, label) => (
    <Field label={label} error={errors[k]}><textarea rows={3} value={v[k]} onChange={set(k)} className={`${inputClass} py-2`} /></Field>
  )

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <StudentPicker value={stu} onChange={setStu} error={errors.student_id} />
      <Field label="Date and time *" error={errors.visited_at}><input type="datetime-local" value={v.visited_at} onChange={set('visited_at')} className={inputClass} /></Field>
      <Field label="Reason for visit *" error={errors.reason}>
        <input list="reasons" value={v.reason} onChange={set('reason')} className={inputClass} />
        <datalist id="reasons">{REASON_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>
      </Field>
      {area('observations', 'Observations (as recorded by clinic personnel)')}
      {area('action_taken', 'Action or care provided')}
      {area('follow_up', 'Referral or follow-up')}
      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={busy}>{visit ? 'Save changes' : 'Record visit'}</Button>
      </div>
    </form>
  )
}
