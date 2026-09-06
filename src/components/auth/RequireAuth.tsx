import { Navigate, useLocation } from 'react-router-dom'
import type { Zone } from '@/lib/navigation'
import { homeForZone } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

export function RequireAuth({ zone, children }: { zone: Zone; children: React.ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (session.zone !== zone) {
    return <Navigate to={homeForZone(session.zone)} replace />
  }

  return children
}
