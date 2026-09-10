import { Sparkles } from 'lucide-react'
import type { CampaignReviewData, ComplianceItem } from '@/types/admin'
import type { OfferCampaign as CampaignType, Agent } from '@/types'
import type { VideoAsset } from '@/types/campaignDraft'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { mediaUrl } from '@/api/adapters/http/repository'
import { VideoUploader } from '@/components/onboarding/VideoUploader'
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

const COMPLIANCE_STATUS_LABELS: Record<ComplianceItem['status'], string> = {
  passed: 'Passed',
  needs_review: 'Needs review',
  warning: 'Warning',
  not_applicable: 'N/A',
}

export function ReviewSectionContent({
  section,
  campaign,
  review,
  agent,
  onUploadCampaignVideo,
  onRemoveCampaignVideo,
  videoUploading,
}: {
  section: ReviewSection
  campaign: CampaignType
  review: CampaignReviewData
  /** The campaign's assigned agent (when one is set) — overlays the AI-config
   *  review snapshot with the agent's real persona fields. */
  agent?: Agent
  onUploadCampaignVideo?: (
    file: File,
    meta: { durationSec: number; width: number; height: number },
  ) => Promise<void>
  onRemoveCampaignVideo?: () => Promise<void>
  videoUploading?: boolean
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
    case 'compliance': {
      const applicable = review.complianceItems.filter((item) => item.status !== 'not_applicable')
      const unresolved = applicable.filter(
        (item) => item.status === 'needs_review' || item.status === 'warning',
      ).length
      const jurisdictions = review.complianceJurisdictions?.length
        ? review.complianceJurisdictions.join(', ')
        : 'Universal'
      return (
        <div className="space-y-4">
          <p className="rounded-md border border-warning/20 bg-warning-soft/10 px-3 py-2 text-xs text-fg-secondary">
            AI-assisted preliminary check — human review required. This is not legal advice.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-surface-2 px-3 py-2">
              <div className="text-2xs font-medium uppercase text-fg-muted">Compliance score</div>
              <div className="mt-1 text-2xl font-semibold tabular text-fg">{review.complianceScore ?? 0}%</div>
            </div>
            <div className="rounded-md border border-line bg-surface-2 px-3 py-2 sm:col-span-2">
              <div className="text-2xs font-medium uppercase text-fg-muted">Applicable jurisdictions</div>
              <div className="mt-1 text-sm font-medium text-fg">{jurisdictions}</div>
              <p className="mt-1 text-xs text-fg-muted">
                {applicable.length} checks apply · {unresolved} need human review
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {review.complianceItems.map((item) => (
              <li key={item.id} className="rounded-md border border-line px-3 py-2.5 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-fg">{item.label}</span>
                  <span className={cn('shrink-0 text-xs font-medium', COMPLIANCE_COLORS[item.status])}>
                    {COMPLIANCE_STATUS_LABELS[item.status]}
                  </span>
                </div>
                {item.note && (
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted">{item.note}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )
    }
    case 'video': {
      const storedVideo = review.campaignContent?.video
      const videoValue: VideoAsset | undefined = review.hasVideo
        ? {
            name: review.videoMeta?.name ?? storedVideo?.name ?? 'Campaign video',
            size: storedVideo?.sizeBytes ?? 0,
            durationSec: review.videoMeta?.durationSec ?? storedVideo?.durationSec ?? 0,
            resolution: review.videoMeta?.resolution ?? storedVideo?.resolution ?? '',
            mimeType: storedVideo?.mimeType ?? 'video/mp4',
            previewUrl: mediaUrl(review.videoMeta?.url ?? storedVideo?.url),
          }
        : undefined
      return (
        <div className="space-y-4">
          <VideoUploader
            key={review.videoMeta?.url ?? 'empty'}
            value={videoValue}
            disabled={videoUploading}
            uploadFile={
              onUploadCampaignVideo
                ? async (file, meta) => {
                    await onUploadCampaignVideo(file, meta)
                    return {
                      name: file.name,
                      size: file.size,
                      durationSec: meta.durationSec,
                      resolution: `${meta.width}×${meta.height}`,
                      mimeType: file.type,
                      previewUrl: URL.createObjectURL(file),
                    }
                  }
                : undefined
            }
            onChange={(video) => {
              if (!video && onRemoveCampaignVideo) void onRemoveCampaignVideo()
            }}
          />
          {review.hasVideo && review.videoMeta && (
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><dt className="text-fg-muted">File</dt><dd>{review.videoMeta.name}</dd></div>
              <div><dt className="text-fg-muted">Size</dt><dd>{review.videoMeta.size}</dd></div>
              <div><dt className="text-fg-muted">Orientation</dt><dd className="capitalize">{review.videoMeta.orientation}</dd></div>
              {review.videoMeta.durationSec ? (
                <div><dt className="text-fg-muted">Duration</dt><dd>{Math.round(review.videoMeta.durationSec)}s</dd></div>
              ) : null}
            </dl>
          )}
        </div>
      )
    }
    case 'history':
      return <AuditTimeline events={review.auditEvents} />
    default:
      return null
  }
}
