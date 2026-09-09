import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RouteErrorFallback } from '@/components/errors/RouteErrorFallback'
import { useAuth } from '@/contexts/AuthContext'
import { homeForZone } from '@/lib/auth'
import { lazyRoute } from '@/lib/lazyRoute'
import { clientRoutes, adminRoutes } from './routes'

const LoginPage = lazyRoute(() => import('@/pages/LoginPage'))

/** `/` → zone home if authenticated, otherwise `/login`. */
function RootRedirect() {
  const { session } = useAuth()
  if (session) return <Navigate to={homeForZone(session.zone)} replace />
  return <Navigate to="/login" replace />
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorFallback />,
    children: [
      { path: '/', element: <RootRedirect /> },
      { path: '/login', element: <LoginPage /> },

      {
        path: '/client',
        element: (
          <RequireAuth zone="client">
            <AppShell zone="client" />
          </RequireAuth>
        ),
        children: clientRoutes,
      },

      {
        path: '/admin',
        element: (
          <RequireAuth zone="admin">
            <AppShell zone="admin" />
          </RequireAuth>
        ),
        children: adminRoutes,
      },

      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
])
