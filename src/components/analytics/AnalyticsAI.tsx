import type { AnalyticsInsight, AnalyticsRecommendation, AIExecutiveSummary } from '@/types/campaignAnalytics'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { AnalyticsSection } from './AnalyticsShared'

export function AIIntelligence({ insights, conversationsAnalyzed }: { insights: AnalyticsInsight[]; conversationsAnalyzed: number }) {
  return (
    <AnalyticsSection title="AI Campaign Intelligence" description={`Your AI has analyzed ${conversationsAnalyzed.toLocaleString()} conversations.`}>
      <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.04}>
        {insights.map((ins) => (
          <Reveal key={ins.id} className="rounded-lg border border-line bg-surface-1 p-4">
            <div className="label-caps text-violet">{ins.title}</div>
            <p className="mt-2 font-medium text-fg">{ins.value}</p>
            {ins.comparison && <p className="mt-1 text-sm text-accent">{ins.comparison}</p>}
            <p className="mt-2 text-xs text-fg-muted">{ins.detail}</p>
          </Reveal>
        ))}
      </Stagger>
    </AnalyticsSection>
  )
}

export function AIRecommendations({ items }: { items: AnalyticsRecommendation[] }) {
  return (
    <AnalyticsSection title="Recommended actions" description="Mock AI suggestions based on campaign patterns">
      <ol className="space-y-4">
        {items.map((r, i) => (
          <li key={r.id} className="flex gap-4 rounded-lg border border-line bg-surface-1 p-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold text-fg-muted">{i + 1}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="label-caps text-accent">{r.type}</span>
                <span className="rounded-full border border-line px-2 py-0.5 text-2xs text-fg-muted">Impact: {r.impact}</span>
              </div>
              <p className="mt-1 font-medium text-fg">{r.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{r.reason}</p>
            </div>
          </li>
        ))}
      </ol>
    </AnalyticsSection>
  )
}

export function AIExecutiveSummary({ summary }: { summary: AIExecutiveSummary }) {
  return (
    <AnalyticsSection title="AI Executive Summary" description={summary.headline}>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "What's working", text: summary.working },
          { label: "What's changing", text: summary.changing },
          { label: 'What to do next', text: summary.next },
        ].map((block) => (
          <div key={block.label} className="rounded-lg border border-line bg-surface-1 p-4">
            <div className="label-caps">{block.label}</div>
            <p className="mt-2 text-sm text-fg-secondary">{block.text}</p>
          </div>
        ))}
      </div>
    </AnalyticsSection>
  )
}
