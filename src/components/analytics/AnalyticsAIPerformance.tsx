import type { AILearningEvent, AIPerformanceMetric, AIExperiment } from '@/types/campaignAnalytics'
import { formatPercent } from '@/lib/utils'
import { AnalyticsSection } from './AnalyticsShared'
import { DeltaBadge } from './AnalyticsShared'

export function AIPerformancePanel({ metrics }: { metrics: AIPerformanceMetric[] }) {
  return (
    <AnalyticsSection title="AI performance" description="Simulated campaign metrics — not real model benchmarks">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-line bg-surface-1 p-4">
            <div className="text-xs text-fg-muted">{m.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular text-fg">{m.value}%</span>
              <DeltaBadge delta={{ value: m.delta, format: 'points', positiveIsGood: true }} />
            </div>
          </div>
        ))}
      </div>
    </AnalyticsSection>
  )
}

export function AILearningTimeline({ events }: { events: AILearningEvent[] }) {
  return (
    <AnalyticsSection title="How the AI has evolved" description="Training and optimization milestones">
      <ol className="relative space-y-0">
        {events.map((e, i) => (
          <li key={e.day} className="relative flex gap-4 pb-6 last:pb-0">
            {i < events.length - 1 && <span aria-hidden className="absolute left-[5px] top-3 h-[calc(100%-8px)] w-px bg-line-strong" />}
            <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-violet ring-4 ring-surface-1" />
            <div>
              <div className="text-2xs font-medium text-violet">Day {e.day}</div>
              <div className="font-medium text-fg">{e.title}</div>
              <p className="mt-1 text-sm text-fg-secondary">{e.change}</p>
              <p className="mt-1 text-xs text-fg-muted">{e.reason}</p>
              <p className="mt-1 text-xs text-success">{e.effect}</p>
            </div>
          </li>
        ))}
      </ol>
    </AnalyticsSection>
  )
}

export function AIExperiments({ experiments }: { experiments: AIExperiment[] }) {
  return (
    <AnalyticsSection title="AI experiments" description="A/B tests run on this campaign">
      <div className="grid gap-3 md:grid-cols-2">
        {experiments.map((ex) => (
          <div key={ex.id} className="rounded-lg border border-line bg-surface-1 p-4">
            <div className="font-medium text-fg">{ex.name}</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className={ex.winner === 'A' ? 'rounded-md border border-success/30 bg-success-soft/10 p-2' : 'p-2'}>
                <div className="text-2xs text-fg-muted">{ex.variantA.label}</div>
                <div className="font-medium tabular">{ex.variantA.value}</div>
              </div>
              <div className={ex.winner === 'B' ? 'rounded-md border border-success/30 bg-success-soft/10 p-2' : 'p-2'}>
                <div className="text-2xs text-fg-muted">{ex.variantB.label}</div>
                <div className="font-medium tabular">{ex.variantB.value}</div>
              </div>
            </div>
            <div className="mt-2 flex gap-2 text-2xs">
              <span className="text-success">Winner: {ex.winner}</span>
              <span className="text-fg-muted">· {ex.status}</span>
            </div>
          </div>
        ))}
      </div>
    </AnalyticsSection>
  )
}

export function CampaignBenchmark({ rows }: { rows: import('@/types/campaignAnalytics').BenchmarkRow[] }) {
  return (
    <AnalyticsSection title="How you're performing" description="Internal benchmark — not external industry data">
      <div className="space-y-3">
        {rows.map((r) => {
          const better = r.lowerIsBetter ? r.campaign < r.benchmark : r.campaign > r.benchmark
          const fmt = r.format === 'currency' ? (n: number) => `$${n.toFixed(2)}` : (n: number) => formatPercent(n)
          return (
            <div key={r.label} className="flex items-center justify-between gap-4 rounded-md border border-line px-4 py-3">
              <span className="text-sm text-fg-secondary">{r.label}</span>
              <div className="text-right">
                <div className="text-sm font-semibold tabular text-fg">{fmt(r.campaign)}</div>
                <div className="text-2xs text-fg-muted">Benchmark {fmt(r.benchmark)} · <span className={better ? 'text-success' : 'text-warning'}>{better ? 'Above' : 'Below'} benchmark</span></div>
              </div>
            </div>
          )
        })}
      </div>
    </AnalyticsSection>
  )
}
