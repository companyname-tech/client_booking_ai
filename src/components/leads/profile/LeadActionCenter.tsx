import type { LeadIntelligenceProfile } from '@/types/leadIntelligence'
import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { Button } from '@/components/ui/Button'

export function LeadActionCenter({
  profile,
  onAction,
}: {
  profile: LeadIntelligenceProfile
  onAction: (message: string) => void
}) {
  const { lead } = profile

  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-fg">Actions</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => onAction('Mock: call initiated')}>Call</Button>
        <Button variant="ghost" size="sm" onClick={() => onAction('Mock: email composer opened')}>Email</Button>
        <Button variant="ghost" size="sm" onClick={() => onAction('Follow-up scheduled for tomorrow 10:30 AM')}>Schedule follow-up</Button>
        <Link to={`/client/leads/${lead.id}/notes`}><Button variant="ghost" size="sm">Add note</Button></Link>
        <Button variant="ghost" size="sm" onClick={() => { repo.setLeadStatus(lead.id, 'interested'); onAction('Lead marked as qualified.') }}>Mark qualified</Button>
        <Button variant="ghost" size="sm" onClick={() => { repo.setLeadStatus(lead.id, 'not_interested'); onAction('Lead marked as not interested.') }}>Mark not interested</Button>
        <Link to={`/client/campaigns/${lead.campaignId}`}><Button variant="ghost" size="sm">Open campaign</Button></Link>
      </div>
    </div>
  )
}
