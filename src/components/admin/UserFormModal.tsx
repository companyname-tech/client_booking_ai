import { useEffect, useState } from 'react'
import { repo } from '@/api/repository'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SecretInput } from '@/components/ui/fields/SecretInput'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import type { AdminUser, AdminUserRole } from '@/types/admin'
import type { Client } from '@/types'

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: AdminUser | null
  onSaved: (user: AdminUser) => void
}

const ROLES: { value: AdminUserRole; label: string; hint?: string }[] = [
  { value: 'client_user', label: 'Worker', hint: 'Client workspace account — scoped to the assigned clients.' },
  { value: 'admin', label: 'Admin', hint: 'Console staff — access is granted per the Permissions tab.' },
]

const LEGACY_SUPER_ADMIN_ROLE: { value: AdminUserRole; label: string; hint?: string } = {
  value: 'super_admin',
  label: 'Super admin',
  hint: 'Full access to every area, including Users & Permissions.',
}

export function UserFormModal({ open, onClose, user, onSaved }: UserFormModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AdminUserRole>('client_user')
  const [clientIds, setClientIds] = useState<string[]>([])
  const [active, setActive] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setPassword('')
    setRole(user?.role ?? 'client_user')
    setClientIds(user?.clientIds ?? [])
    setActive(user?.active ?? true)
    setError('')
    repo
      .getClients({ pageSize: 100 })
      .then((page) => setClients(page.items))
      .catch(() => setClients([]))
  }, [open, user])

  const toggleClient = (id: string) =>
    setClientIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  const submit = async () => {
    if (!name.trim()) return setError('Name is required')
    if (!email.trim()) return setError('Email is required')
    if (!user && !password) return setError('Password is required for a new user')
    if (role === 'client_user' && clientIds.length === 0)
      return setError('A worker must be assigned to at least one client')
    setSaving(true)
    setError('')
    try {
      if (user) {
        const patch: Parameters<typeof repo.updateUser>[1] = {
          name: name.trim(),
          email: email.trim(),
          role,
          clientIds: role === 'client_user' ? clientIds : [],
          active,
        }
        if (password.trim()) patch.password = password.trim()
        const saved = await repo.updateUser(user.id, patch)
        onSaved(saved)
      } else {
        const saved = await repo.createUser({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          clientIds: role === 'client_user' ? clientIds : [],
          permissions: [],
        })
        onSaved(saved)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const roleOptions = user?.role === 'super_admin' ? [...ROLES, LEGACY_SUPER_ADMIN_ROLE] : ROLES

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Edit user' : 'Add user'}
      description={user ? 'Update account details, role or client access.' : 'Create a platform account.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : user ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 px-5 py-4">
        <FieldGroup>
          <FieldLabel htmlFor="uf-name" required>Name</FieldLabel>
          <Input id="uf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" data-autofocus />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="uf-email" required>Email</FieldLabel>
          <Input id="uf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel htmlFor="uf-password">{user ? 'Reset password' : 'Password'} {!user && '*'}</FieldLabel>
            <SecretInput
              id="uf-password"
              variant="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={user ? 'Leave blank to keep current' : '••••••••'}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="uf-role">Role</FieldLabel>
            <Select
              id="uf-role"
              value={role}
              onChange={(v) => setRole(v as AdminUserRole)}
              ariaLabel="Role"
              options={roleOptions}
              className="w-full"
            />
            <p className="text-2xs text-fg-muted">{roleOptions.find((r) => r.value === role)?.hint}</p>
          </FieldGroup>
        </div>

        {role === 'client_user' && (
          <FieldGroup>
            <FieldLabel required>Assigned clients</FieldLabel>
            {clients.length === 0 ? (
              <p className="text-xs text-fg-muted">No client workspaces available.</p>
            ) : (
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-line p-2">
                {clients.map((c) => {
                  const on = clientIds.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-surface-2',
                        on && 'bg-surface-3',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleClient(c.id)}
                        className="size-4 accent-[var(--color-accent)]"
                      />
                      <span className="truncate text-fg">{c.name}</span>
                      <span className="ml-auto shrink-0 text-2xs text-fg-faint">{c.id}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </FieldGroup>
        )}

        {user && (
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
            />
            <span className="text-fg">Active</span>
            <span className="text-2xs text-fg-muted">
              {active ? 'Account enabled.' : 'Soft-disables the account and revokes its JWTs.'}
            </span>
          </label>
        )}

        {error && <FieldError>{error}</FieldError>}
      </div>
    </Modal>
  )
}
