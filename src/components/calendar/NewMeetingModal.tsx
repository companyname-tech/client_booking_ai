import { useEffect, useState } from 'react'
import { repo } from '@/api/repository'
import { ApiError } from '@/api/adapters/http/client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { useDaySlots } from '@/hooks/useCalendarEvents'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fmtDayShort, fmtTime, startOfDay, toDateInputValue, fromDateInputValue } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import type { Lead, OfferCampaign } from '@/types'
import type { CalendarMeeting } from '@/types/calendar'

const DURATIONS = [30, 60, 90]

function conflictDetail(e: unknown): string {
  if (e instanceof ApiError && e.body && typeof e.body === 'object' && 'detail' in e.body) {
    const d = (e.body as { detail?: unknown }).detail
    if (typeof d === 'string' && d) return d
  }
  return 'Conflict'
}

export function NewMeetingModal({
  open,
  onClose,
  initialDay,
  clientId,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  initialDay: Date
  clientId?: string
  onCreated: (m: CalendarMeeting) => void
}) {
  const [campaignId, setCampaignId] = useState('')
  const [leadId, setLeadId] = useState('')
  const [day, setDay] = useState(startOfDay(initialDay))
  const [slot, setSlot] = useState('')
  const [durationMin, setDurationMin] = useState(60)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data: campaignsData } = useAsyncData(() => repo.getCampaigns(), [])
  const campaigns = (campaignsData ?? []) as OfferCampaign[]
  const { data: leadsData } = useAsyncData(
    () => (campaignId ? repo.getLeads(campaignId) : Promise.resolve([] as Lead[])),
    [campaignId],
  )
  const leads = (leadsData ?? []) as Lead[]

  const { slots, loading: slotsLoading, reload: reloadSlots } = useDaySlots(
    day,
    durationMin,
    clientId,
    open && !!leadId,
  )

  useEffect(() => {
    if (!open) return
    setCampaignId('')
    setLeadId('')
    setDay(startOfDay(initialDay))
    setSlot('')
    setTitle('')
    setNotes('')
    setDurationMin(60)
    setError('')
  }, [open, initialDay])

  const submit = async () => {
    if (!leadId) return setError('Pick a lead')
    if (!slot) return setError('Pick a time slot')
    setSaving(true)
    setError('')
    try {
      const created = await repo.createCalendarMeeting({
        leadId,
        scheduledFor: slot,
        durationMin,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onCreated(created)
      onClose()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError(`${conflictDetail(e)} — available slots were refreshed.`)
        reloadSlots()
      } else if (e instanceof ApiError && e.status === 403) {
        setError('This lead is outside your workspace scope.')
      } else {
        setError(e instanceof Error ? e.message : 'Failed to create meeting')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New meeting"
      description="Book a lead into a free time slot."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? 'Booking…' : 'Book meeting'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 px-5 py-4">
        <FieldGroup>
          <FieldLabel htmlFor="nm-campaign">Campaign</FieldLabel>
          <Select
            id="nm-campaign"
            value={campaignId}
            onChange={(v) => {
              setCampaignId(v)
              setLeadId('')
              setSlot('')
            }}
            ariaLabel="Campaign"
            placeholder="Choose a campaign…"
            options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
            className="w-full"
          />
        </FieldGroup>

        {campaignId && (
          <FieldGroup>
            <FieldLabel required>Lead</FieldLabel>
            {leads.length === 0 ? (
              <p className="text-xs text-fg-muted">No leads in this campaign.</p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-line p-2">
                {leads.map((l) => (
                  <label
                    key={l.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-surface-2',
                      leadId === l.id && 'bg-surface-3',
                    )}
                  >
                    <input
                      type="radio"
                      name="nm-lead"
                      checked={leadId === l.id}
                      onChange={() => {
                        setLeadId(l.id)
                        setSlot('')
                      }}
                      className="size-4 accent-[var(--color-accent)]"
                    />
                    <span className="min-w-0 truncate">
                      <span className="block truncate text-fg">{l.name || '—'}</span>
                      <span className="block truncate text-2xs text-fg-muted">
                        {l.company || l.title || ''}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </FieldGroup>
        )}

        {leadId && (
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <FieldLabel>Duration</FieldLabel>
              <Select
                value={String(durationMin)}
                onChange={(v) => {
                  setDurationMin(Number(v))
                  setSlot('')
                }}
                ariaLabel="Duration"
                options={DURATIONS.map((d) => ({ value: String(d), label: `${d} min` }))}
                className="w-full"
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Day</FieldLabel>
              <Input
                type="date"
                value={toDateInputValue(day)}
                onChange={(e) => {
                  if (e.target.value) {
                    setDay(startOfDay(fromDateInputValue(e.target.value)))
                    setSlot('')
                  }
                }}
              />
            </FieldGroup>
          </div>
        )}

        {leadId && (
          <FieldGroup>
            <FieldLabel required>Time slot</FieldLabel>
            {slotsLoading ? (
              <p className="text-xs text-fg-muted">Checking availability…</p>
            ) : slots.length === 0 ? (
              <p className="text-xs text-fg-muted">No free slots that day — try another day or duration.</p>
            ) : (
              <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-line p-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={cn(
                      'interactive rounded border px-2 py-1 text-2xs tabular transition-colors',
                      slot === s
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line text-fg-secondary hover:border-line-strong',
                    )}
                  >
                    {fmtDayShort(s)} {fmtTime(s)}
                  </button>
                ))}
              </div>
            )}
          </FieldGroup>
        )}

        <FieldGroup>
          <FieldLabel htmlFor="nm-title">Title</FieldLabel>
          <Input id="nm-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to the lead name" />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="nm-notes">Notes</FieldLabel>
          <textarea
            id="nm-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            placeholder="Anything the agent should know"
          />
        </FieldGroup>
        {error && <FieldError>{error}</FieldError>}
      </div>
    </Modal>
  )
}
