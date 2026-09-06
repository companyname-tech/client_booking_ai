import { memo, useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { MetricSeries, Tone } from '@/types'
import { cn, formatCurrency, formatDelta, formatNumber } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { Reveal } from '@/components/motion/Reveal'
import { Sparkline } from '@/components/ui/Sparkline'

export interface MetricCardProps {
  metric: MetricSeries
  tone?: Tone
  /** Larger presentation used for the two hero metrics. */
  emphasis?: boolean
  /** Lower-is-better metrics invert delta colouring. */
  invertDelta?: boolean
  className?: string
}

const formatters = {
  number: (n: number) => formatNumber(Math.round(n)),
  percent: (n: number) => `${n.toFixed(1)}%`,
  currency: (n: number) => formatCurrency(n),
}

export const MetricCard = memo(function MetricCard({ metric, tone = 'info', emphasis, invertDelta, className }: MetricCardProps) {
  const format = formatters[metric.format]
  const positive = invertDelta ? metric.delta < 0 : metric.delta > 0
  const neutral = metric.delta === 0
  const history = useMemo(() => metric.history.map((p) => p.value), [metric.history])

  return (
    <Reveal
      as="div"
      className={cn(
        'group relative flex flex-col justify-between bg-surface-2 p-4 transition-colors hover:bg-surface-3/80 sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-fg-muted">{metric.label}</span>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-2xs font-medium tabular',
            neutral ? 'text-fg-muted' : positive ? 'text-success' : 'text-danger',
          )}
        >
          {!neutral && (positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />)}
          {formatDelta(metric.delta)}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <AnimatedNumber
          value={metric.value}
          format={format}
          className={cn('font-semibold tracking-tight text-fg', emphasis ? 'text-3xl sm:text-4xl' : 'text-2xl')}
        />
        <Sparkline
          data={history}
          width={emphasis ? 120 : 84}
          height={emphasis ? 36 : 28}
          tone={positive || neutral ? tone : 'danger'}
          className="shrink-0 opacity-80 transition-opacity group-hover:opacity-100"
        />
      </div>
      <div className="mt-1.5 text-2xs text-fg-faint">vs. previous 7 days</div>
    </Reveal>
  )
})
