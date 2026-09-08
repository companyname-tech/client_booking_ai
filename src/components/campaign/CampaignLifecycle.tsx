import type { OfferCampaign } from '@/types'
import { campaignStatusMeta, campaignStageMeta } from '@/lib/status'
import { ProgressTimeline } from '@/components/campaigns/ProgressTimeline'
import { SubmissionStatusTimeline } from '@/components/campaigns/SubmissionStatusTimeline'
import { StatusDot } from '@/components/ui/StatusDot'

export function CampaignLifecycle({
  campaign,
  stageProgress,
}: {
  campaign: OfferCampaign
  stageProgress?: number
}) {
  const status = campaign.status
  const meta = campaignStatusMeta[status]
  const awaitingApproval = status === 'awaiting_approval'
  const inSetup = ['draft', 'preparing', 'legal_review', 'awaiting_approval'].includes(status)

  const statusMessage: Record<string, string> = {
    awaiting_approval: 'Your campaign is under review before launch.',
    active: 'AI is actively contacting and booking leads.',
    paused: 'OfferCampaign is paused. Resume when ready.',
    completed: 'This campaign has completed its run.',
  }

  return (
    <div className="surface relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(70%_60%_at_50%_100%,black,transparent)]" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <StatusDot tone={meta.tone} live={meta.live} size={8} />
          <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">{meta.label}</span>
        </div>
        {campaign.valueProposition && (
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-fg">{campaign.valueProposition}</p>
        )}
        <p className="mt-2 text-sm text-fg-secondary">{statusMessage[status] ?? campaignStageMeta[campaign.stage === 'ai_training' ? 'legal_review' : campaign.stage].description}</p>
        <div className="mt-6">
          {awaitingApproval ? (
            <SubmissionStatusTimeline />
          ) : inSetup && campaign.stage !== 'calling' ? (
            <ProgressTimeline current={campaign.stage} stageProgress={stageProgress} compact />
          ) : (
            <ProgressTimeline current={campaign.stage} stageProgress={stageProgress} />
          )}
        </div>
      </div>
    </div>
  )
}
