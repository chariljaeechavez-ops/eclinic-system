import { useState } from 'react'
import { Download, Printer } from 'lucide-react'
import Bars from '../components/Bars'
import { Button, Card, EmptyState, Spinner, inputClass } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { EXPORT_LIMIT, fetchVisitsForExport, getMovements, getVisitReport } from '../services/reports'
import { listItems } from '../services/inventory'
import { supabase } from '../services/supabaseClient'
import { dateKey, daysAgoKey, monthStartKey } from '../utils/dashboard'
import { downloadCsv, toCsv } from '../utils/csv'
import { itemFlags } from '../utils/inventory'
import { ITEM_CATEGORIES, LEVELS } from '../utils/validators'

const GROUPS = { day: 'Daily', week: 'Weekly', month: 'Monthly' }
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })

export default function Reports() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('visits')
  const [from, setFrom] = useState(monthStartKey())
  const [to, setTo] = useState(dateKey())
  const [group, setGroup] = useState('day')
  const [withNames, setWithNames] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [msg, setMsg] = useState('')
  const rangeError = !from || !to ? 'Choose both dates.' : from > to ? 'The start date must be before the end date.' : (new Date(to) - new Date(from)) / 86400000 > 366 ? 'The range can be at most one year.' : ''
  const on = Boolean(supabase) && !rangeError

  const visits = useAsync(() => getVisitReport(from, to, group), `v${from}${to}${group}`, on && tab === 'visits')
  const moves = useAsync(() => getMovements(from, to), `m${from}${to}`, on && tab === 'inventory')
  const items = useAsync(() => listItems(false), 'items', Boolean(supabase) && tab === 'inventory')
  if (!supabase) return <Card><EmptyState title="Database not connected" hint="Configure Supabase in .env to generate reports. Demo mode has no database." /></Card>

  const exportVisits = async () => {
    setExporting(true); setMsg('')
    try {
      const { rows, truncated } = await fetchVisitsForExport(from, to)
      const cols = [{ label: 'Visit no.', get: (r) => r.visit_no }, { label: 'Date', get: (r) => fmtDate(r.visited_at) }, { label: 'Time', get: (r) => fmtTime(r.visited_at) },
        { label: 'Level', get: (r) => LEVELS[r.students.level] }, { label: 'Grade / year', get: (r) => r.students.grade_or_year }, { label: 'Section / program', get: (r) => r.students.section_or_program }, { label: 'Reason', get: (r) => r.reason }]
      if (withNames) cols.splice(1, 0, { label: 'Student ID', get: (r) => r.students.student_no }, { label: 'Last name', get: (r) => r.students.last_name }, { label: 'First name', get: (r) => r.students.first_name })
      downloadCsv(`eclinic-visits-${from}_to_${to}.csv`, toCsv(rows, cols))
      setMsg(truncated ? `Exported the first ${EXPORT_LIMIT} visits only. Narrow the date range for the rest.` : `Exported ${rows.length} visit${rows.length === 1 ? '' : 's'}.`)
    } catch (e) { setMsg(e.message) }
    setExporting(false)
  }
  const stock = (items.data ?? []).map((i) => ({ ...i, flags: itemFlags(i) }))
  const exportInventory = () => {
    const cols = [{ label: 'Item', get: (r) => r.name }, { label: 'Category', get: (r) => ITEM_CATEGORIES[r.category] }, { label: 'Balance', get: (r) => r.balance }, { label: 'Unit', get: (r) => r.unit },
      { label: 'Low-stock threshold', get: (r) => r.low_stock_threshold }, { label: 'Expiry date', get: (r) => r.expiry_date }, { label: 'Low stock', get: (r) => (r.flags.low ? 'Yes' : 'No') }, { label: 'Expired', get: (r) => (r.flags.expired ? 'Yes' : 'No') }]
    downloadCsv(`eclinic-inventory-${dateKey()}.csv`, toCsv(stock, cols)); setMsg('Inventory exported.')
  }
  const preset = (a, b) => () => { setFrom(a); setTo(b) }
  const tabBtn = (k, l) => <button key={k} onClick={() => { setTab(k); setMsg('') }} aria-pressed={tab === k} className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${tab === k ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}>{l}</button>
  const th = 'p-3 text-left font-medium'

  return (
    <div className="space-y-4">
      <div className="print:hidden space-y-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">{tabBtn('visits', 'Clinic visits')}{tabBtn('inventory', 'Inventory')}</div>
        <Card className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-slate-600">From<input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputClass} /></label>
            <label className="text-xs text-slate-600">To<input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputClass} /></label>
            {tab === 'visits' && <label className="text-xs text-slate-600">Group by<select value={group} onChange={(e) => setGroup(e.target.value)} className={inputClass}>{Object.entries(GROUPS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={preset(dateKey(), dateKey())}>Today</Button>
            <Button variant="secondary" onClick={preset(daysAgoKey(6), dateKey())}>Last 7 days</Button>
            <Button variant="secondary" onClick={preset(monthStartKey(), dateKey())}>This month</Button>
          </div>
          {rangeError && <p role="alert" className="text-sm text-red-700">{rangeError}</p>}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
            <Button variant="secondary" onClick={() => window.print()} disabled={Boolean(rangeError)}><Printer className="size-4" aria-hidden="true" /> Print</Button>
            <Button variant="secondary" loading={exporting} disabled={Boolean(rangeError)} onClick={tab === 'visits' ? exportVisits : exportInventory}><Download className="size-4" aria-hidden="true" /> Export CSV</Button>
            {tab === 'visits' && profile.role === 'admin' && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={withNames} onChange={(e) => setWithNames(e.target.checked)} className="size-4" /> Include student ID and names (identifiable)</label>}
          </div>
          <p className="text-xs text-slate-500">CSV exports leave out student names and all health notes by default. Handle exported files according to school data privacy policy.</p>
          {msg && <p role="status" className="text-sm text-slate-700">{msg}</p>}
        </Card>
      </div>

      <div className="hidden print:block"><h1 className="text-xl font-bold">eClinic: {tab === 'visits' ? 'Clinic visits report' : 'Inventory report'}</h1><p className="text-sm">Period: {from} to {to} · Printed {dateKey()}</p></div>

      {tab === 'visits' ? (
        visits.loading ? <Spinner /> : visits.error ? <p role="alert" className="text-red-700">{visits.error}</p> : visits.data && (
          visits.data.total === 0 ? <Card><EmptyState title="No visits in this period" hint="Try a wider date range." /></Card> : (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="lg:col-span-2"><p className="text-sm text-slate-600">Total visits</p><p className="text-3xl font-bold">{visits.data.total}</p></Card>
              <Card><h2 className="mb-3 font-semibold">{GROUPS[group]} visits{group !== 'day' ? ' (period start date)' : ''}</h2><Bars data={visits.data.by_period} title="Visits by period" /></Card>
              <Card><h2 className="mb-3 font-semibold">Visits by recorded reason</h2><Bars data={visits.data.by_reason} title="Visits by reason" /></Card>
            </div>))
      ) : (
        <div className="space-y-4">
          <Card className="overflow-x-auto p-0 sm:p-0"><h2 className="p-4 pb-2 font-semibold">Current balances</h2>
            {items.loading ? <Spinner /> : !stock.length ? <EmptyState title="No inventory items" /> : (
              <table className="w-full text-sm"><thead className="border-b border-slate-200 text-slate-500"><tr><th className={th}>Item</th><th className={th}>Balance</th><th className={th}>Expiry</th><th className={th}>Status</th></tr></thead>
                <tbody>{stock.map((i) => (<tr key={i.id} className="border-b border-slate-100 last:border-0"><td className="p-3">{i.name}</td><td className="p-3">{i.balance} {i.unit}</td><td className="p-3">{i.expiry_date ?? '—'}</td>
                  <td className="p-3">{[i.flags.expired && 'Expired', i.flags.expiring && 'Expiring soon', i.flags.low && 'Low stock'].filter(Boolean).join(', ') || 'OK'}</td></tr>))}</tbody></table>)}
          </Card>
          <Card className="overflow-x-auto p-0 sm:p-0"><h2 className="p-4 pb-2 font-semibold">Stock movements in period</h2>
            {moves.loading ? <Spinner /> : moves.error ? <p role="alert" className="p-4 text-red-700">{moves.error}</p> : !moves.data?.length ? <EmptyState title="No stock movements in this period" /> : (
              <table className="w-full text-sm"><thead className="border-b border-slate-200 text-slate-500"><tr><th className={th}>Item</th><th className={th}>Stock in</th><th className={th}>Stock out</th></tr></thead>
                <tbody>{moves.data.map((m) => (<tr key={m.item_id} className="border-b border-slate-100 last:border-0"><td className="p-3">{m.name}</td><td className="p-3">+{m.stock_in} {m.unit}</td><td className="p-3">-{m.stock_out} {m.unit}</td></tr>))}</tbody></table>)}
          </Card>
        </div>
      )}
    </div>
  )
}
