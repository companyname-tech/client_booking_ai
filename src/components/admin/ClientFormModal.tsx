import { useEffect, useState } from 'react'
import { repo } from '@/api/repository'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { DateField } from '@/components/ui/fields/DateField'
import type { Client } from '@/types'

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  client?: Client | null
  onSaved: (client: Client) => void
}

export function ClientFormModal({ open, onClose, client, onSaved }: ClientFormModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [industry, setIndustry] = useState('')
  const [plan, setPlan] = useState<'starter' | 'growth' | 'enterprise'>('growth')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [engagementType, setEngagementType] = useState<'specific' | 'retainer_weekly' | ''>('')
  const [specificAmount, setSpecificAmount] = useState('')
  const [retainerWeeklyAmount, setRetainerWeeklyAmount] = useState('')
  const [engagementStart, setEngagementStart] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(client?.name ?? '')
    setSlug(client?.slug ?? '')
    setIndustry(client?.industry ?? '')
    setPlan(client?.plan ?? 'growth')
    setContactName(client?.primaryContact?.name ?? '')
    setEmail(client?.primaryContact?.email ?? '')
    setRole(client?.primaryContact?.role ?? '')
    setEngagementType(client?.engagementType ?? '')
    setSpecificAmount(client?.specificAmount ? String(client.specificAmount) : '')
    setRetainerWeeklyAmount(client?.retainerWeeklyAmount ? String(client.retainerWeeklyAmount) : '')
    setEngagementStart(client?.engagementStart ?? '')
    setError('')
  }, [open, client])

  const submit = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        industry: industry.trim(),
        plan,
        engagementType,
        specificAmount: engagementType === 'specific' ? Number(specificAmount) || 0 : 0,
        retainerWeeklyAmount: engagementType === 'retainer_weekly' ? Number(retainerWeeklyAmount) || 0 : 0,
        engagementStart,
        primaryContact: {
          name: contactName.trim(),
          email: email.trim(),
          role: role.trim(),
        },
      }
      const saved = client
        ? await repo.updateClient(client.id, payload)
        : await repo.createClient(payload)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? 'Edit client' : 'Add client'}
      description={client ? 'Update the client workspace.' : 'Create a new client workspace.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : client ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 px-5 py-4">
        <FieldGroup>
          <FieldLabel htmlFor="cf-name" required>Name</FieldLabel>
          <Input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" data-autofocus />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <FieldLabel htmlFor="cf-slug">Slug</FieldLabel>
            <Input id="cf-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-corp" />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="cf-plan">Plan</FieldLabel>
            <Select
              id="cf-plan"
              value={plan}
              onChange={(v) => setPlan(v as typeof plan)}
              ariaLabel="Plan"
              options={[
                { value: 'starter', label: 'starter' },
                { value: 'growth', label: 'growth' },
                { value: 'enterprise', label: 'enterprise' },
              ]}
              className="w-full"
            />
          </FieldGroup>
        </div>
        <FieldGroup>
          <FieldLabel htmlFor="cf-industry">Industry</FieldLabel>
          <Input id="cf-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Finance" />
        </FieldGroup>
        <div className="rounded-md border border-line p-3">
          <p className="text-sm font-medium text-fg">Engagement &amp; billing</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <FieldGroup>
              <FieldLabel htmlFor="cf-engagement-type">Type</FieldLabel>
              <Select
                id="cf-engagement-type"
                value={engagementType}
                onChange={(v) => setEngagementType(v as typeof engagementType)}
                ariaLabel="Engagement type"
                options={[
                  { value: '', label: 'Not set' },
                  { value: 'specific', label: 'Specific — one-time' },
                  { value: 'retainer_weekly', label: 'Retainer — weekly' },
                ]}
                className="w-full"
              />
            </FieldGroup>
            <FieldGroup>
              {engagementType === 'retainer_weekly' ? (
                <>
                  <FieldLabel htmlFor="cf-retainer-amount">Weekly amount ($)</FieldLabel>
                  <Input
                    id="cf-retainer-amount"
                    type="number"
                    min="0"
                    value={retainerWeeklyAmount}
                    onChange={(e) => setRetainerWeeklyAmount(e.target.value)}
                    placeholder="e.g. 1200"
                  />
                </>
              ) : (
                <>
                  <FieldLabel htmlFor="cf-specific-amount">Amount ($)</FieldLabel>
                  <Input
                    id="cf-specific-amount"
                    type="number"
                    min="0"
                    value={specificAmount}
                    onChange={(e) => setSpecificAmount(e.target.value)}
                    placeholder="e.g. 3000"
                  />
                </>
              )}
            </FieldGroup>
          </div>
          <FieldGroup className="mt-3">
            <FieldLabel htmlFor="cf-engagement-start">Starts on</FieldLabel>
            <DateField
              id="cf-engagement-start"
              value={engagementStart}
              onChange={setEngagementStart}
              className="w-full"
              placeholder="Pick the start date…"
            />
          </FieldGroup>
        </div>
        <div className="border-t border-line pt-4">
          <p className="mb-3 text-sm font-medium text-fg">Primary contact</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <FieldLabel htmlFor="cf-cname">Name</FieldLabel>
              <Input id="cf-cname" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John Doe" />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="cf-role">Role</FieldLabel>
              <Input id="cf-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="owner" />
            </FieldGroup>
          </div>
          <FieldGroup className="mt-3">
            <FieldLabel htmlFor="cf-email">Email</FieldLabel>
            <Input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@acme.com" />
          </FieldGroup>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </div>
    </Modal>
  )
}
