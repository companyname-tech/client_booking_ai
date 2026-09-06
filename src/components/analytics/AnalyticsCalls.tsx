import type { CallOutcomeRow, CallPerformance, ConversationQuality } from '@/types/campaignAnalytics'
import { formatDuration, formatNumber } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { AnalyticsSection } from './AnalyticsShared'

export function CallPerformancePanel({ data }: { data: CallPerformance }) {
  const stats = [
    { label: 'Calls attempted', value: data.attempted },
    { label: 'Connected', value: data.connected },
    { label: 'Avg duration', value: data.avgDurationSec, format: (n: number) => formatDuration(n) },
    { label: 'Avg response', value: data.avgResponseSec, format: (n: number) => `${n} sec` },
    { label: 'Positive conversations', value: data.positiveConversations },
    { label: 'Interested', value: data.interested },
    { label: 'Booked', value: data.booked },
  ]
  return (
    <AnalyticsSection title="Call intelligence" description="Outbound call performance">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-xs text-fg-muted">{s.label}</div>
            <AnimatedNumber value={s.value} format={s.format ?? formatNumber} className="mt-1 text-xl font-semibold tabular text-fg" />
          </div>
        ))}
      </div>
    </AnalyticsSection>
  )
}

export function CallOutcomeDistribution({ outcomes }: { outcomes: CallOutcomeRow[] }) {
  const max = Math.max(...outcomes.map((o) => o.count), 1)
  return (
    <AnalyticsSection title="Call outcome distribution">
      <div className="space-y-2">
        {outcomes.map((o) => (
          <div key={o.label}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-fg-secondary">{o.label}</span>
              <span className="font-medium tabular text-fg">{formatNumber(o.count)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-fg/30" style={{ width: `${(o.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </AnalyticsSection>
  )
}

export function ConversationQualityPanel({ quality }: { quality: ConversationQuality }) {
  return (
    <AnalyticsSection title="Conversation quality" description="Mock AI assessment of call quality">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs text-fg-muted">Average quality score</div>
          <div className="mt-1 text-4xl font-semibold tabular text-fg">{quality.score}<span className="text-lg text-fg-muted"> / 100</span></div>
        </div>
        <div className="flex-1 space-y-2">
          {quality.distribution.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="w-28 text-xs text-fg-muted">{d.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-violet/70" style={{ width: `${d.percent}%` }} />
              </div>
              <span className="w-10 text-right text-xs tabular text-fg-secondary">{d.percent}%</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-fg-muted">{quality.insight}</p>
    </AnalyticsSection>
  )
}
