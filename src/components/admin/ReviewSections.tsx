import { Sparkles } from 'lucide-react'
import type { CampaignReviewData } from '@/types/admin'
import type { OfferCampaign as CampaignType, Agent } from '@/types'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer'
import { IntegrationCard } from '@/components/onboarding/IntegrationCard'
import { AuditTimeline } from './AuditTimeline'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils'

export type ReviewSection = 'overview' | 'target' | 'offer' | 'budget' | 'booking' | 'integrations' | 'ai' | 'compliance' | 'video' | 'history'

export const REVIEW_SECTIONS: { id: ReviewSection; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'target', label: 'Target Audience' },
  { id: 'offer', label: 'Offer' },
  { id: 'budget', label: 'Budget' },
  { id: 'booking', label: 'Booking' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'ai', label: 'AI Configuration' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'video', label: 'Video' },
  { id: 'history', label: 'History' },
]

function AIAssessmentCard({ title, assessment }: { title: string; assessment: CampaignReviewData['targetAssessment'] }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-violet" />
        <h4 className="text-sm font-semibold text-fg">{title}</h4>
        <span className="ml-auto text-sm font-semibold tabular text-violet">{assessment.score} / 100</span>
      </div>
      <p className="mt-2 text-sm text-fg-secondary">&ldquo;{assessment.summary}&rdquo;</p>
      {assessment.strengths.length > 0 && (
        <div className="mt-3">
          <div className="text-2xs font-medium uppercase text-fg-muted">Strengths</div>
          <ul className="mt-1 space-y-1">{assessment.strengths.map((s) => <li key={s} className="text-xs text-fg-secondary">+ {s}</li>)}</ul>
        </div>
      )}
      {assessment.recommendations.length > 0 && (
        <div className="mt-3">
          <div className="text-2xs font-medium uppercase text-fg-muted">Recommendations</div>
          <ul className="mt-1 space-y-1">{assessment.recommendations.map((s) => <li key={s} className="text-xs text-fg-muted">→ {s}</li>)}</ul>
        </div>
      )}
    </div>
  )
}

const COMPLIANCE_COLORS = {
  passed: 'text-success',
  needs_review: 'text-warning',
  warning: 'text-danger',
  not_applicable: 'text-fg-faint',
}

