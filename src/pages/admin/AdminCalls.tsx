import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrainCircuit, MessageSquareText, Phone } from 'lucide-react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Reveal } from '@/components/motion/Reveal'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { SelectCheckbox } from '@/components/ui/SelectCheckbox'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RecordingAudio } from '@/components/recordings/RecordingAudio'
import { RawTranscript } from '@/components/recordings/RawTranscript'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDuration } from '@/lib/utils'
import { callHistoryOutcomeLabel, callHistoryOutcomeTone } from '@/lib/status'

/** "2026-09-07T12:34:56" → "2026-09-07 12:34" (matches the old call-history screen). */
function fmtWhen(iso: string): string {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '—'
}

export default function AdminCalls() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getCallHistory())
  const calls = data ?? []
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [outcome, setOutcome] = useState('all')
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkNotice, setBulkNotice] = useState('')
  const [reviewBusy, setReviewBusy] = useState('')
  const [transcriptOpen, setTranscriptOpen] = useState<string | null>(null)

  const promoteCall = async (call: (typeof calls)[number]) => {
    const callId = call.callId || call.leadId
    if (!callId) return
    setReviewBusy(call.id)
    setBulkNotice('')
    try {
      const reply = await repo.reviewProductionCall({
        callId,
        transcriptId: call.transcriptId,
        recordingId: call.id,
      })
      setBulkNotice(
        reply.duplicate
          ? 'That call is already in the training review queue.'
          : 'Sent to AI training review. Open the workspace to validate and publish.',
      )
    } catch (e) {
      setBulkNotice(`Review failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setReviewBusy('')
    }
  }

  const outcomeOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const c of calls) if (c.outcome) seen.add(c.outcome)
    return Array.from(seen)
  }, [calls])

  const filtered = useMemo(() => {
    let list = calls
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => `${c.leadName} ${c.phone}`.toLowerCase().includes(q))
    }
    if (outcome !== 'all') list = list.filter((c) => c.outcome === outcome)
    return list
  }, [calls, search, outcome])

  const selection = useBulkSelection(filtered.map((c) => c.id))

  const runBulkDelete = async () => {
    const ids = filtered.filter((c) => selection.selected.has(c.id)).map((c) => c.id)
    if (ids.length === 0) return
    setBulkBusy(true)
    setBulkNotice('')
    try {
      const res = await repo.bulkDeleteRecordings(ids)
      setBulkNotice(
        res.failed
          ? `Deleted ${res.affected}, ${res.failed} failed`
          : `Deleted ${res.affected} call${res.affected === 1 ? '' : 's'} and recording${res.affected === 1 ? '' : 's'}`,
      )
      selection.clear()
      setConfirmBulk(false)
      void reload()
    } catch (e) {
      setBulkNotice(`Bulk delete failed: ${e instanceof Error ? e.message : String(e)}`)
      setConfirmBulk(false)
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Operations" />}
          title="Calls & Recordings"
          description="Call history across every agent and campaign — with replayable audio."
        />
        {loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : calls.length === 0 ? (
          <EmptyState
            icon={<Phone />}
            title="No calls yet"
            description="Recorded calls will appear here after the AI reaches out to leads."
          />
        ) : (
          <Reveal className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lead or phone…"
                className="sm:max-w-xs"
              />
              <Select
                value={outcome}
                onChange={(v) => setOutcome(v)}
                ariaLabel="Filter by outcome"
                options={[
                  { value: 'all', label: 'All outcomes' },
                  ...outcomeOptions.map((o) => ({ value: o, label: callHistoryOutcomeLabel(o) })),
                ]}
                className="w-full sm:w-44"
              />
              <span className="self-center text-xs text-fg-muted sm:ml-auto">
                {filtered.length} of {calls.length} calls
              </span>
            </div>

            <BulkActionBar
              count={selection.count}
              noun="calls"
              onClear={selection.clear}
              onDelete={() => setConfirmBulk(true)}
              busy={bulkBusy}
            />
            {bulkNotice && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-fg-secondary" aria-live="polite">
                <p>{bulkNotice}</p>
                {bulkNotice.includes('training review') || bulkNotice.includes('AI training') ? (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin/ai-training')}>
                    Open AI training
                  </Button>
                ) : null}
              </div>
            )}

            <div className="surface overflow-hidden">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-2xs text-fg-muted">
                      <th className="w-10 px-3 py-2.5">
                        <SelectCheckbox
                          checked={selection.allChecked}
                          indeterminate={selection.someChecked}
                          onChange={selection.toggleAll}
                          label="Select all calls"
                        />
                      </th>
                      <th className="px-5 py-2.5 font-medium">When</th>
                      <th className="px-3 py-2.5 font-medium">Lead</th>
                      <th className="px-3 py-2.5 font-medium">Phone</th>
                      <th className="px-3 py-2.5 font-medium">Outcome</th>
                      <th className="px-3 py-2.5 font-medium">Duration</th>
                      <th className="px-5 py-2.5 font-medium">Recording</th>
                      <th className="px-3 py-2.5 font-medium">Transcript</th>
                      <th className="px-3 py-2.5 font-medium">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const hasTranscript = Boolean(c.transcript?.trim())
                      const open = transcriptOpen === c.id
                      return (
                        <Fragment key={c.id}>
                          <tr className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                            <td className="px-3 py-3">
                              <SelectCheckbox
                                checked={selection.selected.has(c.id)}
                                onChange={() => selection.toggle(c.id)}
                                label={`Select call with ${c.leadName || c.phone || c.id}`}
                              />
                            </td>
                            <td className="px-5 py-3 text-xs tabular text-fg-muted">{fmtWhen(c.startedAt)}</td>
                            <td className="px-3 py-3 font-medium text-fg">{c.leadName || '—'}</td>
                            <td className="px-3 py-3 tabular text-fg-secondary">{c.phone || '—'}</td>
                            <td className="px-3 py-3">
                              <StatusBadge tone={callHistoryOutcomeTone(c.outcome)}>
                                {callHistoryOutcomeLabel(c.outcome)}
                              </StatusBadge>
                            </td>
                            <td className="px-3 py-3 tabular text-fg-secondary">
                              {c.durationSec ? formatDuration(c.durationSec) : '—'}
                            </td>
                            <td className="px-5 py-3">
                              {c.audioUrl ? (
                                <RecordingAudio src={c.audioUrl} rowKey={c.id} className="max-w-[280px]" />
                              ) : (
                                <span className="text-fg-muted">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {hasTranscript ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  leadingIcon={<MessageSquareText className="size-3.5" />}
                                  onClick={() => setTranscriptOpen(open ? null : c.id)}
                                >
                                  {open ? 'Hide' : 'View'}
                                </Button>
                              ) : (
                                <span className="text-fg-faint">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={reviewBusy === c.id || !(c.callId || c.leadId)}
                                leadingIcon={<BrainCircuit className="size-3.5" />}
                                onClick={() => void promoteCall(c)}
                              >
                                {reviewBusy === c.id ? 'Sending…' : 'Review'}
                              </Button>
                            </td>
                          </tr>
                          {open ? (
                            <tr className="border-b border-line bg-surface-1/50 last:border-0">
                              <td colSpan={9} className="px-5 py-4">
                                <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                                  Conversation transcript
                                </h4>
                                <RawTranscript transcript={c.transcript ?? ''} />
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 p-3 md:hidden">
                <div className="flex items-center gap-2 px-1">
                  <SelectCheckbox
                    checked={selection.allChecked}
                    indeterminate={selection.someChecked}
                    onChange={selection.toggleAll}
                    label="Select all calls"
                  />
                  <span className="text-2xs text-fg-muted">Select all</span>
                </div>
                {filtered.map((c) => (
                  <div key={c.id} className="rounded-md border border-line bg-surface-1 p-3">
                    <div className="mb-2">
                      <SelectCheckbox
                        checked={selection.selected.has(c.id)}
                        onChange={() => selection.toggle(c.id)}
                        label={`Select call with ${c.leadName || c.phone || c.id}`}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-fg">{c.leadName || '—'}</div>
                      <StatusBadge tone={callHistoryOutcomeTone(c.outcome)}>
                        {callHistoryOutcomeLabel(c.outcome)}
                      </StatusBadge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-fg-muted">
                      <span>{fmtWhen(c.startedAt)}</span>
                      <span>·</span>
                      <span>{c.phone || '—'}</span>
                      <span>·</span>
                      <span>{c.durationSec ? formatDuration(c.durationSec) : '—'}</span>
                    </div>
                    {c.audioUrl && (
                      <RecordingAudio src={c.audioUrl} rowKey={c.id} className="mt-2 w-full" />
                    )}
                    {c.transcript?.trim() ? (
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          leadingIcon={<MessageSquareText className="size-3.5" />}
                          onClick={() => setTranscriptOpen(transcriptOpen === c.id ? null : c.id)}
                        >
                          {transcriptOpen === c.id ? 'Hide transcript' : 'View transcript'}
                        </Button>
                        {transcriptOpen === c.id && <RawTranscript transcript={c.transcript ?? ''} className="mt-2" />}
                      </div>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      disabled={reviewBusy === c.id || !(c.callId || c.leadId)}
                      leadingIcon={<BrainCircuit className="size-3.5" />}
                      onClick={() => void promoteCall(c)}
                    >
                      {reviewBusy === c.id ? 'Sending…' : 'Send to AI training review'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </PageContainer>
      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        title={`Delete ${selection.count} selected call${selection.count === 1 ? '' : 's'}?`}
        body={`This permanently deletes ${selection.count} call record${selection.count === 1 ? '' : 's'} and their recording${selection.count === 1 ? '' : 's'}. This cannot be undone.`}
        busy={bulkBusy}
        onConfirm={runBulkDelete}
      />
    </PageTransition>
  )
}
