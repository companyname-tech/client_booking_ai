import type { CampaignStatus as Status } from '@/types'
import { campaignStatusMeta } from '@/lib/status'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'

export interface CampaignStatusProps extends Omit<StatusBadgeProps, 'tone' | 'live' | 'children'> {
  status: Status
}

export function CampaignStatus({ status, ...props }: CampaignStatusProps) {
  const meta = campaignStatusMeta[status]
  return (
    <StatusBadge tone={meta.tone} live={meta.live} {...props}>
      {meta.label}
    </StatusBadge>
  )
}
