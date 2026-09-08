import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { canUse, type AccessSession } from '@/lib/permissions'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'

/** First admin path this session may actually open (used as the fallback). */
export function firstAllowedAdminPath(session: AccessSession | null): string | null {
  const order: Array<[string, string | undefined]> = [
    ['/admin/overview', undefined],
    ['/admin/clients', 'clients.view'],
    ['/admin/campaigns', 'campaigns.view'],
    ['/admin/ai-training', 'ai_training.view'],
    ['/admin/ai-training/settings', 'settings.view'],
    ['/admin/leads', 'leads.view'],
    ['/admin/calls', 'calls.view'],
    ['/admin/activity', 'activity.view'],
    ['/admin/costs', 'costs.view'],
    ['/admin/settings', 'settings.view'],
  ]
  for (const [to, perm] of order) {
    if (canUse(session, perm)) return to
  }
  return null
}

/** First client-workspace path a restricted session may open (fallback). */
export function firstAllowedClientPath(session: AccessSession | null): string | null {
  const order: Array<[string, string | undefined]> = [
    ['/client/overview', undefined],
    ['/client/campaigns', 'campaigns.view'],
    ['/client/recordings', 'calls.view'],
    ['/client/ai', 'ai_training.view'],
    ['/client/settings', 'settings.view'],
  ]
  for (const [to, perm] of order) {
    if (canUse(session, perm)) return to
  }
  return null
}

function NoAccess() {
  const location = useLocation()
  return (
    <PageContainer className="space-y-6">
      <PageHeader eyebrow="Access" title="No access" description="This area is outside your granted permissions." />
      <div className="surface flex flex-col items-center gap-4 px-6 py-16 text-center">
        <ShieldX className="size-10 text-fg-faint" />
        <p className="max-w-sm text-sm text-fg-secondary">
          Your account doesn't have permission to open <span className="text-fg">{location.pathname}</span>.
          Ask a Super Admin to grant it on the Permissions screen.
        </p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </PageContainer>
  )
}

/**
 * Route-level permission gate for console areas. super_admin and
 * unrestricted client_user (no stored grants → legacy full scoped access)
 * pass through. Role "admin" and client_user sessions WITH grants are
 * redirected to their first allowed screen when they lack `perm`; NoAccess
 * when nothing is reachable.
 */
export function PermGate({ perm, children }: { perm?: string; children: ReactNode }) {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) return <Navigate to="/login" replace />
  if (session.role === 'super_admin') return <>{children}</>
  const perms = session.permissions ?? []
  const restrictedClientUser = session.role === 'client_user' && perms.length > 0
  if (session.role !== 'admin' && !restrictedClientUser) return <>{children}</>
  if (canUse(session, perm)) return <>{children}</>
  const fallback = location.pathname.startsWith('/admin')
    ? firstAllowedAdminPath(session)
    : firstAllowedClientPath(session)
  if (fallback) return <Navigate to={fallback} replace />
  return <NoAccess />
}
