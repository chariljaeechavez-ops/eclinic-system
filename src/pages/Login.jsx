import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { Button, Card } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../services/supabaseClient'

export default function Login() {
  const { profile, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (profile) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await signIn(email.trim(), password)
    if (res.error) setError(res.error)
    setBusy(false)
  }
  const field = 'mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base'

  return (
    <div className="grid min-h-screen place-items-center bg-brand-50 p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center gap-1 text-center">
          <Logo className="h-12" />
          <p className="text-sm text-slate-500">School Clinic Management System</p>
        </div>
        {!isSupabaseConfigured && <p role="alert" className="mb-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">Supabase is not configured yet. Copy .env.example to .env and add your project values.</p>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">Email
            <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-medium">Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <Button type="submit" loading={busy} className="w-full">Sign in</Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Accounts are created by the clinic administrator.</p>
      </Card>
    </div>
  )
}
