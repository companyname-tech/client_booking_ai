import { Link } from 'react-router-dom'
import type { LeadIntelligenceProfile } from '@/types/leadIntelligence'
import { LeadScore } from '../LeadScore'
import { LeadStatusBadge } from '../LeadStatusBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function LeadProfileHeader({ profile }: { profile: LeadIntelligenceProfile }) {
  const { lead } = profile
  return (
    <div className="surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">{lead.name}</h1>
          <p className="mt-1 text-sm text-fg-muted">{lead.title}</p>
          <p className="text-sm text-fg-secondary">{lead.company} · {lead.location}</p>
          <Link to={`/client/campaigns/${lead.campaignId}`} className="mt-2 inline-block text-xs font-medium text-accent">{profile.campaignName}</Link>
          <div className="mt-3 flex flex-wrap gap-2">
            <LeadStatusBadge status={lead.status} />
            <StatusBadge tone={profile.intent === 'very_high' || profile.intent === 'high' ? 'success' : 'neutral'}>{profile.intentLabel} intent</StatusBadge>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <LeadScore score={profile.scoreBreakdown.overall} />
          <span className="text-xs text-fg-muted">Simulated lead intelligence score</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => window.alert('Mock: call initiated')}>Call</Button>
        <Button variant="ghost" size="sm" onClick={() => window.alert('Mock: email composer')}>Email</Button>
        <Link to={`/client/campaigns/${lead.campaignId}`}><Button variant="ghost" size="sm">View campaign</Button></Link>
        {profile.conversationId && <Link to={`/client/ai/conversations/${profile.conversationId}`}><Button variant="ghost" size="sm">View conversation</Button></Link>}
      </div>
    </div>
  )
}

export function LeadScoreBreakdown({ breakdown }: { breakdown: LeadIntelligenceProfile['scoreBreakdown'] }) {
  const items = [
    { label: 'Company fit', value: breakdown.companyFit },
    { label: 'Decision maker', value: breakdown.decisionMaker },
    { label: 'Offer relevance', value: breakdown.offerRelevance },
    { label: 'Engagement', value: breakdown.engagement },
    { label: 'Intent', value: breakdown.intent },
  ]
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-semibold tabular text-fg">{breakdown.overall}</span>
        <span className="text-sm text-fg-muted">/ 100 · {breakdown.label}</span>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <div key={i.label}>
            <div className="flex justify-between text-xs"><span className="text-fg-muted">{i.label}</span><span className="tabular">{i.value}</span></div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-violet/70" style={{ width: `${i.value}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LeadAISummary({ profile }: { profile: LeadIntelligenceProfile }) {
  return (
    <div className="rounded-lg border border-violet/20 bg-violet-soft/10 p-4">
      <h3 className="text-sm font-semibold text-fg">AI Lead Summary</h3>
      <p className="mt-2 text-sm text-fg-secondary">{profile.aiSummary}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {Object.entries(profile.summaryFields).map(([k, v]) => (
          <div key={k}><dt className="capitalize text-fg-muted">{k.replace(/([A-Z])/g, ' $1')}</dt><dd className="font-medium text-fg">{v}</dd></div>
        ))}
      </dl>
    </div>
  )
}

