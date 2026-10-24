import { Link } from 'react-router-dom'
import { CalendarClock, PackageMinus, Stethoscope, Users } from 'lucide-react'
import { Card, EmptyState, PendingBadge, Spinner } from '../components/ui'
import Bars from '../components/Bars'
import VisitItems from '../components/VisitItems'
import { useAsync } from '../hooks/useAsync'
import { getSummary } from '../services/dashboard'
import { listItems } from '../services/inventory'
import { listVisits } from '../services/visits'
import { supabase } from '../services/supabaseClient'
import { itemFlags } from '../utils/inventory'
import { fillMonths } from '../utils/dashboard'

function Stat({ label, value, icon: Icon, to, loading }) {
  const body = (
    <Card className="flex items-center gap-4">
      <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon className="size-5" aria-hidden="true" /></span>
      <div><p className="text-2xl font-bold">{loading ? '…' : value ?? '—'}</p><p className="text-sm text-slate-600">{label}</p></div>
    </Card>
  )
  return to ? <Link to={to} className="block">{body}</Link> : body
}

function LiveDashboard() {
  const sum = useAsync(getSummary, 'sum')
  const inv = useAsync(() => listItems(false), 'inv')
  const rec = useAsync(() => listVisits({ page: 0 }), 'rec')
  const flags = (inv.data ?? []).map((i) => itemFlags(i))
  const low = flags.filter((f) => f.low).length
  const exp = flags.filter((f) => f.expiring || f.expired).length
  const months = fillMonths(sum.data?.monthly ?? []).map((m) => ({ ...m, name: m.label }))
  const reasons = sum.data?.reasons ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {(sum.error || inv.error || rec.error) && <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-900">{sum.error || inv.error || rec.error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Registered students" value={sum.data?.students} icon={Users} to="/students" loading={sum.loading} />
        <Stat label="Visits today" value={sum.data?.visits_today} icon={Stethoscope} to="/visits" loading={sum.loading} />
        <Stat label="Low-stock items" value={low} icon={PackageMinus} to="/inventory" loading={inv.loading} />
        <Stat label="Expiring or expired" value={exp} icon={CalendarClock} to="/inventory" loading={inv.loading} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-3 font-semibold">Visits per month (last 6 months)</h2>{sum.loading ? <Spinner /> : <Bars data={months} labelKey="name" title="Visits per month" />}</Card>
        <Card><h2 className="mb-3 font-semibold">Common reasons (last 30 days)</h2>
          {sum.loading ? <Spinner /> : reasons.length ? <Bars data={reasons} labelKey="reason" title="Common reasons" /> : <EmptyState title="No visits in the last 30 days" />}</Card>
      </div>
      <Card className="p-0 sm:p-0">
        <h2 className="p-4 pb-0 font-semibold">Recent clinic visits</h2>
        {rec.loading ? <Spinner /> : rec.data?.rows.length ? <VisitItems visits={rec.data.rows.slice(0, 5)} showStudent /> : <EmptyState title="No visits recorded yet" hint="Recorded visits will appear here." />}
      </Card>
    </div>
  )
}

function DemoDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold">Dashboard</h1><PendingBadge>No database connected</PendingBadge></div>
      <Card><EmptyState title="Dashboard figures need Supabase" hint="Configure .env and run the migrations to see live counts, trends, and alerts." /></Card>
    </div>
  )
}

export default function Dashboard() {
  return supabase ? <LiveDashboard /> : <DemoDashboard />
}
