import type { AnalyticsDropOff, AnalyticsFunnelStage } from '@/types/campaignAnalytics'
import { formatNumber, formatPercent } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { Reveal } from '@/components/motion/Reveal'
import { AnalyticsSection } from './AnalyticsShared'

export function AnalyticsFunnel({ stages }: { stages: AnalyticsFunnelStage[] }) {
  const max = stages[0]?.count ?? 1
  return (
    <AnalyticsSection title="Conversion funnel" description="Lead progression through each stage">
      {stages.length === 0 ? (
        <p className="text-sm text-fg-muted">Funnel data will appear once leads enter the campaign.</p>
      ) : (
        <div className="space-y-1">
          {stages.map((stage, i) => {
            const width = Math.max(20, (stage.count / max) * 100)
            const isLast = i === stages.length - 1
            return (
              <Reveal key={stage.id}>
                <div className="flex items-stretch gap-3">
                  <div className="flex w-6 shrink-0 flex-col items-center pt-2">
                    <span className="size-2 rounded-full bg-accent" />
                    {!isLast && <span className="my-1 w-px flex-1 bg-line-strong" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-fg">{stage.label}</span>
                      <AnimatedNumber value={stage.count} format={formatNumber} className="text-sm font-semibold tabular text-fg" />
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent/70 to-violet/70 transition-all duration-500" style={{ width: `${width}%` }} />
                    </div>
                    <p className="mt-1.5 text-2xs text-fg-muted">
                      {formatPercent(stage.percentOfTotal ?? 0, 1)} of total
                      {stage.conversionFromPrev != null && i > 0 && ` · ${formatPercent(stage.conversionFromPrev, 1)} from previous`}
                    </p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      )}
    </AnalyticsSection>
  )
}

export function DropOffAnalysis({ dropOffs }: { dropOffs: AnalyticsDropOff[] }) {
  const biggest = dropOffs.find((d) => d.isBiggestOpportunity)
  return (
    <AnalyticsSection title="Where prospects drop off" description="Stage-by-stage attrition">
      {dropOffs.length === 0 ? (
        <p className="text-sm text-fg-muted">
          Drop-off analysis appears once leads progress through multiple funnel stages.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {dropOffs.map((d) => (
              <li key={`${d.from}-${d.to}`} className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface-1 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-fg">{d.from} → {d.to}</div>
                  {d.currentConversion != null && (
                    <div className="mt-0.5 text-2xs text-fg-muted">Current conversion: {formatPercent(d.currentConversion * 100, 1)}</div>
                  )}
                </div>
                <span className="text-sm font-semibold tabular text-danger">{formatPercent(d.dropOffPercent, 0)} drop-off</span>
              </li>
            ))}
          </ul>
          {biggest && (
            <div className="mt-4 rounded-lg border border-accent/20 bg-accent-soft/10 p-4">
              <div className="label-caps text-accent">Biggest opportunity</div>
              <p className="mt-1 font-medium text-fg">{biggest.from} → {biggest.to}</p>
              <p className="mt-1 text-sm text-fg-muted">
                {biggest.potentialImprovement ?? 'Focus optimization efforts on this stage first.'}
              </p>
            </div>
          )}
        </>
      )}
    </AnalyticsSection>
  )
}
