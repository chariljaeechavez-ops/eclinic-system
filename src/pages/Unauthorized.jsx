import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="space-y-2">
        <ShieldAlert className="mx-auto size-10 text-red-600" aria-hidden="true" />
        <h1 className="text-xl font-bold">You don&apos;t have access to this page</h1>
        <p className="text-slate-600">Ask a clinic administrator if you need this permission.</p>
        <Link to="/" className="inline-block text-brand-600 underline">Back to dashboard</Link>
      </div>
    </div>
  )
}
