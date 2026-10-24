import { Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../utils/validators'

const Row = ({ label, text }) => text ? <p className="text-sm"><span className="font-medium text-slate-600">{label}: </span>{text}</p> : null

export default function VisitItems({ visits, showStudent, onEdit }) {
  return (
    <ul className="divide-y divide-slate-100">
      {visits.map((v) => (
        <li key={v.id} className="flex items-start justify-between gap-2 p-4">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-slate-500">Visit #{v.visit_no} · {formatDateTime(v.visited_at)}</p>
            {showStudent && <Link to={`/students/${v.students.id}`} className="font-semibold text-brand-700 hover:underline">{v.students.last_name}, {v.students.first_name} <span className="font-normal text-slate-500">({v.students.student_no})</span></Link>}
            <p className="font-medium">{v.reason}</p>
            <Row label="Observations" text={v.observations} /><Row label="Action" text={v.action_taken} /><Row label="Follow-up" text={v.follow_up} />
            <p className="text-xs text-slate-500">Recorded by {v.profiles?.full_name ?? 'unknown'}</p>
          </div>
          {onEdit && <button onClick={() => onEdit(v)} aria-label={`Edit visit ${v.visit_no}`} className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-slate-100"><Pencil className="size-4" /></button>}
        </li>
      ))}
    </ul>
  )
}
