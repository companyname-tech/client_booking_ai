import { Link } from 'react-router-dom'
import type { EnrichedLead } from '@/types/leadIntelligence'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { LeadScore } from '../LeadScore'
import { LeadStatusBadge } from '../LeadStatusBadge'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function LeadPreviewDrawer({
  lead,
  open,
  onClose,
}: {
  lead: EnrichedLead | null
  open: boolean
  onClose: () => void
}) {
  if (!lead) return null
  return (
    <DetailDrawer open={open} onClose={onClose} title={lead.name} subtitle={`${lead.title} · ${lead.company}`}>
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2">
          <LeadStatusBadge status={lead.status} />
          <StatusBadge tone="violet">{lead.intentLabel} intent</StatusBadge>
        </div>
        <LeadScore score={lead.score} />
        <dl className="grid gap-2 text-sm">
          <div><dt className="text-fg-muted">Campaign</dt><dd className="font-medium">{lead.campaignName}</dd></div>
          <div><dt className="text-fg-muted">Last activity</dt><dd>{lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleString() : '—'}</dd></div>
          <div><dt className="text-fg-muted">Booking</dt><dd>{lead.bookingStatus ?? '—'}</dd></div>
        </dl>
        <div className="flex flex-col gap-2">
          <Link to={`/client/leads/${lead.id}`}><Button variant="primary" className="w-full">Open full profile</Button></Link>
          <Link to={`/client/campaigns/${lead.campaignId}`}><Button variant="secondary" className="w-full">View campaign</Button></Link>
        </div>
      </div>
    </DetailDrawer>
  )
}
