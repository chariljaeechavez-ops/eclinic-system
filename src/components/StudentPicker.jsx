import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Field, Spinner, inputClass } from './ui'
import { useAsync } from '../hooks/useAsync'
import { pickStudents } from '../services/visits'

export default function StudentPicker({ value, onChange, error }) {
  const [text, setText] = useState('')
  const [term, setTerm] = useState('')
  useEffect(() => { const t = setTimeout(() => setTerm(text), 300); return () => clearTimeout(t) }, [text])
  const { data, loading } = useAsync(() => pickStudents(term), term, !value && term.trim().length >= 2)
  const nm = (s) => `${s.last_name}, ${s.first_name}`

  if (value) return (
    <Field label="Student *" error={error}>
      <div className="flex min-h-11 items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm">
        <span>{nm(value)} · {value.student_no}</span>
        {value.locked ? null : <button type="button" onClick={() => onChange(null)} aria-label="Change student" className="grid size-9 place-items-center rounded hover:bg-slate-200"><X className="size-4" /></button>}
      </div>
    </Field>
  )
  return (
    <Field label="Student *" error={error}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type name or student ID (2+ characters)" className={inputClass} autoComplete="off" />
      {term.trim().length >= 2 && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm">
          {loading ? <li><Spinner /></li> : data?.length ? data.map((s) => (
            <li key={s.id}><button type="button" onClick={() => onChange(s)} className="min-h-11 w-full px-3 text-left hover:bg-brand-50">{nm(s)} <span className="text-slate-500">· {s.student_no} · {s.grade_or_year}, {s.section_or_program}</span></button></li>
          )) : <li className="p-3 text-slate-500">No matching active students.</li>}
        </ul>
      )}
    </Field>
  )
}
