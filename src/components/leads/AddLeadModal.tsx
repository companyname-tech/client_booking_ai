import { useEffect, useState, type ChangeEvent } from 'react'
import { repo } from '@/api/repository'
import type { OfferCampaign } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent'

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
}: {
  open: boolean
  onClose: () => void
  onAdded: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [campaigns, setCampaigns] = useState<OfferCampaign[]>([])
  const [form, setForm] = useState<AddLeadForm>(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
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
          <input className={inputClass} autoFocus value={form.leadName} onChange={set('leadName')} placeholder="e.g. David Cohen" />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Campaign</span>
          <select className={inputClass} value={form.offerId} onChange={set('offerId')}>
            <option value="">Unallocated — no campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {!form.offerId && (
            <p className="mt-1 text-2xs text-fg-muted">Pick a campaign to allocate this lead to an offer.</p>
          )}
        </div>
        <div>
          <span className="text-xs text-fg-muted">Phone</span>
          <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="e.g. +972501234567" />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Email</span>
          <input className={inputClass} value={form.email} onChange={set('email')} placeholder="e.g. david@example.com" />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Industry</span>
          <input className={inputClass} value={form.industry} onChange={set('industry')} />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Contact name</span>
          <input className={inputClass} value={form.contactName} onChange={set('contactName')} />
        </div>
        <div>
          <span className="text-xs text-fg-muted">Notes</span>
          <textarea className={inputClass} rows={2} value={form.notes} onChange={set('notes')} />
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
