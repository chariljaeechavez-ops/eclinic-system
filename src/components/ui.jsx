import { useEffect } from 'react'
import { Loader2, Inbox, X } from 'lucide-react'

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

export function Button({ variant = 'primary', loading = false, className = '', children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

export const Card = ({ className = '', children }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-5 ${className}`}>{children}</div>
)

export const Spinner = ({ label = 'Loading' }) => (
  <div role="status" className="flex items-center justify-center gap-2 p-8 text-slate-500">
    <Loader2 className="size-5 animate-spin" aria-hidden="true" /> {label}
  </div>
)

export const EmptyState = ({ title, hint }) => (
  <div className="flex flex-col items-center gap-2 p-8 text-center">
    <Inbox className="size-8 text-slate-400" aria-hidden="true" />
    <p className="font-semibold text-slate-700">{title}</p>
    {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
  </div>
)

export const PendingBadge = ({ children = 'Pending implementation' }) => (
  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">{children}</span>
)

export function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-lg sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-lg hover:bg-slate-100"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
      {error && <span role="alert" className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  )
}

export const inputClass = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-normal'

export function ConfirmDialog({ open, title, message, confirmLabel, danger, busy, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="mb-5 text-sm text-slate-600">{message}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
