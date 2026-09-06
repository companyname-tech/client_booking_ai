import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { clientRoutes, adminRoutes } from './routes'

const LoginPage = lazy(() => import('@/pages/LoginPage'))

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
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
])
