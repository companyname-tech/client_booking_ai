import type { AnalyticsOverview } from '@/types/campaignAnalytics'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { AnalyticsSection, DeltaBadge, StatBlock } from './AnalyticsShared'

export function AnalyticsSummary({ overview }: { overview: AnalyticsOverview }) {
  return (
    <AnalyticsSection title={overview.headline} description={overview.assessment}>
      <Stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3 lg:grid-cols-6" stagger={0.03}>
        <Reveal className="bg-surface-2 p-4"><StatBlock label="Bookings" value={overview.bookings} delta={overview.deltas.bookings} /></Reveal>
        <Reveal className="bg-surface-2 p-4"><StatBlock label="Booking rate" value={overview.bookingRate} format="percent" delta={overview.deltas.bookingRate} /></Reveal>
        <Reveal className="bg-surface-2 p-4"><StatBlock label="Conversion rate" value={overview.conversionRate} format="percent" delta={overview.deltas.conversionRate} /></Reveal>
        <Reveal className="bg-surface-2 p-4"><StatBlock label="Cost per booking" value={overview.costPerBooking} format="currency" delta={overview.deltas.costPerBooking} /></Reveal>
        <Reveal className="bg-surface-2 p-4"><StatBlock label="Campaign spend" value={overview.spend} format="currency" delta={overview.deltas.spend} /></Reveal>
        <Reveal className="bg-surface-2 p-4"><StatBlock label="Projected bookings" value={overview.projectedBookings} delta={overview.deltas.projectedBookings} /></Reveal>
      </Stagger>
      <p className="mt-3 text-2xs text-fg-faint">vs previous period · {formatPercent(overview.bookingRate)} booking rate · {formatCurrency(overview.costPerBooking)} per booking</p>
    </AnalyticsSection>
  )
}

export function PerformanceComparison({ rows }: { rows: import('@/types/campaignAnalytics').AnalyticsComparisonRow[] }) {
  return (
    <AnalyticsSection title="This period vs previous period" description="Key metric changes">
      <div>
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
            <span className="text-sm text-fg-secondary">{r.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tabular text-fg">
                {r.format === 'currency' ? formatCurrency(r.current) : r.format === 'percent' ? formatPercent(r.current) : r.current.toLocaleString()}
              </span>
              <DeltaBadge delta={{ value: r.delta, format: r.format === 'percent' ? 'points' : 'percent', positiveIsGood: r.positiveIsGood }} />
            </div>
          </div>
        ))}
      </div>
    </AnalyticsSection>
  )
}
