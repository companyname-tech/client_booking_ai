import { useState } from 'react'
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { PermissionsEditorModal } from '@/components/admin/PermissionsEditorModal'
import { roleLabel } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import type { AdminUser, PermissionCatalog, PermissionDescriptor } from '@/types/admin'

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  const isSuper = role === 'super_admin'
  const isAdmin = role === 'admin'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium capitalize',
        isSuper
          ? 'border-violet/25 bg-violet-soft/40 text-violet'
          : isAdmin
            ? 'border-accent/25 bg-accent-soft/40 text-accent'
            : 'border-line-strong bg-surface-2 text-fg-secondary',
      )}
    >
      {isSuper ? <ShieldCheck className="size-3" /> : isAdmin ? <KeyRound className="size-3" /> : <UserRound className="size-3" />}
      {roleLabel(role)}
    </span>
  )
}

/** Section chips + action count for a grant set (admin + client_user). */
function AccessSummary({ user, catalog }: { user: AdminUser; catalog: PermissionCatalog | null }) {
  if (user.role === 'super_admin') {
    return <span className="text-xs text-fg-secondary">Full access — every area</span>
  }
  const isClient = user.role === 'client_user'
  const grants = user.permissions ?? []
  if (isClient && grants.length === 0) {
    const n = user.clientIds.length
    return (
      <span className="text-xs text-fg-muted">
        {n === 0 ? 'No client access' : `${n} client${n === 1 ? '' : 's'} (workspace)`} — full access
      </span>
    )
  }
  const sections = (catalog?.permissions ?? []).filter((p): p is PermissionDescriptor => p.kind === 'section')
  const grantedSections = sections.filter((s) => grants.includes(s.key))
  const actionCount = grants.filter((k) => !sections.some((s) => s.key === k)).length
  if (grantedSections.length === 0) {
    return (
      <span className="text-xs text-fg-muted">
        No access yet
        {actionCount > 0 && ` (${actionCount} pending action)`}
      </span>
    )
  }
  return (
    <div className="flex max-w-[320px] flex-wrap items-center gap-1">
      {grantedSections.map((s) => (
        <span key={s.key} className="rounded-full border border-line-strong bg-surface-2 px-2 py-0.5 text-2xs text-fg-secondary">
          {s.label}
        </span>
      ))}
      {actionCount > 0 && (
        <span className="text-2xs text-fg-faint">+{actionCount} action{actionCount === 1 ? '' : 's'}</span>
      )}
    </div>
  )
}

export default function AdminPermissions() {
  const { data: users, loading, error, reload } = useAsyncData(() => repo.listUsers(), [])
  const { data: catalog } = useAsyncData(() => repo.listPermissions(), [])
  const [editor, setEditor] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null })
  const [notice, setNotice] = useState('')

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="System" />}
          title="Permissions"
          description="Grant each user access to the console areas they operate. The backend enforces these grants on every request."
        />
        {notice && <p aria-live="polite" className="text-xs text-fg-secondary">{notice}</p>}
        {loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : users && users.length === 0 ? (
          <EmptyState title="No users yet" description="Create accounts on the Users screen first." />
        ) : (
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-2xs text-fg-muted">
                    <th className="px-5 py-2.5">User</th>
                    <th className="px-3 py-2.5">Role</th>
                    <th className="px-3 py-2.5">Access / grants</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).map((u) => (
                    <tr key={u.id} className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="font-medium text-fg">{u.name || '—'}</div>
                        <div className="text-xs text-fg-muted">{u.email}</div>
                      </td>
                      <td className="px-3 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-3 py-3">
                        <AccessSummary user={u} catalog={catalog} />
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs', u.active ? 'text-success' : 'text-fg-muted')}>
                          <span className={cn('size-1.5 rounded-full', u.active ? 'bg-success' : 'bg-fg-faint')} />
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            leadingIcon={<KeyRound className="size-3.5" />}
                            onClick={() => setEditor({ open: true, user: u })}
                          >
                            Edit grants
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <PermissionsEditorModal
          open={editor.open}
          user={editor.user}
          catalog={catalog}
          onClose={() => setEditor({ open: false, user: null })}
          onSaved={(u) => {
            setNotice(`Saved grants for ${u.email}`)
            void reload()
          }}
        />
      </PageContainer>
    </PageTransition>
  )
}
