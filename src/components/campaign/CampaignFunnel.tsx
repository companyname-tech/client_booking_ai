import type { CampaignFunnelStage } from '@/types'
import { formatNumber, formatPercent } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'

export function CampaignFunnel({ stages }: { stages: CampaignFunnelStage[] }) {
  const max = stages[0]?.count ?? 1

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const width = Math.max(24, (stage.count / max) * 100)
        const isLast = i === stages.length - 1
        return (
          <div key={stage.id}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-fg">{stage.label}</span>
                  <AnimatedNumber value={stage.count} format={formatNumber} className="text-sm font-semibold tabular text-fg" />
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent/80 to-violet/80 transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
                {stage.conversionFromTotal !== undefined && i > 0 && (
                  <p className="mt-1 text-2xs text-fg-muted">
                    {formatPercent(stage.conversionFromTotal, 1)} of total leads
                    {stage.conversionFromPrev !== undefined && ` · ${formatPercent(stage.conversionFromPrev, 1)} from previous`}
                  </p>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="ml-4 flex h-4 items-center" aria-hidden>
                <span className="text-fg-faint">↓</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
