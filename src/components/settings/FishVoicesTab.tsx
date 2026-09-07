import { useState } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { FishVoice } from '@/types/settings'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

/**
 * Settings → Fish voices tab — named Fish Audio voice registry.
 * Each voice has a display name and a 32-character `reference_id` (the Fish
 * voice-model id used as the TTS `reference_id`).
 */
export function FishVoicesTab() {
  const { data, loading, error: loadError, reload } = useAsyncData(() => repo.getFishVoices())
  const [voices, setVoices] = useState<FishVoice[] | null>(null)
  const [name, setName] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    const rid = referenceId.trim()
    if (!rid) {
      setError('Reference ID is required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      setVoices(await repo.addFishVoice({ name: name.trim(), reference_id: rid }))
      setName('')
      setReferenceId('')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(referenceId: string) {
    if (!window.confirm('Remove this Fish voice?')) return
    setVoices(await repo.removeFishVoice(referenceId))
  }

  if (loading) return <LoadingState rows={4} />
  if (loadError) return <ErrorState message={loadError} onRetry={reload} />
  if (!data) return <EmptyState title="No data" />

  const list = voices ?? data

  return (
    <Card flush className="px-5">
      <div className="py-4">
        <SectionHeader
          title="Fish voices"
          description="Named Fish Audio voice models. The Fish default voice is always available."
        />
      </div>

      <div className="space-y-2 pb-4">
        {list.length === 0 ? (
          <div className="text-sm text-fg-muted">
            No named voices yet — add one below. The Fish default voice is always available.
          </div>
        ) : (
          list.map((v) => (
            <div
              key={v.reference_id}
              className="flex items-center gap-3 rounded-md border border-line bg-surface-1 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-fg">
                {v.name}
                <span className="ml-2 font-mono text-xs text-fg-muted">{v.reference_id}</span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => handleRemove(v.reference_id)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-line py-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-xs text-fg-muted">Name</div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Avi — warm male"
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-fg-muted">Reference ID (32 chars)</div>
            <Input
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="a1b2c3d4…"
              maxLength={32}
              className="font-mono"
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {error}
          </p>
        )}
        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="primary" onClick={handleAdd} disabled={busy}>
            {busy ? 'Adding…' : 'Add voice'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
