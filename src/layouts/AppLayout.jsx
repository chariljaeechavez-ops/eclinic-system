import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Stethoscope, Pill, BarChart3, UserCog, ScrollText, Menu, X, LogOut } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import { isDemoMode } from '../services/supabaseClient'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/visits', label: 'Clinic visits', icon: Stethoscope },
  { to: '/inventory', label: 'Inventory', icon: Pill },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: UserCog, adminOnly: true },
  { to: '/audit-logs', label: 'Audit logs', icon: ScrollText, adminOnly: true },
]

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const items = NAV.filter((n) => !n.adminOnly || profile.role === 'admin')

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Main">
      <div className="mb-4 px-2"><Logo /></div>
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Icon className="size-5" aria-hidden="true" /> {label}
        </NavLink>
      ))}
      <div className="mt-auto border-t border-slate-200 pt-3">
        <p className="truncate px-2 text-sm font-medium">{profile.full_name}</p>
        <p className="px-2 text-xs text-slate-500">{profile.role === 'admin' ? 'Administrator' : 'Clinic staff'}</p>
        <button onClick={signOut} className="mt-2 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100">
          <LogOut className="size-5" aria-hidden="true" /> Sign out
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr] print:block">
      <aside className="sticky top-0 hidden h-screen print:!hidden border-r border-slate-200 bg-white lg:block">{sidebar}</aside>
      <header className="sticky top-0 z-40 flex items-center print:hidden justify-between border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
        <Logo className="h-8" />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid size-11 place-items-center rounded-lg hover:bg-slate-100"><Menu className="size-6" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85%] bg-white">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-2 top-2 grid size-11 place-items-center rounded-lg hover:bg-slate-100"><X className="size-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <main className="min-w-0 p-4 sm:p-6 lg:p-8 print:p-0">
        {isDemoMode && <p className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">Demo mode: fictional data only. Never enter real student information.</p>}
        <Outlet />
      </main>
    </div>
  )
}
