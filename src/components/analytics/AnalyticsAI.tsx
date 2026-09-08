import type { AnalyticsInsight, AnalyticsRecommendation, AIExecutiveSummary } from '@/types/campaignAnalytics'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { AnalyticsSection } from './AnalyticsShared'

export function CampaignWeakSpots({ weaknesses }: { weaknesses: AnalyticsInsight[] }) {
  return (
    <AnalyticsSection
      title="Campaign weak spots"
      description="Where the campaign is underperforming based on live funnel data"
    >
      {weaknesses.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No major weak spots detected yet. Weak spots appear once enough leads move through the funnel.
        </p>
      ) : (
        <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" stagger={0.04}>
          {weaknesses.map((ins) => (
            <Reveal key={ins.id} className="rounded-lg border border-danger/20 bg-danger/5 p-4">
              <div className="label-caps text-danger">{ins.title}</div>
              <p className="mt-2 font-medium text-fg">{ins.value}</p>
              {ins.comparison && <p className="mt-1 text-sm text-fg-muted">{ins.comparison}</p>}
              <p className="mt-2 text-xs text-fg-secondary">{ins.detail}</p>
            </Reveal>
          ))}
        </Stagger>
      )}
    </AnalyticsSection>
  )
}

/** @deprecated Use CampaignWeakSpots */
export function AIIntelligence({ insights, weaknesses }: { insights?: AnalyticsInsight[]; weaknesses?: AnalyticsInsight[] }) {
  return <CampaignWeakSpots weaknesses={weaknesses ?? insights ?? []} />
}

export function AIRecommendations({ items }: { items: AnalyticsRecommendation[] }) {
  return (
    <AnalyticsSection title="Recommended actions" description="What to change based on current campaign patterns">
      {items.length === 0 ? (
        <p className="text-sm text-fg-muted">
          Recommendations will appear once the campaign has leads and call activity to analyze.
        </p>
      ) : (
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
      )}
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
