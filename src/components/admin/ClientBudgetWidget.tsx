import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, SectionHeader } from '@/components/ui/Card'
import { FieldGroup, FieldLabel } from '@/components/ui/Field'
import { formatCurrency } from '@/lib/utils'
import type { ClientBudgetSummary } from '@/types'

export interface ClientBudgetWidgetProps {
  mode: 'create' | 'edit'
  specificAmount: string
  onSpecificAmountChange: (value: string) => void
  retainerWeeklyAmount: string
  onRetainerWeeklyAmountChange: (value: string) => void
  initialWalletBalance?: string
  onInitialWalletBalanceChange?: (value: string) => void
  budget?: ClientBudgetSummary | null
  depositAmount?: string
  onDepositAmountChange?: (value: string) => void
  onRecordDeposit?: () => void
  depositing?: boolean
}

/** Standalone budget + wallet block for client create/edit screens. */
export function ClientBudgetWidget({
  mode,
  specificAmount,
  onSpecificAmountChange,
  retainerWeeklyAmount,
  onRetainerWeeklyAmountChange,
  initialWalletBalance = '',
  onInitialWalletBalanceChange,
  budget,
  depositAmount = '',
  onDepositAmountChange,
  onRecordDeposit,
  depositing = false,
}: ClientBudgetWidgetProps) {
  const isNew = mode === 'create'

  return (
    <Card id="client-wallet" className="p-5 sm:p-6">
      <SectionHeader
        title="Budget & wallet"
        description={
          isNew
            ? 'Contract amounts and the prepaid balance this client can allocate into campaigns.'
            : 'Agreed contract amounts and the prepaid wallet available for campaign budgets.'
        }
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor="cb-specific-amount">Specific amount ($)</FieldLabel>
          <Input
            id="cb-specific-amount"
            inputMode="decimal"
            value={specificAmount}
            onChange={(e) => onSpecificAmountChange(e.target.value)}
            placeholder="0"
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="cb-retainer-amount">Weekly retainer ($)</FieldLabel>
          <Input
            id="cb-retainer-amount"
            inputMode="decimal"
            value={retainerWeeklyAmount}
            onChange={(e) => onRetainerWeeklyAmountChange(e.target.value)}
            placeholder="0"
          />
        </FieldGroup>
      </div>

      {isNew ? (
        <div className="mt-5 max-w-sm">
          <FieldGroup>
            <FieldLabel htmlFor="cb-initial-wallet">Starting wallet balance ($)</FieldLabel>
            <Input
              id="cb-initial-wallet"
              inputMode="decimal"
              value={initialWalletBalance}
              onChange={(e) => onInitialWalletBalanceChange?.(e.target.value)}
              placeholder="e.g. 1000"
            />
          </FieldGroup>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_minmax(0,20rem)]">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface-1 px-4 py-3">
              <div className="text-2xs uppercase tracking-wide text-fg-muted">Available</div>
              <div className="mt-1 text-xl font-semibold tabular text-fg">
                {budget ? formatCurrency(budget.availableBalance) : '—'}
              </div>
            </div>
            <div className="rounded-lg border border-line bg-surface-1 px-4 py-3">
              <div className="text-2xs uppercase tracking-wide text-fg-muted">On campaigns</div>
              <div className="mt-1 text-xl font-semibold tabular text-fg">
                {budget ? formatCurrency(budget.allocatedToCampaigns) : '—'}
              </div>
            </div>
            <div className="rounded-lg border border-line bg-surface-1 px-4 py-3">
              <div className="text-2xs uppercase tracking-wide text-fg-muted">Currency</div>
              <div className="mt-1 text-xl font-semibold text-fg">{budget?.currency ?? 'USD'}</div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface-1 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Wallet className="size-4 text-accent" />
              <p className="text-sm font-medium text-fg">Manual deposit</p>
            </div>
            <FieldGroup>
              <FieldLabel htmlFor="cb-deposit">Amount ($)</FieldLabel>
              <Input
                id="cb-deposit"
                inputMode="decimal"
                value={depositAmount}
                onChange={(e) => onDepositAmountChange?.(e.target.value)}
                placeholder="e.g. 1000"
              />
            </FieldGroup>
            <Button
              variant="primary"
              className="mt-3 w-full"
              onClick={() => onRecordDeposit?.()}
              disabled={depositing}
            >
              {depositing ? 'Recording…' : 'Record deposit'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
