import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import AuditLogs from './pages/AuditLogs'
import Students from './pages/Students'
import StudentProfile from './pages/StudentProfile'
import Visits from './pages/Visits'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Unauthorized from './pages/Unauthorized'
import { Spinner } from './components/ui'
import { useAuth } from './hooks/useAuth'

function Protected({ adminOnly = false, children }) {
  const { profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!profile) return <Navigate to="/login" replace />
  if (adminOnly && profile.role !== 'admin') return <Unauthorized />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="visits" element={<Visits />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Protected adminOnly><Users /></Protected>} />
        <Route path="audit-logs" element={<Protected adminOnly><AuditLogs /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
