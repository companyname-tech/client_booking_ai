import type { CampaignHealthSnapshot } from '@/types'
import { StatusDot } from '@/components/ui/StatusDot'

const OVERALL_LABEL: Record<CampaignHealthSnapshot['overall'], string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  needs_attention: 'Needs attention',
}

const OVERALL_TONE: Record<CampaignHealthSnapshot['overall'], 'success' | 'info' | 'warning' | 'danger'> = {
  excellent: 'success',
  good: 'info',
  fair: 'warning',
  needs_attention: 'danger',
}

const DIM_LABELS = {
  aiPerformance: { excellent: 'Excellent', good: 'Good', fair: 'Fair' },
  leadQuality: { strong: 'Strong', moderate: 'Moderate', weak: 'Weak' },
  bookingRate: { above_target: 'Above target', on_target: 'On target', below_target: 'Below target' },
  budgetEfficiency: { healthy: 'Healthy', elevated: 'Elevated', critical: 'Critical' },
} as const

export function CampaignHealthPanel({ health, compact }: { health: CampaignHealthSnapshot; compact?: boolean }) {
  const tone = OVERALL_TONE[health.overall]

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <StatusDot tone={tone} live={health.overall === 'excellent'} />
        <div>
          <div className="text-xs text-fg-muted">OfferCampaign health</div>
          <div className="text-sm font-semibold text-fg">{OVERALL_LABEL[health.overall]}</div>
          <p className="text-xs text-fg-muted">{health.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="label-caps">OfferCampaign health</div>
          <div className="mt-1 flex items-center gap-2">
            <StatusDot tone={tone} live={health.overall === 'excellent'} size={8} />
            <span className="text-2xl font-semibold text-fg">{OVERALL_LABEL[health.overall]}</span>
          </div>
          <p className="mt-1 text-sm text-fg-muted">{health.message}</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ['AI performance', DIM_LABELS.aiPerformance[health.aiPerformance]],
          ['Lead quality', DIM_LABELS.leadQuality[health.leadQuality]],
          ['Booking rate', DIM_LABELS.bookingRate[health.bookingRate]],
          ['Budget efficiency', DIM_LABELS.budgetEfficiency[health.budgetEfficiency]],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-md border border-line bg-surface-1 px-3 py-2">
            <dt className="text-xs text-fg-muted">{label}</dt>
            <dd className="text-xs font-medium text-fg">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
