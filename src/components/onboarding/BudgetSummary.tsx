import type { CampaignDraft } from '@/types/campaignDraft'
import { estimateFromBudget } from '@/lib/budgetEstimates'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { OnboardingSummaryPanel } from './OnboardingSummaryPanel'

export function BudgetSummary({ draft }: { draft: CampaignDraft }) {
  const est = estimateFromBudget(draft.budget)

  return (
    <OnboardingSummaryPanel title="Budget summary">
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-fg-muted">OfferCampaign budget</dt>
          <dd className="font-semibold tabular text-fg">{formatCurrency(draft.budget.total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-fg-muted">Daily budget</dt>
          <dd className="font-semibold tabular text-fg">{formatCurrency(draft.budget.daily)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-fg-muted">Estimated duration</dt>
          <dd className="font-semibold tabular text-fg">{draft.budget.durationDays} days</dd>
        </div>
      </dl>
      <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-fg-muted">Estimated leads</span>
          <span className="tabular text-fg-secondary">
            {formatNumber(est.leadsMin)}–{formatNumber(est.leadsMax)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-fg-muted">Estimated calls</span>
          <span className="tabular text-fg-secondary">
            {formatNumber(est.callsMin)}–{formatNumber(est.callsMax)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-fg-muted">Estimated bookings</span>
          <span className="tabular text-fg-secondary">
            {formatNumber(est.bookingsMin)}–{formatNumber(est.bookingsMax)}
          </span>
        </div>
      </div>
      <p className="mt-4 text-2xs leading-snug text-fg-faint">
        Estimates are illustrative and may change as campaign performance develops.
      </p>
    </OnboardingSummaryPanel>
  )
}
