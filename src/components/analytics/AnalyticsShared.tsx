import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { AnalyticsDelta } from '@/types/campaignAnalytics'
import { cn, formatCurrency, formatDelta, formatNumber, formatPercent } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { Reveal } from '@/components/motion/Reveal'

export function DeltaBadge({ delta, className }: { delta: AnalyticsDelta; className?: string }) {
  const positive = delta.positiveIsGood ? delta.value > 0 : delta.value < 0
  const neutral = delta.value === 0
  const label = delta.format === 'points' ? `${delta.value > 0 ? '+' : ''}${delta.value.toFixed(1)}pp` : formatDelta(delta.value)
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-2xs font-medium tabular', neutral ? 'text-fg-muted' : positive ? 'text-success' : 'text-danger', className)}>
      {!neutral && (positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />)}
      {label}
    </span>
  )
}

export function AnalyticsSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Reveal as="section" className={cn('surface p-5 sm:p-6', className)}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {children}
    </Reveal>
  )
}

export function StatBlock({
  label,
  value,
  format = 'number',
  delta,
  className,
}: {
  label: string
  value: number
  format?: 'number' | 'percent' | 'currency'
  delta?: AnalyticsDelta
  className?: string
}) {
  const fmt = format === 'currency' ? formatCurrency : format === 'percent' ? (n: number) => formatPercent(n) : formatNumber
  return (
    <div className={className}>
      <div className="text-xs text-fg-muted">{label}</div>
      <AnimatedNumber value={value} format={fmt} className="mt-1 text-2xl font-semibold tabular text-fg" />
      {delta && <div className="mt-1"><DeltaBadge delta={delta} /></div>}
    </div>
  )
}

export function ComparisonRow({
  label,
  current,
  previous: _previous,
  delta,
  format,
  positiveIsGood,
}: {
  label: string
  current: number
  previous: number
  delta: number
  format: 'number' | 'percent' | 'currency'
  positiveIsGood: boolean
}) {
  const fmt = format === 'currency' ? formatCurrency : format === 'percent' ? (n: number) => formatPercent(n) : formatNumber
  const positive = positiveIsGood ? delta > 0 : delta < 0
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
      <span className="text-sm text-fg-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold tabular text-fg">{fmt(current)}</span>
        <span className={cn('inline-flex items-center gap-0.5 text-2xs font-medium tabular', positive ? 'text-success' : 'text-danger')}>
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {format === 'percent' ? `${Math.abs(delta).toFixed(1)}pp` : formatDelta(Math.abs(delta))}
        </span>
      </div>
    </div>
  )
}
