import type { DraftBudget } from '@/types/campaignDraft'

export interface BudgetEstimates {
  leadsMin: number
  leadsMax: number
  callsMin: number
  callsMax: number
  bookingsMin: number
  bookingsMax: number
}

/**
 * Estimated projections derived from budget. Replace with backend/AI later.
 */
export function estimateFromBudget(budget: DraftBudget): BudgetEstimates {
  const days = budget.durationDays || Math.max(1, Math.round(budget.total / Math.max(budget.daily, 1)))
  const spend = budget.total
  const leadsPerDollar = 0.52
  const callRate = 0.48
  const bookingRate = 0.1

  const leads = spend * leadsPerDollar
  const calls = leads * callRate
  const bookings = calls * bookingRate

  const variance = 0.15 + (days % 7) * 0.01
  return {
    leadsMin: Math.round(leads * (1 - variance)),
    leadsMax: Math.round(leads * (1 + variance)),
    callsMin: Math.round(calls * (1 - variance)),
    callsMax: Math.round(calls * (1 + variance)),
    bookingsMin: Math.round(bookings * (1 - variance)),
    bookingsMax: Math.round(bookings * (1 + variance)),
  }
}

export function deriveDurationDays(total: number, daily: number): number {
  if (daily <= 0) return 0
  return Math.max(1, Math.round(total / daily))
}

export function deriveDaily(total: number, days: number): number {
  if (days <= 0) return 0
  return Math.round(total / days)
}
