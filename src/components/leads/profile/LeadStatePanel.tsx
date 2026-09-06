import type { LeadIntelligenceProfile } from '@/types/leadIntelligence'
import { LeadNextAction } from './LeadProfileSections'

export function LeadStatePanel({ profile }: { profile: LeadIntelligenceProfile }) {
  const { lead } = profile

  if (lead.status === 'booked' && profile.booking) {
    return (
      <LeadNextAction action={profile.nextBestAction} booking={profile.booking} />
    )
  }

  if (lead.status === 'no_response') {
    return (
      <div className="rounded-lg border border-warning/20 bg-warning-soft/10 p-4">
        <div className="label-caps text-warning">No answer</div>
        <p className="mt-2 text-sm text-fg-secondary">Last attempt: Today 11:42 AM · Attempts: 3</p>
        <p className="mt-2 text-sm text-fg">Recommendation: Try another contact window.</p>
        <p className="mt-1 text-xs text-fg-muted">Best historical contact time: 10 AM – 12 PM</p>
      </div>
    )
  }

  if (lead.status === 'not_interested') {
    return (
      <div className="rounded-lg border border-line bg-surface-1 p-4">
        <div className="label-caps text-fg-muted">Not interested</div>
        <p className="mt-2 text-sm text-fg-secondary">Reason: Current priorities</p>
        <p className="mt-2 text-sm text-fg-muted">{profile.aiSummary}</p>
        <p className="mt-2 text-xs text-fg-faint">No action recommended.</p>
      </div>
    )
  }

  if (lead.status === 'new' || lead.status === 'queued') {
    return (
      <div className="rounded-lg border border-accent/20 bg-accent-soft/10 p-4">
        <div className="label-caps text-accent">New lead</div>
        <p className="mt-2 text-sm text-fg-secondary">No conversation yet.</p>
        <div className="mt-3">
          <div className="text-xs text-fg-muted">Why targeted</div>
          <ul className="mt-1 list-inside list-disc text-sm text-fg-secondary">
            {profile.whyTargeted.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </div>
      </div>
    )
  }

  if (profile.followUp) {
    return <LeadNextAction action={profile.followUp.action} followUp={profile.followUp} />
  }

  return <LeadNextAction action={profile.nextBestAction} followUp={profile.followUp} booking={profile.booking} />
}

export function LeadRelationshipGraph({ profile }: { profile: LeadIntelligenceProfile }) {
  const nodes = [
    profile.lead.name,
    profile.company.name,
    profile.campaignName,
    profile.conversations.length ? 'Conversations' : null,
    profile.booking ? 'Booking' : null,
  ].filter(Boolean) as string[]

  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-fg">Relationship</h3>
      <div className="mt-4 flex flex-col items-center gap-1">
        {nodes.map((node, i) => (
          <div key={node} className="flex flex-col items-center">
            <span className="rounded-md border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg">{node}</span>
            {i < nodes.length - 1 && <span className="my-1 text-fg-faint">↓</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function LeadObjectionHistory({ objections }: { objections: LeadIntelligenceProfile['objections'] }) {
  if (objections.length === 0) {
    return <p className="text-sm text-fg-muted">No objections detected across conversations.</p>
  }

  return (
    <ul className="space-y-3">
      {objections.map((o) => (
        <li key={o.label} className="rounded-lg border border-line bg-surface-1 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-fg">{o.label}</span>
            <span className="text-xs text-fg-muted">{o.occurrences} occurrence{o.occurrences > 1 ? 's' : ''}</span>
          </div>
          <div className="mt-1 text-xs text-fg-secondary">Resolution: {o.resolution}</div>
        </li>
      ))}
    </ul>
  )
}
