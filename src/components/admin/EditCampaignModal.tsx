import { useEffect, useState } from 'react'
import { repo } from '@/api/repository'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { OfferCampaign } from '@/types'

export interface EditCampaignModalProps {
  open: boolean
  /** The campaign being edited (null/undefined = nothing to edit). */
  campaign: OfferCampaign | null
  onClose: () => void
  /** Invoked after a successful save — the caller reloads its campaign list. */
  onSaved: () => void
}

/**
 * Edit-an-offer-campaign dialog. Edits the campaign name (offer title) and the
 * offer pitch (value proposition) — the two fields that round-trip through
 * PUT /offers/{id} and drive what the row shows and what the AI sells.
 */
export function EditCampaignModal({ open, campaign, onClose, onSaved }: EditCampaignModalProps) {
  const [name, setName] = useState('')
  const [pitch, setPitch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(campaign?.name ?? '')
    setPitch(campaign?.valueProposition ?? '')
    setError('')
    setSaving(false)
  }, [open, campaign])

  const canSubmit = !saving && name.trim().length > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaign || !canSubmit) return
    setSaving(true)
    setError('')
    try {
      await repo.updateCampaignOffer(campaign.id, {
        title: name.trim(),
        pitch: pitch.trim(),
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Edit campaign"
      description={campaign ? `Update "${campaign.name}" — the offer the AI sells to leads.` : 'Edit campaign'}
      size="sm"
    >
      <form className="space-y-4 p-5" onSubmit={submit}>
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
          <span className="text-xs text-fg-muted">Offer pitch</span>
          <Textarea
            className="mt-1"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            rows={4}
            placeholder="What does this campaign sell? This is the pitch the AI uses on calls."
          />
          <p className="mt-1 text-2xs text-fg-muted">
            Shown as the offer on the campaign screen and used by the agent when talking to leads.
          </p>
        </div>
        {error && <FieldError>{error}</FieldError>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" disabled={saving} type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={!canSubmit}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
