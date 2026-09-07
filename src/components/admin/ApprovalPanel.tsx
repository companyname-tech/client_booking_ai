import { Check, Circle } from 'lucide-react'
import type { CampaignReviewData } from '@/types/admin'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function ApprovalPanel({
  review,
  onApprove,
  onReject,
  onRequestChanges,
  sticky,
}: {
  review: CampaignReviewData
  onApprove: () => void
  onReject: () => void
  onRequestChanges: () => void
  sticky?: boolean
}) {
  const overall = Math.round(
    review.readinessChecklist.filter((r) => r.done).reduce((s, r) => s + (r.score ?? 80), 0) /
      Math.max(review.readinessChecklist.length, 1),
  )
  const complianceUnresolved = review.complianceItems.some((c) => c.status === 'needs_review' || c.status === 'warning')

  return (
    <aside
      className={cn(
        'surface flex flex-col gap-4 p-5',
        sticky && 'lg:sticky lg:top-24 lg:self-start',
      )}
    >
      <div>
        <div className="label-caps">OfferCampaign readiness</div>
        <div className="mt-1 text-3xl font-semibold tabular text-fg">{overall}%</div>
        <ProgressBar value={overall} tone="violet" segments={20} size="sm" className="mt-3" label="Overall readiness" />
      </div>

      <ul className="space-y-2">
        {review.readinessChecklist.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-fg-secondary">
              {item.done ? <Check className="size-3.5 text-success" /> : <Circle className="size-3.5 text-fg-faint" />}
              {item.label}
            </span>
            {item.score !== undefined && <span className="tabular text-xs text-fg-muted">{item.score}%</span>}
          </li>
        ))}
      </ul>

      {complianceUnresolved && (
        <p className="rounded-md border border-warning/20 bg-warning-soft/10 px-3 py-2 text-xs text-warning">
          Compliance items need review before approval.
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onRequestChanges}>Request Changes</Button>
        <Button variant="secondary" onClick={onReject}>Reject</Button>
        <Button variant="primary" onClick={onApprove}>
          Approve OfferCampaign
        </Button>
      </div>
    </aside>
  )
}
