import { motion, useReducedMotion } from 'motion/react'
import type { Budget } from '@/types'
import {
  activeBudgetWarning,
  budgetUsedPercent,
  normalizeBudgetWarningThresholds,
  thresholdMarkerUsedPercent,
} from '@/lib/budgetWarnings'
import { clamp, cn } from '@/lib/utils'

export function BudgetProgressBar({
  budget,
  className,
  label = 'Budget used',
}: {
  budget: Pick<Budget, 'total' | 'used' | 'warningThresholds'>
  className?: string
  label?: string
}) {
  const reduce = useReducedMotion()
  const usedPct = clamp(budgetUsedPercent(budget), 0, 100)
  const thresholds = normalizeBudgetWarningThresholds(budget.warningThresholds)
  const warning = activeBudgetWarning(budget, thresholds)
  const fillTone = warning?.tone === 'danger' ? 'bg-danger' : warning ? 'bg-warning' : 'bg-accent'

  return (
    <div className={cn('space-y-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(usedPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="relative h-1 overflow-visible rounded-full bg-white/[0.07]"
      >
        {thresholds.map((threshold) => (
          <span
            key={threshold}
            className="pointer-events-none absolute top-1/2 z-10 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35"
            style={{ left: `${thresholdMarkerUsedPercent(threshold)}%` }}
            title={`${threshold}% remaining warning`}
            aria-hidden
          />
        ))}
        <motion.div
          className={cn('h-full rounded-full', fillTone)}
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: usedPct / 100 }}
          transition={{ type: 'spring', stiffness: 120, damping: 24, mass: 0.8 }}
          style={{ originX: 0, width: '100%' }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-fg-muted">
        {thresholds.map((threshold) => (
          <span key={threshold} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2 w-0.5 rounded-full bg-white/25"
              aria-hidden
            />
            {threshold}% remaining
          </span>
        ))}
      </div>
    </div>
  )
}
