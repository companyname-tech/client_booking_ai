import type { OfferCampaign } from '@/types'
import type { AnalyticsDateRange } from '@/types/campaignAnalytics'
import { cn } from '@/lib/utils'
import { CampaignStatus as CampaignStatusBadge } from '@/components/campaigns/CampaignStatus'

const RANGES: AnalyticsDateRange[] = [7, 30, 90]

export function AnalyticsHeader({
  campaign,
  dateRange,
  onDateRangeChange,
  onOpenFilters,
  filterCount,
}: {
  campaign: OfferCampaign
  dateRange: AnalyticsDateRange
  onDateRangeChange: (r: AnalyticsDateRange) => void
  onOpenFilters: () => void
  filterCount: number
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="label-caps">OfferCampaign analytics</div>
        <h1 className="mt-1 text-2xl font-semibold text-fg">{campaign.name}</h1>
        <p className="mt-1 text-sm text-fg-muted">Understand what is driving conversations and bookings.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CampaignStatusBadge status={campaign.status} />
          <span className="text-xs text-fg-muted">Last {dateRange} days</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-0.5 rounded-md border border-line bg-surface-1 p-0.5">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDateRangeChange(d)}
              className={cn(
                'interactive rounded-[5px] px-2.5 py-1 text-2xs font-medium tabular',
                dateRange === d ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg-secondary',
              )}
            >
              {d}D
            </button>
          ))}
        </div>
        <button type="button" onClick={onOpenFilters} className="interactive rounded-md border border-line px-3 py-1.5 text-xs font-medium text-fg-secondary hover:bg-surface-3">
          Filters{filterCount > 0 && <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 text-2xs text-accent">{filterCount}</span>}
        </button>
      </div>
    </div>
  )
}
