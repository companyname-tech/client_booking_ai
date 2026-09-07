import { useState } from 'react'
import { ExternalLink, RefreshCw, CalendarClock } from 'lucide-react'
import { repo } from '@/api/repository'
import { ApiError } from '@/api/adapters/http/client'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDaySlots } from '@/hooks/useCalendarEvents'
import { startOfDay, fmtDayShort, fmtTime } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import type { CalendarMeeting } from '@/types/calendar'

const STATUS_TONE: Record<CalendarMeeting['status'], string> = {
  confirmed: 'text-success bg-success-soft/50 border-success/20',
  pending: 'text-warning bg-warning-soft/50 border-warning/20',
  cancelled: 'text-fg-muted bg-surface-2 border-line',
  completed: 'text-accent bg-accent-soft/50 border-accent/20',
}

function conflictDetail(e: unknown): string {
  if (e instanceof ApiError && e.body && typeof e.body === 'object' && 'detail' in e.body) {
    const d = (e.body as { detail?: unknown }).detail
    if (typeof d === 'string' && d) return d
  }
  return 'That time is no longer free.'
}

export function EventDetailSheet({
  meeting,
  onClose,
  onChange,
  onSync,
  clientId,
}: {
  meeting: CalendarMeeting
  onClose: () => void
  onChange: (m: CalendarMeeting) => void
  onSync?: (m: CalendarMeeting) => void
  clientId?: string
}) {
  const [busy, setBusy] = useState<'cancel' | 'reschedule' | 'sync' | null>(null)
  const [rescheduling, setRescheduling] = useState(false)
  const [day, setDay] = useState(startOfDay(new Date(meeting.scheduledFor)))
  const [slot, setSlot] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [error, setError] = useState('')

  const { slots, loading: slotsLoading, reload: reloadSlots } = useDaySlots(day, meeting.durationMin, clientId, rescheduling)

  const runCancel = async () => {
    setBusy('cancel')
    setError('')
    try {
      const updated = await repo.updateCalendarMeeting(meeting.bookingId, { status: 'cancelled' })
      setConfirmCancel(false)
      onChange(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed')
      setConfirmCancel(false)
    } finally {
      setBusy(null)
    }
  }

  const runReschedule = async () => {
    if (!slot) return
    setBusy('reschedule')
    setError('')
    try {
      const updated = await repo.updateCalendarMeeting(meeting.bookingId, { scheduledFor: slot })
      setRescheduling(false)
      setSlot('')
      onChange(updated)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError(`${conflictDetail(e)} — slots refreshed.`)
        reloadSlots()
      } else {
        setError(e instanceof Error ? e.message : 'Reschedule failed')
      }
    } finally {
      setBusy(null)
    }
  }

  const runSync = async () => {
    setBusy('sync')
    setError('')
    try {
      const res = await repo.syncCalendarMeeting(meeting.bookingId)
      if (res.state === 'synced') {
        onSync?.({ ...meeting, google: { ...(meeting.google ?? { state: 'none' }), state: 'synced', error: undefined } })
      } else {
        setError(res.error ?? 'Google sync failed — try again.')
        if (onSync) onSync(meeting)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <DetailDrawer open onClose={onClose} title={meeting.title || 'Meeting'} subtitle={`${meeting.lead.name}${meeting.offer.title ? ` · ${meeting.offer.title}` : ''}`}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full border px-2 py-0.5 text-2xs font-medium capitalize', STATUS_TONE[meeting.status])}>
              {meeting.status}
            </span>
            <span className="rounded-full border border-line px-2 py-0.5 text-2xs capitalize text-fg-muted">
              {meeting.source} booking
            </span>
            {meeting.google && meeting.google.state !== 'none' && (
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-2xs',
                  meeting.google.state === 'synced'
                    ? 'border-success/20 text-success'
                    : 'border-danger/25 bg-danger-soft/40 text-danger',
                )}
              >
                {meeting.google.state === 'synced' ? 'Synced to Google' : 'Google sync error'}
              </span>
            )}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">When</dt>
              <dd className="text-right font-medium text-fg">
                {fmtDayShort(meeting.scheduledFor)} · {fmtTime(meeting.scheduledFor)}–{fmtTime(meeting.end)}
                <span className="ml-1 text-2xs text-fg-faint">({meeting.durationMin}min · {meeting.timezone})</span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Lead</dt>
              <dd className="text-right text-fg">{meeting.lead.name} · {meeting.lead.company || '—'}</dd>
            </div>
            {meeting.notes && (
              <div className="rounded-md border border-line bg-surface-1 p-2 text-xs text-fg-secondary">{meeting.notes}</div>
            )}
          </dl>

          {meeting.meetingLink && (
            <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="interactive inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              <ExternalLink className="size-3.5" /> Join meeting
            </a>
          )}

          {meeting.status !== 'cancelled' && meeting.status !== 'completed' && (
            <div className="border-t border-line pt-4">
              {rescheduling ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-fg">Reschedule</p>
                    <Button variant="ghost" size="sm" onClick={() => setRescheduling(false)} disabled={busy !== null}>
                      Close
                    </Button>
                  </div>
                  {slotsLoading ? (
                    <p className="text-xs text-fg-muted">Checking availability…</p>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-fg-muted">No free slots that day.</p>
                  ) : (
                    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-line p-2">
                      {slots.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSlot(s)}
                          className={cn(
                            'interactive rounded border px-2 py-1 text-2xs tabular',
                            slot === s ? 'border-accent bg-accent-soft text-accent' : 'border-line text-fg-secondary',
                          )}
                        >
                          {fmtDayShort(s)} {fmtTime(s)}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setDay(startOfDay(new Date(day.getTime() + 86400000)))} disabled={busy !== null}>
                      Next day
                    </Button>
                    <Button variant="primary" size="sm" onClick={runReschedule} disabled={busy !== null || !slot}>
                      {busy === 'reschedule' ? 'Saving…' : 'Move here'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" leadingIcon={<CalendarClock className="size-3.5" />} onClick={() => setRescheduling(true)} disabled={busy !== null}>
                    Reschedule
                  </Button>
                  {meeting.google?.state === 'error' && (
                    <Button variant="secondary" size="sm" leadingIcon={<RefreshCw className="size-3.5" />} onClick={runSync} disabled={busy !== null}>
                      {busy === 'sync' ? 'Syncing…' : 'Sync to Google'}
                    </Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)} disabled={busy !== null}>
                    Cancel meeting
                  </Button>
                </div>
              )}
            </div>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </DetailDrawer>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this meeting?"
        body="The lead will be marked as contacted (server-side) and any Google calendar event will be removed."
        confirmLabel="Cancel meeting"
        busy={busy === 'cancel'}
        onConfirm={runCancel}
      />
    </>
  )
}
