import { useState } from 'react'
import { Archive, ArchiveRestore, ArrowLeftRight, ChevronLeft, ChevronRight, History, Pencil, Plus, Search } from 'lucide-react'
import { Button, Card, ConfirmDialog, EmptyState, Modal, Spinner, inputClass } from '../components/ui'
import { ItemForm, StockForm } from '../components/InventoryForms'
import { useAsync } from '../hooks/useAsync'
import { itemFlags } from '../utils/inventory'
import { ITEM_CATEGORIES, formatDateTime } from '../utils/validators'
import { listItems, listTransactions, setItemArchived } from '../services/inventory'
import { supabase } from '../services/supabaseClient'

const PAGE = 10
const FILTERS = { '': 'All items', low: 'Low stock', expiring: 'Expiring soon', expired: 'Expired' }

function History_({ item }) {
  const { data, error, loading } = useAsync(() => listTransactions(item.id), item.id)
  if (loading) return <Spinner />
  if (error) return <p role="alert" className="text-sm text-red-700">{error}</p>
  if (!data.length) return <EmptyState title="No transactions yet" />
  return (
    <ul className="divide-y divide-slate-100 text-sm">{data.map((t) => (
      <li key={t.id} className="flex items-start justify-between gap-3 py-2">
        <div><p className="font-medium">{t.kind === 'in' ? 'Stock in' : 'Stock out'}{t.note ? ` · ${t.note}` : ''}</p>
          <p className="text-xs text-slate-500">{formatDateTime(t.created_at)} · {t.profiles?.full_name ?? 'unknown'}</p></div>
        <span className={`font-semibold ${t.kind === 'in' ? 'text-green-700' : 'text-red-700'}`}>{t.kind === 'in' ? '+' : '-'}{t.quantity}</span>
      </li>))}</ul>
  )
}

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(0)
  const [tick, setTick] = useState(0)
  const [modal, setModal] = useState(null) // {type:'item'|'stock'|'history'|'archive', item?}
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { data, error: loadError, loading } = useAsync(() => listItems(showArchived), `${showArchived}${tick}`, Boolean(supabase))
  if (!supabase) return <Card><EmptyState title="Database not connected" hint="Configure Supabase in .env to manage inventory. Demo mode has no database." /></Card>

  const all = (data ?? []).map((i) => ({ ...i, flags: itemFlags(i) }))
  const counts = { low: all.filter((i) => !i.is_archived && i.flags.low).length, expiring: all.filter((i) => !i.is_archived && i.flags.expiring).length, expired: all.filter((i) => !i.is_archived && i.flags.expired).length }
  const rows = all.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()) && (!filter || i.flags[filter]))
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice(page * PAGE, page * PAGE + PAGE)
  const done = (msg) => { setModal(null); setNotice(msg); setError(''); setTick((t) => t + 1) }
  const doArchive = async () => {
    setBusy(true)
    try { await setItemArchived(modal.item.id, !modal.item.is_archived); done(modal.item.is_archived ? 'Item restored.' : 'Item archived.') }
    catch (e) { setError(e.message); setModal(null) }
    setBusy(false)
  }
  const badges = (i) => (
    <span className="flex flex-wrap gap-1">
      {i.flags.expired && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Expired</span>}
      {i.flags.expiring && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Expiring soon</span>}
      {i.flags.low && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Low stock</span>}
      {i.is_archived && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">Archived</span>}
    </span>
  )
  const btn = 'grid size-11 place-items-center rounded-lg hover:bg-slate-100'
  const actions = (i) => (
    <div className="flex">
      {!i.is_archived && <button onClick={() => setModal({ type: 'stock', item: i })} aria-label={`Record stock for ${i.name}`} className={btn}><ArrowLeftRight className="size-4" /></button>}
      <button onClick={() => setModal({ type: 'history', item: i })} aria-label={`History of ${i.name}`} className={btn}><History className="size-4" /></button>
      <button onClick={() => setModal({ type: 'item', item: i })} aria-label={`Edit ${i.name}`} className={btn}><Pencil className="size-4" /></button>
      <button onClick={() => setModal({ type: 'archive', item: i })} aria-label={`${i.is_archived ? 'Restore' : 'Archive'} ${i.name}`} className={btn}>{i.is_archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}</button>
    </div>
  )
  const expiry = (i) => i.expiry_date ?? '—'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={() => setModal({ type: 'item' })}><Plus className="size-4" aria-hidden="true" /> Add item</Button>
      </div>
      {notice && <p role="status" className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-900">{notice}</p>}
      {(error || loadError) && <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-900">{error || loadError}</p>}
      <div className="grid grid-cols-3 gap-3">
        {[['low', 'Low stock'], ['expiring', 'Expiring soon'], ['expired', 'Expired']].map(([k, l]) => (
          <button key={k} onClick={() => { setFilter(filter === k ? '' : k); setPage(0) }} aria-pressed={filter === k}
            className={`rounded-xl border p-3 text-left ${filter === k ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white'}`}>
            <p className="text-2xl font-bold">{loading ? '…' : counts[k]}</p><p className="text-xs text-slate-600 sm:text-sm">{l}</p>
          </button>))}
      </div>
      <Card className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" aria-hidden="true" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} placeholder="Search items" aria-label="Search items" className={`${inputClass} pl-9`} />
        </div>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0) }} aria-label="Filter items" className={`${inputClass} md:w-44`}>{Object.entries(FILTERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={(e) => { setShowArchived(e.target.checked); setPage(0) }} className="size-4" /> Show archived</label>
      </Card>
      <Card className="p-0 sm:p-0">
        {loading ? <Spinner /> : loadError ? <EmptyState title="Could not load inventory" /> : !view.length ? (
          <EmptyState title="No items found" hint={search || filter ? 'Try a different search or filter.' : 'Add your first medicine or supply item.'} />
        ) : (
          <>
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-slate-200 text-slate-500"><tr><th className="p-3">Item</th><th className="p-3">Category</th><th className="p-3">Balance</th><th className="p-3">Low at</th><th className="p-3">Expiry</th><th className="p-3">Status</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{view.map((i) => (
                <tr key={i.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 font-medium">{i.name}</td><td className="p-3">{ITEM_CATEGORIES[i.category]}</td>
                  <td className="p-3">{i.balance} {i.unit}</td><td className="p-3">{i.low_stock_threshold}</td><td className="p-3">{expiry(i)}</td><td className="p-3">{badges(i)}</td><td className="p-3">{actions(i)}</td>
                </tr>))}</tbody>
            </table>
            <ul className="divide-y divide-slate-100 md:hidden">{view.map((i) => (
              <li key={i.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="font-semibold">{i.name}</p><p className="text-sm text-slate-600">{ITEM_CATEGORIES[i.category]} · {i.balance} {i.unit} (low at {i.low_stock_threshold})</p>
                    <p className="text-sm text-slate-500">Expiry: {expiry(i)}</p></div>
                </div>
                {badges(i)}{actions(i)}
              </li>))}</ul>
            <div className="flex items-center justify-between border-t border-slate-200 p-3 text-sm">
              <span className="text-slate-600">{rows.length} item{rows.length === 1 ? '' : 's'} · Page {page + 1} of {pages}</span>
              <div className="flex gap-1">
                <button disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page" className={`${btn} disabled:opacity-40`}><ChevronLeft className="size-5" /></button>
                <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label="Next page" className={`${btn} disabled:opacity-40`}><ChevronRight className="size-5" /></button>
              </div>
            </div>
          </>
        )}
      </Card>
      <Modal open={modal?.type === 'item'} title={modal?.item ? 'Edit item' : 'Add item'} onClose={() => setModal(null)}>{modal?.type === 'item' && <ItemForm item={modal.item} onSaved={done} onCancel={() => setModal(null)} />}</Modal>
      <Modal open={modal?.type === 'stock'} title="Record stock" onClose={() => setModal(null)}>{modal?.type === 'stock' && <StockForm item={modal.item} onSaved={done} onCancel={() => setModal(null)} />}</Modal>
      <Modal open={modal?.type === 'history'} title={`History: ${modal?.item?.name ?? ''}`} onClose={() => setModal(null)}>{modal?.type === 'history' && <History_ item={modal.item} />}</Modal>
      <ConfirmDialog open={modal?.type === 'archive'} busy={busy} danger={!modal?.item?.is_archived} title={modal?.item?.is_archived ? 'Restore item?' : 'Archive item?'}
        message={modal?.item?.is_archived ? 'This item will appear in the active list again.' : 'Archived items are hidden and cannot receive stock changes. Transaction history is kept.'}
        confirmLabel={modal?.item?.is_archived ? 'Restore' : 'Archive'} onConfirm={doArchive} onClose={() => setModal(null)} />
    </div>
  )
}
