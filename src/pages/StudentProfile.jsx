import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button, Card, EmptyState, Modal, Spinner } from '../components/ui'
import VisitForm from '../components/VisitForm'
import VisitItems from '../components/VisitItems'
import { useAsync } from '../hooks/useAsync'
import { getStudent, listStudentVisits } from '../services/visits'
import { supabase } from '../services/supabaseClient'
import { LEVELS } from '../utils/validators'

const Item = ({ label, value }) => <div><dt className="text-xs text-slate-500">{label}</dt><dd className="text-sm">{value || '—'}</dd></div>

export default function StudentProfile() {
  const { id } = useParams()
  const [tick, setTick] = useState(0)
  const [editing, setEditing] = useState(null)
  const on = Boolean(supabase)
  const stu = useAsync(() => getStudent(id), `s${id}${tick}`, on)
  const vis = useAsync(() => listStudentVisits(id), `v${id}${tick}`, on)

  if (!on) return <Card><EmptyState title="Database not connected" /></Card>
  if (stu.loading) return <Spinner />
  if (stu.error) return <Card><EmptyState title="Could not load student" hint={stu.error} /></Card>
  if (!stu.data) return <Card><EmptyState title="Student not found" hint="The record may not exist or you may not have access." /></Card>
  const s = stu.data

  return (
    <div className="space-y-4">
      <Link to="/students" className="inline-flex min-h-11 items-center gap-1 text-sm text-brand-700"><ArrowLeft className="size-4" /> Students</Link>
      <Card>
        <h1 className="text-2xl font-bold">{s.last_name}, {s.first_name} {s.middle_name ?? ''}{s.is_archived && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-normal">Archived</span>}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Item label="Student ID" value={s.student_no} /><Item label="Level" value={LEVELS[s.level]} />
          <Item label="Grade / year" value={s.grade_or_year} /><Item label="Section / program" value={s.section_or_program} />
          <Item label="Student contact" value={s.contact_no} /><Item label="Emergency contact" value={s.guardian_name} /><Item label="Emergency contact no." value={s.guardian_contact} />
        </dl>
      </Card>
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Visit history</h2>
        {!s.is_archived && <Button onClick={() => setEditing({})}><Plus className="size-4" aria-hidden="true" /> Record visit</Button>}</div>
      <Card className="p-0 sm:p-0">
        {vis.loading ? <Spinner /> : vis.error ? <EmptyState title="Could not load visits" hint={vis.error} /> :
          !vis.data?.length ? <EmptyState title="No visits recorded" /> : <VisitItems visits={vis.data} onEdit={setEditing} />}
      </Card>
      <Modal open={Boolean(editing)} title={editing?.id ? 'Edit visit' : 'Record visit'} onClose={() => setEditing(null)}>
        {editing && <VisitForm visit={editing.id ? editing : null} student={s} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); setTick((t) => t + 1) }} />}
      </Modal>
    </div>
  )
}
