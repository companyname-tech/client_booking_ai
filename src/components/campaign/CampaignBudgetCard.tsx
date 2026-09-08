import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import type { Budget, ClientBudgetSummary, OfferCampaign } from '@/types'
import { repo } from '@/data/repository'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { FieldLabel, FieldError } from '@/components/ui/Field'

export function CampaignBudgetCard({
  campaignId,
  budget,
  zone,
  onBudgetUpdated,
}: {
  campaignId: string
  budget: Budget
  zone: 'client' | 'admin'
  onBudgetUpdated?: (next: OfferCampaign['budget']) => void
}) {
  const budgetPct = budget.total > 0 ? (budget.used / budget.total) * 100 : 0
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState<ClientBudgetSummary | null>(null)
  const [amount, setAmount] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const parsedAmount = Number(amount.replace(/[^0-9.]/g, ''))
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0
  const available = summary?.availableBalance ?? 0
  const canAllocate = validAmount && parsedAmount <= available

  const openModal = async () => {
    setOpen(true)
    setError('')
    setAmount('')
    setLoadingSummary(true)
    try {
      const next = await repo.getClientBudgetSummary()
      setSummary(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wallet balance')
    } finally {
      setLoadingSummary(false)
    }
  }

  const close = () => {
    if (busy) return
    setOpen(false)
    setError('')
    setAmount('')
  }

  const submit = async (fundFrom: 'wallet' | 'payment') => {
    if (!validAmount) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (fundFrom === 'wallet' && parsedAmount > available) {
      setError('Not enough balance — pay to add funds first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await repo.addCampaignBudget(campaignId, parsedAmount, fundFrom)
      setSummary(result)
      onBudgetUpdated?.({
        ...budget,
        total: result.campaignBudget.total,
      })
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add campaign budget')
    } finally {
      setBusy(false)
    }
  }

  const topUp = async () => {
    if (!validAmount) {
      setError('Enter an amount greater than zero.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const next = await repo.topUpClientWallet(parsedAmount)
      setSummary(next)
      setAmount('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="rounded-lg border border-line bg-surface-2 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <AnimatedNumber value={budget.used} format={formatCurrency} className="text-xl font-semibold text-fg" />
            <span className="ml-1 text-sm text-fg-muted">/ {formatCurrency(budget.total)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm tabular text-fg-secondary">
              {budget.total > 0 ? formatPercent(budgetPct, 1) : '0%'} used
            </span>
            {zone === 'client' && (
              <Button variant="secondary" size="sm" leadingIcon={<Plus />} onClick={() => void openModal()}>
                Add budget
              </Button>
            )}
          </div>
        </div>
        <ProgressBar value={budgetPct} tone="warning" size="sm" className="mt-3" label="Budget used" />
        {budget.total <= 0 && zone === 'client' && (
          <p className="mt-2 text-xs text-fg-muted">
            Allocate from your workspace balance or pay to fund this campaign.
          </p>
        )}
      </div>

      <Modal
        open={open}
        onClose={close}
        size="md"
        fitContent
        title="Add campaign budget"
        description="Move funds from your workspace balance into this campaign, or pay to add more."
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button>
            <Button
              variant="secondary"
              onClick={() => void submit('wallet')}
              disabled={busy || !canAllocate}
            >
              {busy ? 'Adding…' : 'Use balance'}
            </Button>
            <Button
              variant="primary"
              onClick={() => void submit('payment')}
              disabled={busy || !validAmount}
            >
              {busy ? 'Processing…' : 'Pay & add'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-1 px-4 py-3">
            <Wallet className="size-4 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="text-xs text-fg-muted">Available workspace balance</p>
              <p className="text-lg font-semibold tabular text-fg">
                {loadingSummary ? '…' : formatCurrency(available)}
              </p>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="campaign-budget-amount" required>Amount to add</FieldLabel>
            <Input
              id="campaign-budget-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => void topUp()} disabled={busy || !validAmount}>
              Top up balance only
            </Button>
          </div>

          {error && <FieldError>{error}</FieldError>}
        </div>
      </Modal>
    </>
  )
}
