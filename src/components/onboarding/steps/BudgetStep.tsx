import { useRef } from 'react'
import type { CampaignDraft } from '@/types/campaignDraft'
import type { ValidationErrors } from '@/lib/onboardingValidation'
import { deriveDurationDays, deriveDaily } from '@/lib/budgetEstimates'
import { formatCurrency } from '@/lib/utils'
import { FieldGroup, FieldLabel } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { BudgetSummary } from '../BudgetSummary'

export function BudgetStep({
  draft,
  errors,
  onChange,
}: {
  draft: CampaignDraft
  errors: ValidationErrors
  onChange: (patch: Partial<CampaignDraft['budget']>) => void
}) {
  const b = draft.budget
  const lastEdited = useRef<'total' | 'daily' | 'duration'>('total')

  const applyPatch = (patch: Partial<CampaignDraft['budget']>) => {
    const next = { ...b, ...patch }
    if (lastEdited.current === 'duration' && patch.durationDays !== undefined) {
      onChange({ ...patch, daily: deriveDaily(next.total, next.durationDays) })
      return
    }
    if (patch.total !== undefined || patch.daily !== undefined) {
      onChange({ ...patch, durationDays: deriveDurationDays(next.total, next.daily) })
      return
    }
    onChange(patch)
  }

  const relation = `${formatCurrency(b.total)} ÷ ${formatCurrency(b.daily)}/day ≈ ${b.durationDays} days`

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
      <div className="min-w-0 space-y-5">
        <FieldGroup>
          <FieldLabel htmlFor="budget-total" required>
            Total campaign budget
          </FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-lg text-fg-muted">$</span>
            <Input
              id="budget-total"
              inputSize="lg"
              inputMode="decimal"
              className="pl-8"
              value={b.total || ''}
              onChange={(e) => {
                lastEdited.current = 'total'
                applyPatch({ total: Number(e.target.value) || 0 })
              }}
              error={!!errors.total}
            />
          </div>
          {errors.total && <p className="mt-1 text-xs text-danger">{errors.total}</p>}
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="budget-daily" required>
              Daily budget
            </FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-fg-muted">$</span>
              <Input
                id="budget-daily"
                inputMode="decimal"
                className="pl-7 tabular"
                value={b.daily || ''}
                onChange={(e) => {
                  lastEdited.current = 'daily'
                  applyPatch({ daily: Number(e.target.value) || 0 })
                }}
                error={!!errors.daily}
              />
            </div>
            {errors.daily && <p className="mt-1 text-xs text-danger">{errors.daily}</p>}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="budget-duration">Estimated duration (days)</FieldLabel>
            <Input
              id="budget-duration"
              inputMode="numeric"
              className="tabular"
              value={b.durationDays || ''}
              onChange={(e) => {
                lastEdited.current = 'duration'
                applyPatch({ durationDays: Number(e.target.value) || 0 })
              }}
            />
          </FieldGroup>
        </div>

        <p className="rounded-md border border-line bg-surface-1 px-3 py-2.5 text-sm tabular text-fg-secondary">
          {relation}
        </p>
      </div>

      <BudgetSummary draft={draft} />
    </div>
  )
}
