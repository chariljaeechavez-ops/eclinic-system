import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, EmptyState, Spinner, inputClass } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { AUDIT_PAGE_SIZE, listAudit, listProfiles } from '../services/users'
import { supabase } from '../services/supabaseClient'
import { formatDateTime } from '../utils/validators'

const TABLES = { students: 'Students', clinic_visits: 'Clinic visits', inventory_items: 'Inventory items', inventory_transactions: 'Stock transactions', profiles: 'User accounts' }
const ACTIONS = { insert: 'Created', update: 'Updated', delete: 'Deleted' }

export default function AuditLogs() {
  const [f, setF] = useState({ table: '', action: '', from: '', to: '' })
  const [page, setPage] = useState(0)
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setPage(0) }
  const on = Boolean(supabase)
  const log = useAsync(() => listAudit({ ...f, page }), JSON.stringify([f, page]), on)
  const people = useAsync(listProfiles, 'people', on)
  if (!on) return <Card><EmptyState title="Database not connected" /></Card>
  const names = Object.fromEntries((people.data ?? []).map((p) => [p.id, p.full_name]))
  const pages = Math.max(1, Math.ceil((log.data?.total ?? 0) / AUDIT_PAGE_SIZE))
  const btn = 'grid size-11 place-items-center rounded-lg hover:bg-slate-100 disabled:opacity-40'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit logs</h1>
      <p className="text-sm text-slate-600">Shows who changed which record and which fields changed. Values are not stored here, and entries cannot be edited or deleted.</p>
      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select value={f.table} onChange={set('table')} aria-label="Filter by record type" className={inputClass}><option value="">All record types</option>{Object.entries(TABLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select value={f.action} onChange={set('action')} aria-label="Filter by action" className={inputClass}><option value="">All actions</option>{Object.entries(ACTIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <label className="text-xs text-slate-600">From<input type="date" value={f.from} onChange={set('from')} className={inputClass} /></label>
        <label className="text-xs text-slate-600">To<input type="date" value={f.to} onChange={set('to')} className={inputClass} /></label>
      </Card>
      <Card className="p-0 sm:p-0">
        {log.loading ? <Spinner /> : log.error ? <EmptyState title="Could not load audit logs" hint={log.error} /> : !log.data.rows.length ? <EmptyState title="No audit entries found" hint="Try different filters." /> : (
          <>
            <ul className="divide-y divide-slate-100">{log.data.rows.map((r) => (
              <li key={r.id} className="space-y-0.5 p-4 text-sm">
                <p><span className="font-semibold">{ACTIONS[r.action] ?? r.action}</span> · {TABLES[r.table_name] ?? r.table_name} <span className="text-slate-500">#{r.record_id?.slice(0, 8)}</span></p>
                <p className="text-slate-600">By {names[r.actor_id] ?? 'unknown or system'} · {formatDateTime(r.created_at)}</p>
                {r.changed_fields.length > 0 && <p className="text-xs text-slate-500">Fields changed: {r.changed_fields.join(', ')}</p>}
              </li>))}</ul>
            <div className="flex items-center justify-between border-t border-slate-200 p-3 text-sm">
              <span className="text-slate-600">{log.data.total} entr{log.data.total === 1 ? 'y' : 'ies'} · Page {page + 1} of {pages}</span>
              <div className="flex gap-1"><button disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page" className={btn}><ChevronLeft className="size-5" /></button>
                <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label="Next page" className={btn}><ChevronRight className="size-5" /></button></div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
