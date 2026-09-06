import { Link } from 'react-router-dom'
import type { LeadDetail } from '@/types'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { LeadScore } from './LeadScore'
import { LeadStatusBadge } from './LeadStatusBadge'
import { AILeadAnalysis } from './AILeadAnalysis'
import { LeadTimeline } from './LeadTimeline'
import { AISummary } from '@/components/recordings/AISummary'
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer'
import { BookingCard } from '@/components/recordings/BookingCard'
import { Button } from '@/components/ui/Button'

export function LeadDrawer({
  lead,
  open,
  onClose,
}: {
  lead: LeadDetail | null
  open: boolean
  onClose: () => void
}) {
  if (!lead) return null

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={lead.name}
      subtitle={`${lead.title} · ${lead.company}`}
    >
      <div className="space-y-6">
        <Link to={`/client/leads/${lead.id}`}>
          <Button variant="primary" size="sm" className="w-full">Open full profile</Button>
        </Link>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div><span className="text-fg-muted">Location</span><p className="font-medium text-fg">{lead.location}</p></div>
          <div><span className="text-fg-muted">Status</span><div className="mt-1"><LeadStatusBadge status={lead.status} /></div></div>
          <div className="sm:col-span-2"><span className="text-fg-muted">Lead score</span><LeadScore score={lead.score} /></div>
        </div>

        <section>
          <h4 className="text-sm font-semibold text-fg">Profile</h4>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-fg-muted">Company</dt><dd className="text-fg">{lead.company}</dd></div>
            <div><dt className="text-fg-muted">Industry</dt><dd className="text-fg">{lead.industry ?? '—'}</dd></div>
            <div><dt className="text-fg-muted">Company size</dt><dd className="text-fg">{lead.companySize} employees</dd></div>
            <div><dt className="text-fg-muted">Website</dt><dd className="truncate text-fg">{lead.website ?? '—'}</dd></div>
            <div><dt className="text-fg-muted">Job title</dt><dd className="text-fg">{lead.title}</dd></div>
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
              Duration: {Math.floor(lead.latestCall.durationSec / 60)}m {lead.latestCall.durationSec % 60}s · Outcome: {lead.latestCall.outcome}
            </p>
            <RecordingPlayer durationSec={lead.latestCall.durationSec} className="mt-3" />
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
      </div>
    </DetailDrawer>
  )
}
