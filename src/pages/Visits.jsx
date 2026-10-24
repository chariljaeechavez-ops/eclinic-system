import { useEffect, useState } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card, EmptyState, Modal, Spinner, inputClass } from '../components/ui'
import VisitForm from '../components/VisitForm'
import VisitItems from '../components/VisitItems'
import { useAsync } from '../hooks/useAsync'
import { VISIT_PAGE_SIZE, listVisits } from '../services/visits'
import { supabase } from '../services/supabaseClient'

export default function Visits() {
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(0)
  const [tick, setTick] = useState(0)
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  useEffect(() => { const t = setTimeout(() => { setTerm(search); setPage(0) }, 300); return () => clearTimeout(t) }, [search])

  const key = JSON.stringify([term, from, to, page, tick])
  const { data, error, loading } = useAsync(() => listVisits({ search: term, from, to, page }), key, Boolean(supabase))
  if (!supabase) return <Card><EmptyState title="Database not connected" hint="Configure Supabase in .env to record clinic visits. Demo mode has no database." /></Card>
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / VISIT_PAGE_SIZE))
  const badRange = from && to && from > to

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clinic visits</h1>
        <Button onClick={() => setEditing({})}><Plus className="size-4" aria-hidden="true" /> Record visit</Button>
      </div>
      {notice && <p role="status" className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-900">{notice}</p>}
      <Card className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name or ID" aria-label="Search visits" className={`${inputClass} pl-9`} />
        </div>
        <label className="text-xs text-slate-600">From<input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0) }} className={inputClass} /></label>
        <label className="text-xs text-slate-600">To<input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0) }} className={inputClass} /></label>
        {badRange && <p role="alert" className="text-sm text-red-700 md:col-span-3">The start date must be before the end date.</p>}
      </Card>
      <Card className="p-0 sm:p-0">
        {loading ? <Spinner /> : error ? <EmptyState title="Could not load visits" hint={error} /> : !data?.rows.length ? (
          <EmptyState title="No visits found" hint={term || from || to ? 'Try a different search or date range.' : 'Recorded visits will appear here.'} />
        ) : (
          <>
            <VisitItems visits={data.rows} showStudent onEdit={setEditing} />
            <div className="flex items-center justify-between border-t border-slate-200 p-3 text-sm">
              <span className="text-slate-600">{data.total} visit{data.total === 1 ? '' : 's'} · Page {page + 1} of {pages}</span>
              <div className="flex gap-1">
                <button disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page" className="grid size-11 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronLeft className="size-5" /></button>
                <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label="Next page" className="grid size-11 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronRight className="size-5" /></button>
              </div>
            </div>
          </>
        )}
      </Card>
      <Modal open={Boolean(editing)} title={editing?.id ? 'Edit visit' : 'Record visit'} onClose={() => setEditing(null)}>
        {editing && <VisitForm visit={editing.id ? editing : null} onCancel={() => setEditing(null)} onSaved={(m) => { setEditing(null); setNotice(m); setTick((t) => t + 1) }} />}
      </Modal>
    </div>
  )
}
