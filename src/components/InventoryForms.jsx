import { useState } from 'react'
import { Button, Field, inputClass } from './ui'
import { ITEM_CATEGORIES, validateItem, validateStock } from '../utils/validators'
import { recordStock, saveItem } from '../services/inventory'

function Actions({ busy, label, onCancel }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      <Button type="submit" loading={busy}>{label}</Button>
    </div>
  )
}

export function ItemForm({ item, onSaved, onCancel }) {
  const [v, setV] = useState({ name: item?.name ?? '', category: item?.category ?? 'medicine', unit: item?.unit ?? '',
    low_stock_threshold: item?.low_stock_threshold ?? 0, expiry_date: item?.expiry_date ?? '', supplier: item?.supplier ?? '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    const errs = validateItem(v); setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true); setServerError('')
    try { await saveItem(v, item?.id); onSaved(item ? 'Item updated.' : 'Item added. Use "Stock" to record opening quantity.') }
    catch (err) { setServerError(err.message); setBusy(false) }
  }
  const text = (k, label, props = {}) => <Field label={label} error={errors[k]}><input value={v[k]} onChange={set(k)} className={inputClass} {...props} /></Field>
  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {text('name', 'Item name *')}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category *" error={errors.category}><select value={v.category} onChange={set('category')} className={inputClass}>{Object.entries(ITEM_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        {text('unit', 'Unit *', { placeholder: 'tablet, box, bottle' })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {text('low_stock_threshold', 'Low-stock threshold *', { type: 'number', min: 0, inputMode: 'numeric' })}
        {text('expiry_date', 'Expiry date', { type: 'date' })}
      </div>
      {text('supplier', 'Supplier')}
      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <Actions busy={busy} label={item ? 'Save changes' : 'Add item'} onCancel={onCancel} />
    </form>
  )
}

export function StockForm({ item, onSaved, onCancel }) {
  const [kind, setKind] = useState('in')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')
  const [key] = useState(() => crypto.randomUUID()) // one key per open dialog: retries and double-clicks cannot double-count
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    const errs = validateStock({ kind, quantity }, item.balance); setErrors(errs)
    if (Object.keys(errs).length || busy) return
    setBusy(true); setServerError('')
    try { await recordStock({ itemId: item.id, kind, quantity, note, key }); onSaved('Stock updated.') }
    catch (err) { setServerError(err.message); setBusy(false) }
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <p className="text-sm text-slate-600">{item.name} · current balance <strong>{item.balance} {item.unit}</strong></p>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Transaction type">
        {[['in', 'Stock in'], ['out', 'Stock out']].map(([k, l]) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}
            className={`min-h-11 rounded-lg border text-sm font-semibold ${kind === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300'}`}>{l}</button>
        ))}
      </div>
      <Field label="Quantity *" error={errors.quantity}><input type="number" min={1} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} /></Field>
      <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. delivery, dispensed to clinic" className={inputClass} /></Field>
      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <Actions busy={busy} label="Record" onCancel={onCancel} />
    </form>
  )
}
