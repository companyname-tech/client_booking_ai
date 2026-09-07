import type { OfferCampaign, CampaignMetrics } from '@/types'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function CampaignMetricsGrid({ metrics, budget }: { metrics: CampaignMetrics; budget: OfferCampaign['budget'] }) {
  const primary = [
    { label: 'Leads found', value: metrics.leadsFound, context: '+18.4% this week', emphasis: true },
    { label: 'Bookings', value: metrics.bookings, context: '+12 this week', emphasis: true },
  ]
  const secondary = [
    { label: 'Leads contacted', value: metrics.leadsContacted, context: `${formatPercent((metrics.leadsContacted / metrics.leadsFound) * 100)} of leads` },
    { label: 'Calls completed', value: metrics.callsCompleted, context: `${formatPercent((metrics.callsCompleted / metrics.leadsFound) * 100)} of leads` },
    { label: 'Conversion rate', value: metrics.conversionRate, context: 'vs. campaign avg', isPercent: true },
    { label: 'Booking rate', value: metrics.bookingRate, context: 'of contacted leads', isPercent: true },
    { label: 'Details requested', value: metrics.detailsRequested, context: 'pending follow-up' },
  ]
  const budgetPct = (budget.used / budget.total) * 100

  return (
    <div className="space-y-4">
      <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
        {primary.map((m) => (
          <div key={m.label} className="bg-surface-2 px-5 py-5">
            <AnimatedNumber
              value={m.value}
              format={formatNumber}
              className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl"
            />
            <div className="mt-1 text-sm font-medium text-fg">{m.label}</div>
            <div className="mt-0.5 text-xs text-success">{m.context}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        {secondary.map((m) => (
          <div key={m.label} className="bg-surface-2 px-4 py-3">
            <div className="text-lg font-semibold tabular text-fg">
              {m.isPercent ? formatPercent(m.value) : formatNumber(m.value)}
            </div>
            <div className="text-xs text-fg-muted">{m.label}</div>
            <div className="text-2xs text-fg-faint">{m.context}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-surface-2 px-5 py-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <AnimatedNumber value={budget.used} format={formatCurrency} className="text-xl font-semibold text-fg" />
            <span className="ml-1 text-sm text-fg-muted">/ {formatCurrency(budget.total)}</span>
          </div>
          <span className="text-sm tabular text-fg-secondary">{formatPercent(budgetPct, 1)} used</span>
        </div>
        <ProgressBar value={budgetPct} tone="warning" size="sm" className="mt-3" label="Budget used" />
      </div>
    </div>
  )
}
