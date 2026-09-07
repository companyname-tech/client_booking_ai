import { useEffect, useState, type ChangeEvent } from 'react'
import type { LeadDetail, LeadStatus } from '@/types'
import { repo } from '@/api/repository'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Select } from '@/components/ui/Select'
import { LeadScore } from './LeadScore'
import { LeadStatusBadge } from './LeadStatusBadge'
import { AILeadAnalysis } from './AILeadAnalysis'
import { LeadTimeline } from './LeadTimeline'
import { AISummary } from '@/components/recordings/AISummary'
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer'
import { BookingCard } from '@/components/recordings/BookingCard'
import { Button } from '@/components/ui/Button'
import { formatDuration } from '@/lib/utils'

const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'queued',
  'contacted',
  'interested',
  'details_requested',
  'booked',
  'not_interested',
  'no_response',
  'do_not_contact',
  'unreachable',
]

type LeadForm = {
  name: string
  title: string
  company: string
  industry: string
  status: LeadStatus
  phone: string
  email: string
  location: string
}

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent'

export function LeadDrawer({
  lead,
  open,
  onClose,
  onUpdate,
  startInEdit,
}: {
  lead: LeadDetail | null
  open: boolean
  onClose: () => void
  onUpdate?: (lead: LeadDetail) => void
  /** Open the drawer already in edit mode (row-level Edit action). */
  startInEdit?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<LeadForm>({
    name: '',
    title: '',
    company: '',
    industry: '',
    status: 'new',
    phone: '',
    email: '',
    location: '',
  })

  // When opened via a row-level Edit action, enter edit mode once the detail loads.
  useEffect(() => {
    if (!open || !lead || !startInEdit) return
    setForm({
      name: lead.name,
      title: lead.title,
      company: lead.company,
      industry: lead.industry ?? '',
      status: lead.status,
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      location: lead.location,
    })
    setEditing(true)
  }, [open, lead, startInEdit])

  if (!lead) return null

  const startEdit = () => {
    setForm({
      name: lead.name,
      title: lead.title,
      company: lead.company,
      industry: lead.industry ?? '',
      status: lead.status,
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      location: lead.location,
    })
    setEditing(true)
  }

  const set =
    (k: 'name' | 'title' | 'company' | 'industry' | 'phone' | 'email' | 'location') =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      const updated = await repo.updateLead(lead.id, form)
      onUpdate?.({ ...lead, ...updated })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={lead.name}
      subtitle={`${lead.title} · ${lead.company}`}
    >
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          {editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={startEdit}>
              Edit
            </Button>
          )}
        </div>

        {editing ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
          >
            <div>
              <span className="text-fg-muted">Name</span>
              <input className={inputClass} value={form.name} onChange={set('name')} />
            </div>
            <div>
              <span className="text-fg-muted">Job title</span>
              <input className={inputClass} value={form.title} onChange={set('title')} />
            </div>
            <div>
              <span className="text-fg-muted">Company</span>
              <input className={inputClass} value={form.company} onChange={set('company')} />
            </div>
            <div>
              <span className="text-fg-muted">Industry</span>
              <input className={inputClass} value={form.industry} onChange={set('industry')} />
            </div>
            <div>
              <span className="text-fg-muted">Location</span>
              <input className={inputClass} value={form.location} onChange={set('location')} />
            </div>
            <div>
              <span className="text-fg-muted">Phone</span>
              <input className={inputClass} value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <span className="text-fg-muted">Email</span>
              <input className={inputClass} value={form.email} onChange={set('email')} />
            </div>
            <div>
              <span className="text-fg-muted">Status</span>
              <Select
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v as LeadStatus }))}
                ariaLabel="Status"
                placeholder="— Status —"
                options={LEAD_STATUSES.map((s) => ({ value: s, label: s.replaceAll('_', ' ') }))}
                className="mt-1 w-full"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="w-full" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        ) : (
          <>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-fg-muted">Location</span>
                <p className="font-medium text-fg">{lead.location}</p>
              </div>
              <div>
                <span className="text-fg-muted">Status</span>
                <div className="mt-1">
                  <LeadStatusBadge status={lead.status} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-fg-muted">Lead score</span>
                <LeadScore score={lead.score} />
              </div>
            </div>

            <section>
              <h4 className="text-sm font-semibold text-fg">Profile</h4>
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-fg-muted">Company</dt>
                  <dd className="text-fg">{lead.company}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Industry</dt>
                  <dd className="text-fg">{lead.industry ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Company size</dt>
                  <dd className="text-fg">{lead.companySize} employees</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Website</dt>
                  <dd className="truncate text-fg">{lead.website ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Job title</dt>
                  <dd className="text-fg">{lead.title}</dd>
                </div>
              </dl>
            </section>

            <AILeadAnalysis analysis={lead.analysis} />

            {lead.timeline.length > 0 && (
              <section>
                <h4 className="mb-3 text-sm font-semibold text-fg">Timeline</h4>
                <LeadTimeline events={lead.timeline} />
              </section>
            )}

            {lead.latestCall && (
              <section>
                <h4 className="text-sm font-semibold text-fg">Latest call</h4>
                <p className="mt-1 text-xs text-fg-muted">
                  Duration: {formatDuration(lead.latestCall.durationSec)} · Outcome: {lead.latestCall.outcome}
                </p>
                <RecordingPlayer
                  audioUrl={lead.latestCall.recordingUrl}
                  durationSec={lead.latestCall.durationSec}
                  className="mt-3"
                />
                <AISummary
                  summary={lead.latestCall.summary}
                  signals={lead.latestCall.signals}
                  confidence={lead.latestCall.confidence}
                  className="mt-3"
                />
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" size="sm">AI-generated transcript</Button>
                  <Button variant="ghost" size="sm">View full summary</Button>
                </div>
              </section>
            )}

            {lead.booking && <BookingCard booking={lead.booking} />}
          </>
        )}
      </div>
    </DetailDrawer>
  )
}
