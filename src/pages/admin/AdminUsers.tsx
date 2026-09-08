import { useState } from 'react'
import { KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserRound, Power } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { roleLabel } from '@/lib/permissions'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UserFormModal } from '@/components/admin/UserFormModal'
import { CopyableName } from '@/components/ui/CopyableName'
import { cn } from '@/lib/utils'
import type { AdminUser } from '@/types/admin'
import type { Client } from '@/types'

function RoleBadge({ role, grants }: { role: AdminUser['role']; grants?: number }) {
  const isSuper = role === 'super_admin'
  const isAdmin = role === 'admin'
  return (
    <div className="flex flex-col items-start gap-1">
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
      {isAdmin && (
        <span className="text-2xs text-fg-faint">
          {grants !== undefined && grants > 0
            ? `${grants} grant${grants === 1 ? '' : 's'}`
            : 'No grants yet'}
        </span>
      )}
    </div>
  )
}

export default function AdminUsers() {
  const { data: users, loading, error, reload } = useAsyncData(() => repo.listUsers(), [])
  const { data: clientsData } = useAsyncData(() => repo.getClients({ pageSize: 100 }), [])
  const [modal, setModal] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null })
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'disable' | 'enable'; user: AdminUser } | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const clients: Client[] = clientsData?.items ?? []
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? id

  const runConfirm = async () => {
    if (!confirm) return
    const { kind, user } = confirm
    setBusy(true)
    setNotice('')
    try {
      if (kind === 'delete') {
        await repo.deleteUser(user.id)
        setNotice(`Deleted ${user.email}`)
      } else {
        const active = kind === 'enable'
        await repo.updateUser(user.id, { active })
        setNotice(active ? `Enabled ${user.email}` : `Disabled ${user.email} — their JWTs are revoked`)
      }
      setConfirm(null)
      void reload()
    } catch (e) {
      setNotice(`${kind} failed: ${e instanceof Error ? e.message : String(e)}`)
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  const confirmText = confirm
    ? confirm.kind === 'delete'
      ? { title: `Delete ${confirm.user.email}?`, body: `This permanently removes the account. This cannot be undone.` }
      : confirm.kind === 'disable'
        ? { title: `Disable ${confirm.user.email}?`, body: `Soft-disables the account and revokes all of its JWTs immediately.` }
        : { title: `Enable ${confirm.user.email}?`, body: `Re-activates the account so it can sign in again.` }
    : { title: '', body: '' }

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="System" />}
          title="Users"
          description="Platform accounts — super admins and client-scoped users."
          actions={
            <Button variant="primary" leadingIcon={<Plus />} onClick={() => setModal({ open: true, user: null })}>
              Add user
            </Button>
          }
        />
        {notice && <p aria-live="polite" className="text-xs text-fg-secondary">{notice}</p>}
        {loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : users && users.length === 0 ? (
          <EmptyState title="No users yet" description="Add the first platform account." />
        ) : (
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-2xs text-fg-muted">
                    <th className="px-5 py-2.5">User</th>
                    <th className="px-3 py-2.5">Role</th>
                    <th className="px-3 py-2.5">Client access</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).map((u) => (
                    <tr key={u.id} className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <CopyableName
                          name={u.name || u.email}
                          id={u.id}
                          compact
                          className="font-medium text-fg"
                          onCopied={setNotice}
                        />
                        <div className="text-xs text-fg-muted">{u.email}</div>
                      </td>
                      <td className="px-3 py-3">
                        <RoleBadge role={u.role} grants={u.permissions?.length} />
                      </td>
                      <td className="px-3 py-3">
                        {u.role === 'super_admin' ? (
                          <span className="text-xs text-fg-faint">All clients</span>
                        ) : u.role === 'admin' ? (
                          <span className="text-xs text-fg-faint">Console-wide (grants right)</span>
                        ) : u.clientIds.length === 0 ? (
                          <span className="text-xs text-fg-muted">No clients</span>
                        ) : (
                          <div className="text-xs text-fg-secondary">
                            <div>{u.clientIds.length} client{u.clientIds.length === 1 ? '' : 's'}</div>
                            <div className="max-w-[220px] truncate text-2xs text-fg-faint" title={u.clientIds.map(clientName).join(', ')}>
                              {u.clientIds.map(clientName).join(', ')}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs', u.active ? 'text-success' : 'text-fg-muted')}>
                          <span className={cn('size-1.5 rounded-full', u.active ? 'bg-success' : 'bg-fg-faint')} />
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${u.email}`} onClick={() => setModal({ open: true, user: u })}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={u.active ? `Disable ${u.email}` : `Enable ${u.email}`}
                            onClick={() => setConfirm({ kind: u.active ? 'disable' : 'enable', user: u })}
                          >
                            <Power className={cn('size-3.5', u.active ? 'text-fg-muted' : 'text-success')} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${u.email}`}
                            className="hover:text-danger"
                            onClick={() => setConfirm({ kind: 'delete', user: u })}
                          >
                            <Trash2 className="size-3.5 text-fg-faint" />
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

        <UserFormModal
          open={modal.open}
          user={modal.user}
          onClose={() => setModal({ open: false, user: null })}
          onSaved={() => void reload()}
        />
        <ConfirmDialog
          open={confirm !== null}
          onClose={() => !busy && setConfirm(null)}
          title={confirmText.title}
          body={confirmText.body}
          confirmLabel={confirm?.kind === 'delete' ? 'Delete' : confirm?.kind === 'disable' ? 'Disable' : 'Enable'}
          busy={busy}
          onConfirm={runConfirm}
        />
      </PageContainer>
    </PageTransition>
  )
}
