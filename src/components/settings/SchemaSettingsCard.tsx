import { useEffect, useState } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import type { SettingsSchemaField } from '@/types/settings'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SecretInput } from './SecretInput'

/**
 * Schema-driven runtime-settings editor. The field list comes from
 * `GET /settings/schema`; current values from `GET /settings`. A `filter`
 * selects which fields this card renders, so the same editor backs the
 * Application and Twilio tabs. Secret fields blank = "leave unchanged".
 */
export function SchemaSettingsCard({
  title,
  description,
  filter,
  hiddenNote,
}: {
  title: string
  description: string
  filter: (field: SettingsSchemaField) => boolean
  hiddenNote?: string
}) {
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

  const visible = (fields ?? []).filter(filter)
  const hiddenCount = (fields ?? []).length - visible.length

  function setValue(name: string, value: unknown) {
    setValues((v) => ({ ...v, [name]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const updates: Record<string, unknown> = {}
    for (const field of visible) {
      const raw = values[field.name]
      // Blank secret = leave unchanged (omit from the PUT body).
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
        <SectionHeader title={title} description={description} />
      </div>
      <div className="divide-y divide-line">
        {visible.map((field) => {
          const raw = values[field.name]
          return (
            <div key={field.name} className="grid gap-2 py-3 sm:grid-cols-[260px_minmax(0,1fr)] sm:gap-6">
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
      {hiddenNote && hiddenCount > 0 && (
        <div className="border-t border-line py-3 text-xs text-fg-muted">{hiddenNote}</div>
      )}
      <div className="flex items-center justify-end gap-2 border-t border-line py-3">
        {saved && <span className="mr-auto text-xs text-success">Saved</span>}
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </Card>
  )
}
