import type { BudgetAnalytics, CampaignForecast, HeatmapCell } from '@/types/campaignAnalytics'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AnalyticsSection } from './AnalyticsShared'
import { cn } from '@/lib/utils'

export function BudgetIntelligence({ budget }: { budget: BudgetAnalytics }) {
  const tone = budget.spendRate >= 90 ? 'danger' : budget.spendRate >= 70 ? 'warning' : 'info'
  return (
    <AnalyticsSection title="Budget performance">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><div className="text-xs text-fg-muted">Budget</div><div className="mt-1 text-xl font-semibold tabular">{formatCurrency(budget.total)}</div></div>
        <div><div className="text-xs text-fg-muted">Spent</div><div className="mt-1 text-xl font-semibold tabular">{formatCurrency(budget.spent)}</div></div>
        <div><div className="text-xs text-fg-muted">Remaining</div><div className="mt-1 text-xl font-semibold tabular">{formatCurrency(budget.remaining)}</div></div>
        <div><div className="text-xs text-fg-muted">Spend rate</div><div className="mt-1 text-xl font-semibold tabular">{formatPercent(budget.spendRate)}</div></div>
      </div>
      <ProgressBar value={budget.spendRate} tone={tone} segments={24} size="sm" className="mt-4" label="Budget utilization" />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-line px-3 py-2"><div className="text-2xs text-fg-muted">Cost per lead</div><div className="font-medium tabular">{formatCurrency(budget.costPerLead)}</div></div>
        <div className="rounded-md border border-line px-3 py-2"><div className="text-2xs text-fg-muted">Cost per conversation</div><div className="font-medium tabular">{formatCurrency(budget.costPerConversation)}</div></div>
        <div className="rounded-md border border-line px-3 py-2"><div className="text-2xs text-fg-muted">Cost per booking</div><div className="font-medium tabular">{formatCurrency(budget.costPerBooking)}</div></div>
      </div>
    </AnalyticsSection>
  )
}

export function CampaignForecastPanel({ forecast }: { forecast: CampaignForecast }) {
  return (
    <AnalyticsSection title="OfferCampaign forecast" description={forecast.disclaimer}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs text-fg-muted">Current bookings</div>
          <div className="text-3xl font-semibold tabular text-fg">{forecast.currentBookings}</div>
          <div className="mt-3 text-xs text-fg-muted">Projected</div>
          <div className="text-2xl font-semibold tabular text-accent">{forecast.projected}</div>
          <div className="mt-1 text-sm text-fg-muted">Expected range: {forecast.rangeLow}–{forecast.rangeHigh}</div>
        </div>
        <div className="space-y-2 text-sm">
          <div><span className="text-fg-muted">Completion:</span> {forecast.completionDate}</div>
          <div><span className="text-fg-muted">Confidence:</span> {forecast.confidence}</div>
          <div className="mt-3 space-y-1">
            {forecast.factors.map((f) => (
              <div key={f.label} className="flex justify-between gap-2">
                <span className="text-fg-muted">{f.label}</span>
                <span className={cn('font-medium', f.tone === 'positive' ? 'text-success' : 'text-fg')}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-md border border-line bg-surface-1 px-4 py-3">
        <div className="label-caps">Why this forecast?</div>
        <p className="mt-1 text-sm text-fg-secondary">{forecast.assessment}</p>
      </div>
    </AnalyticsSection>
  )
}

export function PerformanceHeatmap({ cells, recommendation }: { cells: HeatmapCell[]; recommendation: string }) {
  const days = [...new Set(cells.map((c) => c.day))]
  const hours = [...new Set(cells.map((c) => c.hour))]
  return (
    <AnalyticsSection title="Daily / weekly performance" description="Conversation and booking intensity by time">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-2xs">
          <thead>
            <tr>
              <th className="pb-2 text-left font-medium text-fg-muted" />
              {hours.map((h) => <th key={h} className="pb-2 text-center font-medium text-fg-muted">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td className="py-1 pr-2 font-medium text-fg-secondary">{day.slice(0, 3)}</td>
                {hours.map((hour) => {
                  const cell = cells.find((c) => c.day === day && c.hour === hour)
                  const v = cell?.intensity ?? 0
                  return (
                    <td key={hour} className="p-0.5">
                      <div className="mx-auto size-8 rounded-sm" style={{ background: `color-mix(in srgb, var(--color-accent) ${Math.round(v * 70)}%, transparent)` }} title={`${day} ${hour}`} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-accent">{recommendation}</p>
    </AnalyticsSection>
  )
}
