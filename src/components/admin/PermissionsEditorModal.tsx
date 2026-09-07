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
    setChecked(user.role === 'admin' ? [...(user.permissions ?? [])] : [])
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

  const roleOptions = (catalog?.roles ?? []).map((r) => ({ value: r.value, label: r.label }))

  const submit = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const patch: Parameters<typeof repo.updateUser>[1] = { role }
      // Grants are only stored for role "admin"; other roles clear them.
      patch.permissions = role === 'admin' ? checked : []
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
  const isAdminRole = role === 'admin'
  const roleHint = (catalog?.roles ?? []).find((r) => r.value === role)?.description

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

        {!isAdminRole && (
          <div className="rounded-md border border-line-strong bg-surface-2 px-3 py-2.5 text-xs text-fg-secondary">
            {role === 'super_admin'
              ? 'Super admins have full access to every area — permissions are role-based and no individual grants apply.'
              : 'Client users access the client workspace scoped to their assigned clients (managed on the Users screen). Console grants do not apply to this role.'}
          </div>
        )}

        {isAdminRole && (
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
              An action grant always includes its section view. Users without any grant can't open console areas.
            </p>
          </div>
        )}

        {error && <FieldError>{error}</FieldError>}
      </div>
    </Modal>
  )
}
