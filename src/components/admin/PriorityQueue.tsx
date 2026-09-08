import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { AdminCampaignMeta } from '@/types/admin'
import type { OfferCampaign, Client } from '@/types'
import { NOW } from '@/data/time'
import { formatRelativeCompact } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { StatusDot } from '@/components/ui/StatusDot'
import { CopyableName } from '@/components/ui/CopyableName'

const WF_LABEL: Record<string, string> = {
  awaiting_approval: 'Awaiting Approval',
  submitted: 'Submitted',
  compliance_review: 'Compliance Review',
  training: 'Awaiting Approval',
  changes_requested: 'Client Changes Requested',
  approved: 'Ready to Launch',
  launching: 'Launching',
  live: 'Live',
  rejected: 'Rejected',
}

const WF_TONE: Record<string, 'warning' | 'violet' | 'info' | 'success' | 'danger'> = {
  awaiting_approval: 'warning',
  submitted: 'info',
  compliance_review: 'warning',
  training: 'violet',
  changes_requested: 'warning',
  approved: 'success',
  launching: 'success',
  live: 'success',
  rejected: 'danger',
}

const WF_BADGE: Record<string, string> = {
  awaiting_approval: 'bg-warning-soft/20 text-warning',
  submitted: 'bg-info-soft/20 text-info',
  compliance_review: 'bg-warning-soft/20 text-warning',
  training: 'bg-violet-soft/20 text-violet',
  changes_requested: 'bg-warning-soft/20 text-warning',
  approved: 'bg-success-soft/20 text-success',
  launching: 'bg-success-soft/20 text-success',
  live: 'bg-success-soft/20 text-success',
  rejected: 'bg-danger-soft/20 text-danger',
}

export function PriorityQueue({
  items,
  clients,
  campaigns,
}: {
  items: AdminCampaignMeta[]
  clients: Client[]
  campaigns: OfferCampaign[]
}) {
  const queue = items.filter((m) =>
    ['awaiting_approval', 'submitted', 'compliance_review', 'training', 'changes_requested', 'approved'].includes(m.workflowStatus),
  ).slice(0, 6)

  if (queue.length === 0) {
    return <p className="text-sm text-fg-muted">No campaigns need immediate attention.</p>
  }

  return (
    <ul className="space-y-2">
      {queue.map((m) => {
        const campaign = campaigns.find((c) => c.id === m.offerCampaignId)
        const client = clients.find((c) => c.id === campaign?.clientId)
        if (!campaign) return null
        const tone = (WF_TONE[m.workflowStatus] ?? 'info') as 'warning' | 'violet' | 'info' | 'success' | 'danger'
        const badgeClass = WF_BADGE[m.workflowStatus] ?? 'bg-info-soft/20 text-info'
        return (
          <li key={m.offerCampaignId}>
            <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <CopyableName name={campaign.name} id={campaign.id} compact className="font-medium text-fg" />
                <Link
                  to={`/admin/campaigns/${m.offerCampaignId}/review`}
                  className="interactive mt-0.5 block text-xs text-fg-muted hover:text-fg-secondary"
                >
                  {client?.name}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium', badgeClass)}>
                    <StatusDot tone={tone} size={5} />
                    {WF_LABEL[m.workflowStatus] ?? m.workflowStatus}
                  </span>
                  <span className="text-fg-muted">Submitted {formatRelativeCompact(m.submittedAt, NOW)}</span>
                  <span className="text-fg-muted">Risk: {m.riskLevel}</span>
                </div>
              </div>
              <Link
                to={`/admin/campaigns/${m.offerCampaignId}/review`}
                className="interactive group flex items-center gap-4"
              >
                <div className="text-right">
                  <div className="text-2xs text-fg-muted">AI Readiness</div>
                  <div className="text-lg font-semibold tabular text-violet">{m.aiReadiness}%</div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                  Review <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
