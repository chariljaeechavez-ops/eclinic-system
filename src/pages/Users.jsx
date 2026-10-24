import { useState } from 'react'
import { Pencil, UserPlus } from 'lucide-react'
import { Button, Card, ConfirmDialog, EmptyState, Field, Modal, Spinner, inputClass } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useAuth } from '../hooks/useAuth'
import { linkUser, listProfiles, updateProfile } from '../services/users'
import { supabase } from '../services/supabaseClient'
import { validateAccount } from '../utils/validators'

const ROLES = { admin: 'Administrator', staff: 'Clinic staff' }

function AccountForm({ person, onSaved, onCancel, isSelf }) {
  const [v, setV] = useState({ email: '', full_name: person?.full_name ?? '', role: person?.role ?? 'staff', is_active: person?.is_active ?? true })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target.value }))
  const save = async () => {
    setBusy(true); setServerError('')
    try { person ? await updateProfile(person.id, v) : await linkUser(v); onSaved(person ? 'Account updated.' : 'Account added. They can sign in now.') }
    catch (err) { setServerError(err.message); setBusy(false); setConfirm(false) }
  }
  const submit = (e) => {
    e.preventDefault()
    const errs = validateAccount(v, !person); setErrors(errs)
    if (Object.keys(errs).length) return
    if (person && person.is_active && !v.is_active) setConfirm(true); else save()
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {!person && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">First create the login in Supabase (Authentication, Users, Add user). Then enter the same email here to give them access.</p>}
      {!person && <Field label="Login email *" error={errors.email}><input type="email" value={v.email} onChange={set('email')} className={inputClass} autoComplete="off" /></Field>}
      <Field label="Full name *" error={errors.full_name}><input value={v.full_name} onChange={set('full_name')} className={inputClass} /></Field>
      <Field label="Role *" error={errors.role}>
        <select value={v.role} onChange={set('role')} disabled={isSelf} className={inputClass}>{Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </Field>
      {person && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={v.is_active} disabled={isSelf} onChange={(e) => setV((p) => ({ ...p, is_active: e.target.checked }))} className="size-4" /> Account is active</label>}
      {isSelf && <p className="text-xs text-slate-500">You cannot change your own role or status.</p>}
      {serverError && <p role="alert" className="text-sm text-red-700">{serverError}</p>}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={busy && !confirm}>{person ? 'Save changes' : 'Add account'}</Button>
      </div>
      <ConfirmDialog open={confirm} busy={busy} danger title="Deactivate account?" message="This person will be signed out of eClinic access immediately and cannot use the system until reactivated. Their past records are kept." confirmLabel="Deactivate" onConfirm={save} onClose={() => setConfirm(false)} />
    </form>
  )
}

export default function Users() {
  const { profile } = useAuth()
  const [tick, setTick] = useState(0)
  const [modal, setModal] = useState(null)
  const [notice, setNotice] = useState('')
  const { data, error, loading } = useAsync(listProfiles, `u${tick}`, Boolean(supabase))
  if (!supabase) return <Card><EmptyState title="Database not connected" hint="Configure Supabase in .env to manage accounts." /></Card>
  const badge = (p) => <span className={`rounded-full px-2 py-0.5 text-xs ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{p.is_active ? 'Active' : 'Inactive'}</span>
  const edit = (p) => <button onClick={() => setModal(p)} aria-label={`Edit ${p.full_name}`} className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-slate-100"><Pencil className="size-4" /></button>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setModal({})}><UserPlus className="size-4" aria-hidden="true" /> Add account</Button>
      </div>
      {notice && <p role="status" className="rounded-lg bg-green-100 px-3 py-2 text-sm text-green-900">{notice}</p>}
      <Card className="p-0 sm:p-0">
        {loading ? <Spinner /> : error ? <EmptyState title="Could not load accounts" hint={error} /> : !data.length ? <EmptyState title="No accounts" /> : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b border-slate-200 text-left text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{data.map((p) => <tr key={p.id} className="border-b border-slate-100 last:border-0"><td className="p-3 font-medium">{p.full_name}{p.id === profile.id && <span className="ml-2 text-xs text-slate-500">(you)</span>}</td><td className="p-3">{ROLES[p.role]}</td><td className="p-3">{badge(p)}</td><td className="p-3">{edit(p)}</td></tr>)}</tbody>
            </table>
            <ul className="divide-y divide-slate-100 md:hidden">{data.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 p-4">
                <div><p className="font-semibold">{p.full_name}{p.id === profile.id && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}</p><p className="text-sm text-slate-600">{ROLES[p.role]} · {badge(p)}</p></div>{edit(p)}
              </li>))}</ul>
          </>
        )}
      </Card>
      <Modal open={Boolean(modal)} title={modal?.id ? 'Edit account' : 'Add account'} onClose={() => setModal(null)}>
        {modal && <AccountForm person={modal.id ? modal : null} isSelf={modal.id === profile.id} onCancel={() => setModal(null)} onSaved={(m) => { setModal(null); setNotice(m); setTick((t) => t + 1) }} />}
      </Modal>
    </div>
  )
}
