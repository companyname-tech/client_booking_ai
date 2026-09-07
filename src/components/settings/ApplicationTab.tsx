import { useEffect, useState } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SecretInput } from './SecretInput'

/**
 * Settings → Application tab — schema-driven runtime settings (database-backed).
 * The field list comes from `GET /settings/schema`; current values come from
 * `GET /settings`. Secret fields are blank = "leave current value unchanged".
 */
export function ApplicationTab() {
  const {
    data: fields,
    loading: fieldsLoading,
    error: fieldsError,
    reload: reloadFields,
  } = useAsyncData(() => repo.getSettingsSchema())
  const {
    data: runtimeValues,
    loading: valuesLoading,
    error: valuesError,
    reload: reloadValues,
  } = useAsyncData(() => repo.getRuntimeSettings())
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (runtimeValues) setValues(runtimeValues)
  }, [runtimeValues])

  function setValue(name: string, value: unknown) {
    setValues((v) => ({ ...v, [name]: value }))
  }

  async function handleSave() {
    if (!fields) return
    setSaving(true)
    setSaved(false)
    const updates: Record<string, unknown> = {}
    for (const field of fields) {
      const raw = values[field.name]
      // Blank secret = leave unchanged (omit from the PATCH body).
      if (field.secret && (raw === '' || raw === undefined || raw === null)) continue
      updates[field.name] = raw
    }
    try {
      await repo.saveSettingsSchema(updates)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (fieldsLoading || valuesLoading) return <LoadingState rows={4} />
  if (fieldsError) return <ErrorState message={fieldsError} onRetry={reloadFields} />
  if (valuesError) return <ErrorState message={valuesError} onRetry={reloadValues} />
  if (!fields || !runtimeValues) return <EmptyState title="No data" />

  return (
    <Card flush className="px-5">
      <div className="py-4">
        <SectionHeader
          title="Application"
          description="Runtime settings stored in the database. Secrets are masked — leave a secret blank to keep its current value."
        />
      </div>
      <div className="divide-y divide-line">
        {fields.map((field) => {
          const raw = values[field.name]
          return (
            <div
              key={field.name}
              className="grid gap-2 py-3 sm:grid-cols-[260px_minmax(0,1fr)] sm:gap-6"
            >
              <div>
                <div className="text-sm font-medium text-fg">{field.label}</div>
                <div className="mt-0.5 text-xs text-fg-muted">
                  {field.type}
                  {field.restart_required ? ' · restart required' : ''}
                  {field.secret ? ' · secret' : ''}
                </div>
              </div>
              <div className="min-w-0">
                {field.type === 'boolean' ? (
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg-secondary">
                    <input
                      type="checkbox"
                      checked={Boolean(raw)}
                      onChange={(e) => setValue(field.name, e.target.checked)}
                      className="size-4 accent-[var(--color-accent)]"
                    />
                    Enabled
                  </label>
                ) : field.secret ? (
                  <SecretInput
                    value={typeof raw === 'string' ? raw : ''}
                    onChange={(e) => setValue(field.name, e.target.value)}
                    placeholder="Leave blank to keep current value"
                  />
                ) : field.type === 'integer' || field.type === 'number' ? (
                  <Input
                    type="number"
                    step={field.type === 'integer' ? 1 : 'any'}
                    value={typeof raw === 'number' ? raw : ''}
                    onChange={(e) =>
                      setValue(field.name, e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                ) : (
                  <Input
                    value={typeof raw === 'string' ? raw : ''}
                    onChange={(e) => setValue(field.name, e.target.value)}
                    autoComplete="off"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line py-3">
        {saved && <span className="mr-auto text-xs text-success">Saved</span>}
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save application settings'}
        </Button>
      </div>
    </Card>
  )
}
