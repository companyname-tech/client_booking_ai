import { useEffect, useState } from 'react'
import { repo } from '@/api/repository'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import type { Client } from '@/types'

/** Allow digits and a single decimal point while the user types. */
function sanitizeFloatInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  const [whole, ...fraction] = cleaned.split('.')
  return fraction.length === 0 ? whole : `${whole}.${fraction.join('')}`
}

function parseOptionalBudget(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : undefined
}

export interface NewCampaignModalProps {
  open: boolean
  onClose: () => void
  /** Invoked after the offer is created — the caller reloads its campaign list. */
  onCreated: () => void
  /** When set, the campaign is created under this client and the client selector is hidden. */
  fixedClient?: Pick<Client, 'id' | 'name'>
  /** Clients to choose from when no fixedClient is set (all-campaigns screen). */
  clients?: Client[]
}

/**
 * Create-an-offer-campaign dialog. Used from the all-campaigns screen (client
 * chosen via dropdown) and from a client detail page (client fixed — the offer
 * is created with that client's client_id, so it immediately appears under the
 * client's campaign list).
 */
export function NewCampaignModal({ open, onClose, onCreated, fixedClient, clients = [] }: NewCampaignModalProps) {
  const [name, setName] = useState('')
  const [offerName, setOfferName] = useState('')
  const [category, setCategory] = useState('')
  const [budget, setBudget] = useState('')
  const [clientId, setClientId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setOfferName('')
    setCategory('')
    setBudget('')
    setClientId('')
    setError('')
    setSaving(false)
  }, [open])

  const effectiveClientId = fixedClient?.id ?? clientId
  const parsedBudget = parseOptionalBudget(budget)
  const budgetInvalid = budget.trim().length > 0 && parsedBudget === undefined
  const canSubmit =
    !saving && name.trim().length > 0 && effectiveClientId.length > 0 && !budgetInvalid

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setError('')
    try {
      const company =
        fixedClient?.name ?? clients.find((c) => c.id === clientId)?.name ?? ''
      await repo.createCampaign({
        name: name.trim(),
        offerName: offerName.trim() || undefined,
        category: category.trim(),
        company,
        clientId: effectiveClientId,
        budget: parsedBudget,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="New campaign"
      description={
        fixedClient
          ? `Create an offer campaign for ${fixedClient.name} — it will appear under this client.`
          : 'Create an offer campaign — attach it to a client and define the offer.'
      }
      size="sm"
    >
      <form className="space-y-4 p-5" onSubmit={submit}>
        {fixedClient ? (
          <div>
            <span className="text-xs text-fg-muted">Client</span>
            <div className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-fg">
              {fixedClient.name}
            </div>
            <p className="mt-1 text-2xs text-fg-muted">The campaign is attached to this client.</p>
          </div>
        ) : (
          <div>
            <span className="text-xs text-fg-muted">Client *</span>
            <Select
              value={clientId}
              onChange={(v) => setClientId(v)}
              ariaLabel="Client"
              placeholder="Select a client…"
              options={[
                { value: '', label: 'Select a client…' },
                ...clients.map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="mt-1 w-full"
            />
            <p className="mt-1 text-2xs text-fg-muted">The campaign is attached to this client.</p>
          </div>
        )}
        <div>
          <span className="text-xs text-fg-muted">Budget</span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-fg-muted">
              $
            </span>
            <Input
              inputMode="decimal"
              className="pl-7 tabular"
              value={budget}
              onChange={(e) => setBudget(sanitizeFloatInput(e.target.value))}
              placeholder="e.g. 500.00"
              error={budgetInvalid}
            />
          </div>
          <p className="mt-1 text-2xs text-fg-muted">
            Optional campaign budget cap. Numbers only — decimals allowed.
          </p>
          {budgetInvalid && (
            <p className="mt-1 text-2xs text-danger">Enter a valid number (e.g. 500 or 500.50).</p>
          )}
        </div>
        <div>
          <span className="text-xs text-fg-muted">Campaign name *</span>
          <Input
            className="mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arch Sites"
          />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Offer</span>
          <Input
            className="mt-1"
            value={offerName}
            onChange={(e) => setOfferName(e.target.value)}
            placeholder="The offer the campaign sells, e.g. Website redesign"
          />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Category</span>
          <Input
            className="mt-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Architecture"
          />
        </div>
        {error && <FieldError>{error}</FieldError>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" disabled={saving} type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={!canSubmit}>
            {saving ? 'Creating…' : 'Create campaign'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
