import { useState } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { TwilioNumber } from '@/types/settings'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const emptyForm = { label: '', phone: '', voice: true, whatsapp: false }

export function TwilioNumbers() {
  const { data, loading, error: loadError, reload } = useAsyncData(() => repo.getTwilioNumbers())
  const [numbers, setNumbers] = useState<TwilioNumber[] | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  function startEdit(n: TwilioNumber) {
    setEditingId(n.id)
    setForm({ label: n.label, phone: n.phone, voice: n.voice, whatsapp: n.whatsapp })
    setError(null)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  async function handleSubmit() {
    if (!form.phone.trim()) {
      setError('Phone (E.164) is required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      setNumbers(
        await repo.saveTwilioNumber({
          id: editingId ?? undefined,
          label: form.label.trim(),
          phone: form.phone.trim(),
          voice: form.voice,
          whatsapp: form.whatsapp,
        }),
      )
      resetForm()
    } finally {
      setBusy(false)
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      setNumbers(await repo.removeTwilioNumber(removeTarget))
      if (editingId === removeTarget) resetForm()
    } finally {
      setRemoving(false)
      setRemoveTarget(null)
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (loadError) return <ErrorState message={loadError} onRetry={reload} />
  if (!data) return <EmptyState title="No data" />

  const list = numbers ?? data

  return (
    <Card flush className="px-5">
      <div className="py-4">
        <SectionHeader
          title="Twilio numbers"
          description="Sender numbers the AI can call from or message with. Voice and WhatsApp capabilities come from Twilio."
        />
      </div>

      <div className="space-y-2 pb-4">
        {list.length === 0 ? (
          <div className="text-sm text-fg-muted">No Twilio numbers yet — add one below.</div>
        ) : (
          list.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-3 rounded-md border border-line bg-surface-1 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-fg">
                {n.label || n.phone}
                <span className="ml-2 text-xs text-fg-muted">{n.phone}</span>
              </span>
              {n.voice && <StatusBadge tone="info">voice</StatusBadge>}
              {n.whatsapp && <StatusBadge tone="success">whatsapp</StatusBadge>}
              <Button size="sm" variant="ghost" onClick={() => startEdit(n)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRemoveTarget(n.id)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-line py-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs text-fg-muted">Label</div>
            <Input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Main sales"
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-fg-muted">Phone (E.164)</div>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+972501234567"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-5">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg-secondary">
            <input
              type="checkbox"
              checked={form.voice}
              onChange={(e) => setForm((f) => ({ ...f, voice: e.target.checked }))}
              className="size-4 accent-[var(--color-accent)]"
            />
            Voice
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg-secondary">
            <input
              type="checkbox"
              checked={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.checked }))}
              className="size-4 accent-[var(--color-accent)]"
            />
            WhatsApp
          </label>
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
        <div className="mt-3 flex items-center justify-end gap-2">
          {editingId && (
            <Button size="sm" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Saving…' : editingId ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Twilio number?"
        body="This removes the number from your available senders. Existing calls are not affected."
        confirmLabel="Remove"
        busy={removing}
        onConfirm={() => void confirmRemove()}
      />
    </Card>
  )
}
