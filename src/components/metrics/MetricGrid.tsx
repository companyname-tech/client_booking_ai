import type { Analytics } from '@/types'
import { cn, formatCurrency } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { MetricCard } from './MetricCard'

/**
 * Metrics rendered as one continuous panel divided by hairlines, rather
 * than eight floating cards. 2 columns on mobile → 4 on desktop.
 */
export function MetricGrid({ analytics, className }: { analytics: Analytics; className?: string }) {
  const byKey = Object.fromEntries(analytics.metrics.map((m) => [m.key, m]))
  const budgetPct = Math.round((analytics.budget.used / analytics.budget.total) * 100)
  const budgetTone = budgetPct >= 90 ? 'danger' : budgetPct >= 70 ? 'warning' : 'info'

  return (
    <Stagger
      as="section"
      aria-label="Key metrics"
      stagger={0.035}
      className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line shadow-1 md:grid-cols-4', className)}
    >
      <MetricCard metric={byKey.leadsFound} tone="info" />
      <MetricCard metric={byKey.leadsContacted} tone="info" />
      <MetricCard metric={byKey.callsCompleted} tone="violet" />
      <MetricCard metric={byKey.bookings} tone="success" emphasis={false} />
      <MetricCard metric={byKey.conversionRate} tone="success" />
      <MetricCard metric={byKey.bookingRate} tone="success" />
      <MetricCard metric={byKey.detailsRequested} tone="neutral" />

      <Reveal as="div" className="flex flex-col justify-between bg-surface-2 p-4 transition-colors hover:bg-surface-3/80 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium text-fg-muted">Budget used</span>
          <span
            className={cn(
              'text-2xs font-medium tabular',
              budgetTone === 'danger' ? 'text-danger' : budgetTone === 'warning' ? 'text-warning' : 'text-fg-muted',
            )}
          >
            {budgetPct}%
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <AnimatedNumber value={analytics.budget.used} format={formatCurrency} className="text-2xl font-semibold tracking-tight text-fg" />
            <span className="text-sm text-fg-muted tabular">/ {formatCurrency(analytics.budget.total)}</span>
          </div>
          <ProgressBar value={budgetPct} tone={budgetTone} segments={24} size="sm" className="mt-3" label="Budget used" />
        </div>
        <div className="mt-1.5 text-2xs text-fg-faint">{formatCurrency(analytics.budget.total - analytics.budget.used)} remaining</div>
      </Reveal>
    </Stagger>
  )
}
