import type { Budget } from '@/types'

/** Default remaining-budget warning thresholds (%) — warn as funds run low. */
export const DEFAULT_BUDGET_WARNING_THRESHOLDS = [50, 25, 5] as const

export function normalizeBudgetWarningThresholds(
  thresholds?: number[] | null,
): number[] {
  const source = thresholds?.length ? thresholds : [...DEFAULT_BUDGET_WARNING_THRESHOLDS]
  const cleaned = source
    .map((n) => Math.round(Number(n)))
    .filter((n) => Number.isFinite(n) && n > 0 && n <= 100)
  const unique = [...new Set(cleaned)]
  return unique.length ? unique.sort((a, b) => b - a) : [...DEFAULT_BUDGET_WARNING_THRESHOLDS]
}

export function budgetRemainingPercent(budget: Pick<Budget, 'total' | 'used'>): number {
  if (budget.total <= 0) return 100
  const remaining = Math.max(0, budget.total - budget.used)
  return (remaining / budget.total) * 100
}

export function budgetUsedPercent(budget: Pick<Budget, 'total' | 'used'>): number {
  if (budget.total <= 0) return 0
  return Math.min(100, (budget.used / budget.total) * 100)
}

/** Most severe crossed remaining-% threshold, if any. */
export function activeBudgetWarning(
  budget: Pick<Budget, 'total' | 'used'>,
  thresholds?: number[] | null,
): { threshold: number; remainingPct: number; tone: 'warning' | 'danger' } | null {
  if (budget.total <= 0) return null
  const remainingPct = budgetRemainingPercent(budget)
  const normalized = normalizeBudgetWarningThresholds(thresholds)
  const crossed = normalized.filter((t) => remainingPct <= t)
  if (!crossed.length) return null
  const threshold = Math.min(...crossed)
  return {
    threshold,
    remainingPct,
    tone: threshold <= 5 ? 'danger' : 'warning',
  }
}

/** Map a remaining-% threshold to the used-% position on the progress bar. */
export function thresholdMarkerUsedPercent(threshold: number): number {
  return Math.min(100, Math.max(0, 100 - threshold))
}
