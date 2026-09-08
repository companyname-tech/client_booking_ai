import type { OfferCampaign, CampaignStatus } from '@/types'
import { campaignStatusMeta } from '@/lib/status'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { NOW } from '@/data/time'
import { CampaignStatus as CampaignStatusBadge } from '@/components/campaigns/CampaignStatus'
import { Button } from '@/components/ui/Button'
import { Pause, Play, ArrowRight, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export function CampaignHeader({
  campaign,
  effectiveStatus,
  budgetStopped = false,
  onPause,
  onResume,
  onDelete,
  zone,
}: {
  campaign: OfferCampaign
  effectiveStatus: CampaignStatus
  /** True when the campaign auto-paused because it has no budget and is not in training. */
  budgetStopped?: boolean
  onPause?: () => void
  onResume?: () => void
  onDelete?: () => void
  zone: 'client' | 'admin'
}) {
  const meta = campaignStatusMeta[effectiveStatus]

  const primaryAction = () => {
    if (effectiveStatus === 'active') {
      return (
        <Button variant="secondary" leadingIcon={<Pause />} onClick={onPause}>
          Pause campaign
        </Button>
      )
    }
    if (effectiveStatus === 'paused') {
      if (budgetStopped) {
        return (
          <Button variant="secondary" leadingIcon={<Play />} disabled title="Add a campaign budget to resume">
            Add budget to resume
          </Button>
        )
      }
      return (
        <Button variant="primary" leadingIcon={<Play />} onClick={onResume}>
          Resume campaign
        </Button>
      )
    }
    if (effectiveStatus === 'awaiting_approval') {
      return (
        <Button variant="secondary" trailingIcon={<ArrowRight />} onClick={() => window.scrollTo({ top: 0 })}>
          View review status
        </Button>
      )
    }
    if (['draft', 'preparing'].includes(effectiveStatus) || campaign.stage === 'onboarding') {
      return (
        <Link to={`/${zone}/campaigns/${campaign.id}/onboarding`}>
          <Button variant="primary">Continue setup</Button>
        </Link>
      )
    }
    return null
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-fg-secondary">
        {campaign.targetAudience} · {campaign.geography}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <CampaignStatusBadge status={effectiveStatus} size="md" />
        <span className="text-xs text-fg-muted">{meta.label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
        <span>Created {new Date(campaign.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span className="size-0.5 rounded-full bg-fg-faint" aria-hidden />
        <span>Last activity {formatRelativeTime(campaign.lastActivityAt, NOW)}</span>
        <span className="size-0.5 rounded-full bg-fg-faint" aria-hidden />
        <span className="tabular">{formatCurrency(campaign.budget.total)} budget</span>
      </div>
      <div className="flex items-center gap-2 pt-2">
        {primaryAction()}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete campaign"
            onClick={onDelete}
            className="text-danger hover:bg-danger-soft/30 hover:text-danger"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
