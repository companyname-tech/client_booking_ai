import { useEffect, useMemo, useState } from 'react'
import { Loader2, PhoneForwarded } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { repo } from '@/api/repository'
import type { Call } from '@/types'
import { formatDuration } from '@/lib/utils'

export function ProductionCallReviewPanel({
  campaignId,
  onReviewed,
}: {
  campaignId: string
  onReviewed: () => void
}) {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [manualId, setManualId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    repo
      .getCalls(campaignId)
      .then((rows) => {
        if (!cancelled) setCalls(rows)
      })
      .catch((e) => {
        if (!cancelled) {
          setCalls([])
          setError(e instanceof Error ? e.message : String(e))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignId])

  const visible = useMemo(
    () =>
      calls.filter((row) => !campaignId || row.offerCampaignId === campaignId).slice(0, 8),
    [calls, campaignId],
  )

  const promote = async (callId: string, extras?: { transcriptId?: string; recordingId?: string }) => {
    const id = callId.trim()
    if (!id) return
    setBusyId(id)
    setError('')
    setNotice('')
    try {
      const reply = await repo.reviewProductionCall({
        callId: id,
        transcriptId: extras?.transcriptId,
        recordingId: extras?.recordingId,
      })
      setNotice(
        reply.duplicate
          ? 'That call was already in the review queue.'
          : 'Call sent to review — candidates are in Agent memory review. Validate, then publish.',
      )
      onReviewed()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="surface p-5">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <PhoneForwarded className="size-4 text-accent" />
          Promote a live call for review
        </h3>
        <p className="mt-1 text-xs text-fg-muted">
          Same evidence pack as a training talk. This only creates candidates — publish is still required
          before live behavior changes.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block min-w-[220px] flex-1">
          <span className="mb-1.5 block text-xs font-medium text-fg-secondary">
            Orchestrator call id or lead id
          </span>
          <Input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="lead id or conversation id"
            className="h-8 text-xs"
          />
        </label>
        <Button
          size="sm"
          variant="primary"
          disabled={!manualId.trim() || !!busyId}
          onClick={() => void promote(manualId)}
        >
          {busyId && busyId === manualId.trim() ? 'Sending…' : 'Send to review'}
        </Button>
      </div>

      {!campaignId ? (
        <p className="mt-3 text-sm text-fg-faint">Pick a campaign to list its recent calls.</p>
      ) : loading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin" /> Loading calls…
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-3 text-sm text-fg-faint">No calls on this campaign yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-md border border-line">
          {visible.map((call) => {
            const reviewId = call.leadId || call.id
            return (
              <li key={call.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0 text-xs">
                  <p className="truncate font-medium text-fg">{call.summary || call.leadId || call.id}</p>
                  <p className="text-fg-muted">
                    {call.startedAt ? call.startedAt.slice(0, 16).replace('T', ' ') : '—'}
                    {call.durationSec ? ` · ${formatDuration(call.durationSec)}` : ''}
                    {call.outcome ? ` · ${call.outcome}` : ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!!busyId || !reviewId}
                  onClick={() => void promote(reviewId)}
                >
                  {busyId === reviewId ? 'Sending…' : 'Review'}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
      {notice ? <p className="mt-2 text-xs text-fg-secondary">{notice}</p> : null}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  )
}