export function LeadNextAction({ action, followUp, booking }: { action: string; followUp?: LeadIntelligenceProfile['followUp']; booking?: LeadIntelligenceProfile['booking'] }) {
  if (booking) {
    return (
      <div className="rounded-lg border border-success/20 bg-success-soft/10 p-4">
        <div className="label-caps text-success">Meeting booked</div>
        <div className="mt-2 text-lg font-semibold text-fg">{booking.datetime}</div>
        <div className="text-sm text-fg-muted">{booking.duration} · {booking.channel} · {booking.meetingType}</div>
        <div className="mt-2 text-xs text-fg-secondary">Status: {booking.status}</div>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <div className="label-caps">Next best action</div>
      <p className="mt-2 font-medium text-fg">{action}</p>
      {followUp && <p className="mt-1 text-sm text-fg-muted">{followUp.scheduledFor} · {followUp.reason}</p>}
    </div>
  )
}

export function LeadSignals({ signals }: { signals: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {signals.map((s) => (
        <span key={s} className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-2xs font-medium text-fg-secondary">{s}</span>
      ))}
    </div>
  )
}

export function LeadJourney({ stages }: { stages: LeadIntelligenceProfile['journey'] }) {
  return (
    <ol className="space-y-0">
      {stages.map((s, i) => (
        <li key={s.id} className="relative flex gap-4 pb-4 last:pb-0">
          {i < stages.length - 1 && <span aria-hidden className="absolute left-[5px] top-3 h-[calc(100%-4px)] w-px bg-line-strong" />}
          <span className={cn('relative z-10 mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-surface-1', s.completed ? 'bg-accent' : 'bg-fg-faint')} />
          <div>
            <div className="text-sm font-medium text-fg">{s.label}</div>
            {s.timestamp && <time className="text-2xs text-fg-muted">{s.timestamp}</time>}
            {s.detail && <div className="text-2xs text-fg-muted">{s.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function LeadIntentChart({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((p) => p.value), 1)
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-fg">Intent over time</h3>
      <p className="text-2xs text-fg-muted">Simulated intent score</p>
      <div className="mt-4 flex items-end gap-2 h-24">
        {points.map((p) => (
          <div key={p.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t bg-violet/60" style={{ height: `${(p.value / max) * 100}%` }} />
            <span className="text-2xs text-fg-muted">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LeadCompanyIntelligence({ company }: { company: LeadIntelligenceProfile['company'] }) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-lg font-semibold text-fg">{company.name}</h3>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-fg-muted">Industry</dt><dd>{company.industry}</dd></div>
        <div><dt className="text-fg-muted">Employees</dt><dd>{company.employees}</dd></div>
        <div><dt className="text-fg-muted">Location</dt><dd>{company.location}</dd></div>
        <div><dt className="text-fg-muted">Website</dt><dd>{company.website}</dd></div>
      </dl>
      <div className="mt-4 text-2xl font-semibold tabular">Company fit: {company.companyFit}%</div>
      <div className="mt-3 space-y-2">
        {company.fitBreakdown.map((f) => (
          <div key={f.label} className="flex justify-between text-xs"><span className="text-fg-muted">{f.label}</span><span className="tabular">{f.value}%</span></div>
        ))}
      </div>
      <p className="mt-3 text-2xs text-fg-faint">Mock company intelligence — not real enrichment</p>
    </div>
  )
}

export function LeadContactInfo({ contact, lead }: { contact: LeadIntelligenceProfile['contact']; lead: LeadIntelligenceProfile['lead'] }) {
  const copy = (text: string) => { navigator.clipboard?.writeText(text); window.alert('Copied to clipboard') }
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-fg">Contact</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div><dt className="text-fg-muted">Name</dt><dd>{lead.name}</dd></div>
        <div><dt className="text-fg-muted">Role</dt><dd>{lead.title}</dd></div>
        <div className="flex items-center justify-between gap-2"><dt className="text-fg-muted">Email</dt><dd className="flex items-center gap-2"><span>{contact.email}</span><Button variant="ghost" size="sm" onClick={() => copy(contact.email)}>Copy</Button></dd></div>
        <div className="flex items-center justify-between gap-2"><dt className="text-fg-muted">Phone</dt><dd className="flex items-center gap-2"><span>{contact.phone}</span><Button variant="ghost" size="sm" onClick={() => copy(contact.phone)}>Copy</Button></dd></div>
      </dl>
    </div>
  )
}

export function LeadAIInsights({ insights }: { insights: { strongestSignal: string; objections: string[]; positiveSignals: string[]; recommendedAction: string } }) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-fg">AI Conversation Insights</h3>
      <p className="mt-2 text-sm"><span className="text-fg-muted">Strongest signal:</span> {insights.strongestSignal}</p>
      {insights.objections.length > 0 && <div className="mt-2"><span className="text-xs text-fg-muted">Detected objections</span><ul className="mt-1 list-inside list-disc text-sm">{insights.objections.map((o) => <li key={o}>{o}</li>)}</ul></div>}
      {insights.positiveSignals.length > 0 && <div className="mt-2"><span className="text-xs text-fg-muted">Positive signals</span><ul className="mt-1 list-inside list-disc text-sm">{insights.positiveSignals.map((o) => <li key={o}>{o}</li>)}</ul></div>}
      <p className="mt-3 text-sm text-accent">Recommended: {insights.recommendedAction}</p>
    </div>
  )
}

export function LeadEngagementPanel({ engagement }: { engagement: LeadIntelligenceProfile['engagement'] }) {
  const stats = [
    { label: 'Calls', value: engagement.calls },
    { label: 'Conversations', value: engagement.conversations },
    { label: 'Follow-ups', value: engagement.followUps },
    { label: 'Details requests', value: engagement.detailsRequests },
    { label: 'Bookings', value: engagement.bookings },
  ]
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-fg">Engagement</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label}><div className="text-2xs text-fg-muted">{s.label}</div><div className="text-lg font-semibold tabular">{s.value}</div></div>
        ))}
      </div>
      <div className="mt-3 text-xs text-fg-muted">
        {engagement.firstContact && <>First contact: {engagement.firstContact} · </>}
        {engagement.lastActivity && <>Last activity: {engagement.lastActivity}</>}
        {engagement.timeToBooking && <> · Time to booking: {engagement.timeToBooking}</>}
      </div>
    </div>
  )
}
