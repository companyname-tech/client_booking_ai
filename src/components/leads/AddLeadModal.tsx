import { useEffect, useState, type ChangeEvent } from 'react'
import { repo } from '@/api/repository'
import type { OfferCampaign } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { PhoneField } from '@/components/ui/fields/PhoneField'

type AddLeadForm = {
  leadName: string
  offerId: string
  industry: string
  email: string
  phone: string
  contactName: string
  notes: string
}

const emptyForm: AddLeadForm = {
  leadName: '',
  offerId: '',
  industry: '',
  email: '',
  phone: '',
  contactName: '',
  notes: '',
}

export function AddLeadModal({
  open,
  onClose,
  onAdded,
  fixedOfferId,
  fixedCampaignName,
}: {
  open: boolean
  onClose: () => void
  onAdded: () => void
  /** Preset the campaign (lead is allocated to it) and hide the dropdown. */
  fixedOfferId?: string
  fixedCampaignName?: string
}) {
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [campaigns, setCampaigns] = useState<OfferCampaign[]>([])
  const [form, setForm] = useState<AddLeadForm>(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm({ ...emptyForm, offerId: fixedOfferId ?? '' })
    setFormError('')
    let active = true
    repo
      .getCampaigns()
      .then((cs) => {
        if (active) setCampaigns(cs)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [open])

  const set =
    (k: keyof AddLeadForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.leadName.trim()) {
      setFormError('Lead name is required.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await repo.addLead(form)
      onAdded()
      onClose()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to add lead.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Add lead"
      description="Manually add a lead and allocate it to a campaign."
    >
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <div>
          <span className="text-xs text-fg-muted">Lead name *</span>
          <Input className="mt-1" autoFocus value={form.leadName} onChange={set('leadName')} placeholder="e.g. David Cohen" />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Campaign</span>
          {fixedOfferId ? (
            <div className="mt-1 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm text-fg">
              {fixedCampaignName || fixedOfferId}
            </div>
          ) : (
            <Select
              value={form.offerId}
              onChange={(v) => setForm((f) => ({ ...f, offerId: v }))}
              ariaLabel="Campaign"
              placeholder="Unallocated — no campaign"
              options={[
                { value: '', label: 'Unallocated — no campaign' },
                ...campaigns.map((c) => ({ value: c.id, label: c.name })),
              ]}
              className="mt-1 w-full"
            />
          )}
          {fixedOfferId ? (
            <p className="mt-1 text-2xs text-fg-muted">This lead will be allocated to this campaign.</p>
          ) : (
            !form.offerId && (
              <p className="mt-1 text-2xs text-fg-muted">Pick a campaign to allocate this lead to an offer.</p>
            )
          )}
        </div>
        <div>
          <span className="text-xs text-fg-muted">Phone</span>
          <PhoneField
            className="mt-1"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="e.g. +972545551234"
          />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Email</span>
          <Input className="mt-1" value={form.email} onChange={set('email')} placeholder="e.g. david@example.com" />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Industry</span>
          <Input className="mt-1" value={form.industry} onChange={set('industry')} />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Contact name</span>
          <Input className="mt-1" value={form.contactName} onChange={set('contactName')} />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Notes</span>
          <Textarea className="mt-1 min-h-[72px]" rows={2} value={form.notes} onChange={set('notes')} />
        </div>
        {formError && <p className="text-xs text-danger">{formError}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={saving || !form.leadName.trim()}>
            {saving ? 'Adding…' : 'Add lead'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
