import { formatNumber } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import type { LeadHubMetrics } from '@/types/leadIntelligence'

export function LeadHubMetrics({ metrics }: { metrics: LeadHubMetrics }) {
  const items = [
    { label: 'Total leads', value: metrics.total },
    { label: 'Qualified', value: metrics.by_status?.QUALIFIED ?? 0 },
    { label: 'Verified', value: metrics.verified },
    { label: 'Unverified', value: metrics.unverified },
    { label: 'Meetings booked', value: metrics.meetings_booked },
    { label: 'Contacted', value: metrics.contacted },
  ]
  return (
    <Stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3 lg:grid-cols-6" stagger={0.03}>
      {items.map((m) => (
        <Reveal key={m.label} className="bg-surface-2 p-4 sm:p-5">
          <div className="text-xs text-fg-muted">{m.label}</div>
          <AnimatedNumber value={m.value} format={formatNumber} className="mt-2 text-2xl font-semibold tabular text-fg" />
        </Reveal>
      ))}
    </Stagger>
  )
}
