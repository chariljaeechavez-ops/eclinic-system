import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Archive, ArchiveRestore, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card, ConfirmDialog, EmptyState, Modal, Spinner, inputClass } from '../components/ui'
import StudentForm from './StudentForm'
import { LEVELS } from '../utils/validators'
import { PAGE_SIZE, listStudents, setArchived } from '../services/students'
import { supabase } from '../services/supabaseClient'

export default function Students() {
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [level, setLevel] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(0)
  const [result, setResult] = useState({ key: null, rows: [], total: 0, error: '' })
  const [tick, setTick] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null) // null | {} (new) | student
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { const t = setTimeout(() => { setTerm(search); setPage(0) }, 300); return () => clearTimeout(t) }, [search])

  const reqKey = JSON.stringify([term, level, showArchived, page, tick])
  useEffect(() => {
    if (!supabase) return
    let stale = false
    listStudents({ search: term, level, showArchived, page })
      .then((d) => !stale && setResult({ key: reqKey, ...d, error: '' }))
      .catch((e) => !stale && setResult({ key: reqKey, rows: [], total: 0, error: e.message }))
    return () => { stale = true }
  }, [reqKey, term, level, showArchived, page])
  const load = () => setTick((t) => t + 1)
  const data = result
  const status = result.key !== reqKey ? 'loading' : result.error ? 'error' : 'ready'

  const doArchive = async () => {
    setBusy(true)
    try { await setArchived(confirm.id, !confirm.is_archived); setNotice(confirm.is_archived ? 'Student restored.' : 'Student archived.'); setConfirm(null); load() }
    catch (e) { setError(e.message); setConfirm(null) }
    setBusy(false)
  }
  const saved = (msg) => { setEditing(null); setNotice(msg); load() }
  const name = (s) => `${s.last_name}, ${s.first_name}${s.middle_name ? ` ${s.middle_name[0]}.` : ''}`
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  if (!supabase) return <Card><EmptyState title="Database not connected" hint="Configure Supabase in .env to manage students. Demo mode has no database." /></Card>

  const actions = (s) => (
    <div className="flex gap-1">
      <button onClick={() => setEditing(s)} aria-label={`Edit ${name(s)}`} className="grid size-11 place-items-center rounded-lg hover:bg-slate-100"><Pencil className="size-4" /></button>
      <button onClick={() => setConfirm(s)} aria-label={`${s.is_archived ? 'Restore' : 'Archive'} ${name(s)}`} className="grid size-11 place-items-center rounded-lg hover:bg-slate-100">
        {s.is_archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button onClick={() => setEditing({})}><Plus className="size-4" aria-hidden="true" /> Add student</Button>
      </div>
      {notice && <p role="status" className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-900">{notice}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-900">{error}</p>}
      <Card className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or student ID" aria-label="Search students" className={`${inputClass} pl-9`} />
        </div>
        <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(0) }} aria-label="Filter by level" className={`${inputClass} md:w-44`}>
          <option value="">All levels</option>{Object.entries(LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={(e) => { setShowArchived(e.target.checked); setPage(0) }} className="size-4" /> Show archived</label>
      </Card>
      <Card className="p-0 sm:p-0">
        {status === 'loading' ? <Spinner /> : status === 'error' ? <EmptyState title="Could not load students" hint={result.error} /> : data.rows.length === 0 ? (
          <EmptyState title="No students found" hint={term || level ? 'Try a different search or filter.' : 'Add your first student to get started.'} />
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-slate-200 text-slate-500"><tr><th className="p-3">Student ID</th><th className="p-3">Name</th><th className="p-3">Level</th><th className="p-3">Grade / year</th><th className="p-3">Section / program</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{data.rows.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 font-medium">{s.student_no}</td>
                  <td className="p-3"><Link to={`/students/${s.id}`} className="text-brand-700 hover:underline">{name(s)}</Link>{s.is_archived && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs">Archived</span>}</td>
                  <td className="p-3">{LEVELS[s.level]}</td><td className="p-3">{s.grade_or_year}</td><td className="p-3">{s.section_or_program}</td><td className="p-3">{actions(s)}</td>
                </tr>))}</tbody>
            </table>
            <ul className="divide-y divide-slate-100 md:hidden">{data.rows.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0"><p className="font-semibold"><Link to={`/students/${s.id}`} className="text-brand-700 hover:underline">{name(s)}</Link>{s.is_archived && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-normal">Archived</span>}</p>
                  <p className="text-sm text-slate-600">{s.student_no} · {LEVELS[s.level]}</p><p className="text-sm text-slate-500">{s.grade_or_year}, {s.section_or_program}</p></div>
                {actions(s)}
              </li>))}</ul>
            <div className="flex items-center justify-between border-t border-slate-200 p-3 text-sm">
              <span className="text-slate-600">{data.total} student{data.total === 1 ? '' : 's'} · Page {page + 1} of {pages}</span>
              <div className="flex gap-1">
                <button disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page" className="grid size-11 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="size-5" /></button>
                <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label="Next page" className="grid size-11 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="size-5" /></button>
              </div>
            </div>
          </>
        )}
      </Card>
      <Modal open={Boolean(editing)} title={editing?.id ? 'Edit student' : 'Add student'} onClose={() => setEditing(null)}>
        {editing && <StudentForm student={editing.id ? editing : null} onSaved={saved} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog open={Boolean(confirm)} busy={busy} danger={!confirm?.is_archived} title={confirm?.is_archived ? 'Restore student?' : 'Archive student?'}
        message={confirm?.is_archived ? 'This student will appear in the active list again.' : 'Archived students are hidden from the active list. Their visit history is kept, and an archived record can be restored.'}
        confirmLabel={confirm?.is_archived ? 'Restore' : 'Archive'} onConfirm={doArchive} onClose={() => setConfirm(null)} />
    </div>
  )
}