export function ReviewSectionContent({
  section,
  campaign,
  review,
  agent,
}: {
  section: ReviewSection
  campaign: CampaignType
  review: CampaignReviewData
  /** The campaign's assigned agent (when one is set) — overlays the AI-config
   *  review snapshot with the agent's real persona fields. */
  agent?: Agent
}) {
  const c = campaign.criteria

  switch (section) {
    case 'overview':
      return (
        <div className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div><dt className="text-fg-muted">Offer</dt><dd className="font-medium text-fg">{campaign.offerName}</dd></div>
            <div><dt className="text-fg-muted">Audience</dt><dd className="font-medium text-fg">{campaign.targetAudience}</dd></div>
            <div><dt className="text-fg-muted">Geography</dt><dd className="font-medium text-fg">{campaign.geography}</dd></div>
            <div><dt className="text-fg-muted">Budget</dt><dd className="font-medium text-fg">{formatCurrency(campaign.budget.total)}</dd></div>
          </dl>
          <AIAssessmentCard title="AI preliminary assessment" assessment={review.targetAssessment} />
        </div>
      )
    case 'target':
      return (
        <div className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-fg-muted">Age</dt><dd>{c.ageRange}</dd></div>
            <div><dt className="text-fg-muted">Industries</dt><dd>{c.industry}</dd></div>
            <div><dt className="text-fg-muted">Company size</dt><dd>{c.companySize}</dd></div>
            <div><dt className="text-fg-muted">Geography</dt><dd>{c.location}</dd></div>
            <div className="sm:col-span-2"><dt className="text-fg-muted">Decision-makers</dt><dd>{c.decisionMakers.join(', ')}</dd></div>
            {c.other && <div className="sm:col-span-2"><dt className="text-fg-muted">Additional</dt><dd>{c.other}</dd></div>}
          </dl>
          <AIAssessmentCard title="AI Assessment" assessment={review.targetAssessment} />
        </div>
      )
    case 'offer':
      return (
        <div className="space-y-4">
          <div className="text-sm">
            <div className="font-medium text-fg">{campaign.offerName}</div>
            <p className="mt-2 text-fg-secondary">Client-provided offer for {campaign.targetAudience}.</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-4 text-sm">
            <div className="label-caps mb-3">AI Offer Analysis</div>
            <dl className="grid gap-2 sm:grid-cols-3">
              <div><dt className="text-fg-muted">Clarity</dt><dd className="font-medium">{review.offerAnalysis.clarity}</dd></div>
              <div><dt className="text-fg-muted">Value proposition</dt><dd className="font-medium">{review.offerAnalysis.valueProposition}</dd></div>
              <div><dt className="text-fg-muted">CTA</dt><dd className="font-medium">{review.offerAnalysis.cta}</dd></div>
            </dl>
            <p className="mt-3 text-fg-secondary">AI Recommendation: &ldquo;{review.offerAnalysis.recommendation}&rdquo;</p>
          </div>
        </div>
      )
    case 'budget': {
      const hasCampaignBudget = campaign.budget.total > 0 || campaign.budget.daily > 0
      return (
        <div className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-fg-muted">Campaign budget</dt>
              <dd className="text-lg font-semibold">
                {formatCurrency(hasCampaignBudget ? campaign.budget.total : review.budgetProjection.monthlyBudget)}
                {hasCampaignBudget ? '' : ' / month'}
              </dd>
            </div>
            <div><dt className="text-fg-muted">Daily budget</dt><dd>{formatCurrency(campaign.budget.daily)}</dd></div>
            {hasCampaignBudget && (
              <div><dt className="text-fg-muted">Duration</dt><dd>{campaign.budget.expectedDurationDays} days</dd></div>
            )}
            <div><dt className="text-fg-muted">Expected leads</dt><dd>{formatNumber(review.budgetProjection.expectedLeads)}</dd></div>
            <div><dt className="text-fg-muted">Projected conversations</dt><dd>{formatNumber(review.budgetProjection.projectedConversations)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-fg-muted">Projected bookings</dt><dd>{review.budgetProjection.projectedBookingsMin}–{review.budgetProjection.projectedBookingsMax}</dd></div>
          </dl>
          <p className="rounded-md border border-line bg-surface-1 px-3 py-2 text-xs text-fg-muted">{review.budgetProjection.aiNote}</p>
        </div>
      )
    }
    case 'booking':
      return (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-fg-muted">Booking title</dt><dd className="font-mono text-xs">{review.bookingTitle}</dd></div>
          <div><dt className="text-fg-muted">Destination</dt><dd>{review.bookingEmail}</dd></div>
          <div><dt className="text-fg-muted">Calendly</dt><dd>{review.integrations.calendly}</dd></div>
          <div><dt className="text-fg-muted">Zoom</dt><dd>{review.integrations.zoom}</dd></div>
        </dl>
      )
    case 'integrations':
      return (
        <div className="grid gap-3">
          <IntegrationCard provider="gmail" state="connected" onConnect={() => {}} />
          <IntegrationCard provider="calendly" state="connected" onConnect={() => {}} />
          <IntegrationCard provider="zoom" state="disconnected" onConnect={() => {}} optional />
        </div>
      )
    case 'ai': {
      const config = {
        ...review.agentConfig,
        ...(agent
          ? {
              agentName: agent.name || review.agentConfig.agentName,
              voice: agent.voice || review.agentConfig.voice,
              language: agent.language || review.agentConfig.language,
              model: agent.audio_model || agent.agent_model || review.agentConfig.model,
              role: agent.role_label || agent.role || review.agentConfig.role,
            }
          : {}),
      }
      return (
        <div className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {Object.entries(config).map(([k, v]) => (
              <div key={k} className={Array.isArray(v) ? 'sm:col-span-2' : ''}>
                <dt className="capitalize text-fg-muted">{k.replace(/([A-Z])/g, ' $1')}</dt>
                <dd className="font-medium text-fg">{Array.isArray(v) ? (v as string[]).join(' · ') : (v as string)}</dd>
              </div>
            ))}
          </dl>
          <div>
            <div className="flex justify-between text-sm"><span>AI Readiness</span><span className="font-semibold tabular text-violet">{review.aiReadiness}%</span></div>
            <ProgressBar value={review.aiReadiness} tone="violet" className="mt-2" label="AI readiness" />
          </div>
          <ul className="space-y-1">
            {review.readinessChecklist.map((r) => (
              <li key={r.id} className="flex justify-between text-sm">
                <span className="text-fg-secondary">{r.label}</span>
                <span className={r.done ? 'text-success' : 'text-fg-muted'}>{r.done ? '✓' : 'Pending'}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    case 'compliance':
      return (
        <div className="space-y-4">
          <p className="rounded-md border border-warning/20 bg-warning-soft/10 px-3 py-2 text-xs text-fg-secondary">
            AI-assisted preliminary check — human review required. This is not legal advice.
          </p>
          <ul className="space-y-2">
            {review.complianceItems.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 rounded-md border border-line px-3 py-2.5 text-sm">
                <span className="text-fg">{item.label}</span>
                <span className={cn('shrink-0 text-xs font-medium capitalize', COMPLIANCE_COLORS[item.status])}>
                  {item.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )
    case 'video':
      return review.hasVideo ? (
        <div className="space-y-4">
          <RecordingPlayer durationSec={254} />
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div><dt className="text-fg-muted">File</dt><dd>{review.videoMeta?.name}</dd></div>
            <div><dt className="text-fg-muted">Size</dt><dd>{review.videoMeta?.size}</dd></div>
            <div><dt className="text-fg-muted">Orientation</dt><dd>{review.videoMeta?.orientation}</dd></div>
          </dl>
        </div>
      ) : (
        <p className="text-sm text-fg-muted">No video uploaded for this campaign.</p>
      )
    case 'history':
      return <AuditTimeline events={review.auditEvents} />
    default:
      return null
  }
}
