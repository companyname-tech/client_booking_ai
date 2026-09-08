import { useEffect, useMemo, useState } from 'react'
import { repo } from '@/api/repository'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import type {
  AdminUser,
  AdminUserRole,
  PermissionCatalog,
  PermissionDescriptor,
} from '@/types/admin'

interface PermissionsEditorModalProps {
  open: boolean
  user: AdminUser | null
  catalog: PermissionCatalog | null
  onClose: () => void
  onSaved: (user: AdminUser) => void
}

interface GroupView {
  key: string
  label: string
  section: PermissionDescriptor | null
  actions: PermissionDescriptor[]
}

/** Group the catalog descriptors by their section group, preserving order. */
function buildGroups(catalog: PermissionCatalog | null): GroupView[] {
  if (!catalog) return []
  const groups: GroupView[] = []
  const byKey = new Map<string, GroupView>()
  for (const p of catalog.permissions) {
    let group = byKey.get(p.group)
    if (!group) {
      group = { key: p.group, label: p.groupLabel, section: null, actions: [] }
      byKey.set(p.group, group)
      groups.push(group)
    }
    if (p.kind === 'section') group.section = p
    else group.actions.push(p)
  }
  return groups.filter((g) => g.section !== null)
}

export function PermissionsEditorModal({ open, user, catalog, onClose, onSaved }: PermissionsEditorModalProps) {
  const [role, setRole] = useState<AdminUserRole>('client_user')
  const [checked, setChecked] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const groups = useMemo(() => buildGroups(catalog), [catalog])

  useEffect(() => {
    if (!open || !user) return
    setRole(user.role)
    // Grants are stored for role "admin" AND "client_user" (client_user:
    // empty list = full scoped access, non-empty = restricted to those areas).
    setChecked(user.role === 'super_admin' ? [] : [...(user.permissions ?? [])])
    setError('')
  }, [open, user])

  const toggle = (key: string, on: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (on) next.add(key)
      else next.delete(key)
      // Toggling a section off clears its action grants (an action without
      // its section view is meaningless and the BE rejects it).
      if (!on) {
        for (const g of groups) {
          if (g.section?.key === key) {
            for (const a of g.actions) next.delete(a.key)
          }
        }
      }
      return [...next]
    })

  const roleOptions = (() => {
    const base = (catalog?.roles ?? [])
      .filter((r) => r.value === 'admin' || r.value === 'client_user')
      .map((r) => ({ value: r.value, label: r.label }))
    if (user?.role === 'super_admin') {
      return [...base, { value: 'super_admin', label: 'Super admin' }]
    }
    return base
  })()

  const submit = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const patch: Parameters<typeof repo.updateUser>[1] = { role }
      // Grants are stored for role "admin" AND "client_user". For a client
      // user an empty list means FULL scoped access (legacy) — it restricts
      // them only once a selection is saved. super_admin clears them.
      patch.permissions =
        role === 'admin' || role === 'client_user' ? checked : []
      const saved = await repo.updateUser(user.id, patch)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const selected = (key: string) => checked.includes(key)
  const grantableRole = role === 'admin' || role === 'client_user'
  const roleHint =
    (catalog?.roles ?? []).find((r) => r.value === role)?.description ??
    (role === 'super_admin' ? 'Full access to every area (bootstrap account).' : undefined)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={user ? `Permissions — ${user.name || user.email}` : 'Permissions'}
      description="Choose the role and grant which parts of the console this user can access. Grants take effect immediately."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving || !user}>
            {saving ? 'Saving…' : 'Save permissions'}
          </Button>
        </>
      }
    >
      <div className="space-y-5 px-5 py-4">
        <FieldGroup>
          <FieldLabel htmlFor="pe-role">Role</FieldLabel>
          <Select
            id="pe-role"
            value={role}
            onChange={(v) => setRole(v as AdminUserRole)}
            ariaLabel="Role"
            options={roleOptions}
            className="w-full"
          />
          <p className="text-2xs text-fg-muted">{roleHint}</p>
        </FieldGroup>

        {role === 'super_admin' && (
          <div className="rounded-md border border-line-strong bg-surface-2 px-3 py-2.5 text-xs text-fg-secondary">
            Super admins have full access to every area — permissions are role-based and no individual grants apply.
          </div>
        )}

        {role === 'client_user' && (
          <div className="rounded-md border border-line-strong bg-surface-2 px-3 py-2.5 text-xs text-fg-secondary">
            Worker account — scoped to the assigned clients (managed on the Users screen; contact data is
            masked).{' '}
            {checked.length === 0
              ? 'No grants selected: this user keeps full access to their assigned clients.'
              : 'Access is limited to the granted console areas within their assigned clients.'}{' '}
            Grants below apply inside that scope.
          </div>
        )}

        {grantableRole && (
          <div className="space-y-3">
            {groups.length === 0 && (
              <p className="text-xs text-fg-muted">Permission catalog unavailable.</p>
            )}
            {groups.map((g) => {
              const sectionOn = g.section ? selected(g.section.key) : false
              return (
                <div key={g.key} className={cn('rounded-lg border border-line bg-surface-2/40', !sectionOn && 'opacity-60')}>
                  {g.section && (
                    <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={sectionOn}
                        onChange={(e) => toggle(g.section!.key, e.target.checked)}
                        className="size-4 accent-[var(--color-accent)]"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-fg">{g.section.label}</div>
                        <div className="text-2xs text-fg-muted">{g.section.description}</div>
                      </div>
                    </label>
                  )}
                  {g.actions.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-3 py-2">
                      {g.actions.map((a) => (
                        <label key={a.key} className={cn('flex cursor-pointer items-center gap-1.5 py-0.5 text-xs', !sectionOn && 'pointer-events-none')}>
                          <input
                            type="checkbox"
                            checked={sectionOn && selected(a.key)}
                            disabled={!sectionOn}
                            onChange={(e) => toggle(a.key, e.target.checked)}
                            className="size-3.5 accent-[var(--color-accent)]"
                          />
                          <span className="text-fg-secondary">{a.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <p className="text-2xs text-fg-faint">
              {role === 'client_user'
                ? 'An action grant always includes its section view. No grants = full access to the assigned clients.'
                : "An action grant always includes its section view. Users without any grant can't open console areas."}
            </p>
          </div>
        )}

        {error && <FieldError>{error}</FieldError>}
      </div>
    </Modal>
  )
}
