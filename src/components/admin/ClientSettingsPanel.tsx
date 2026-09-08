import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { repo } from '@/api/repository'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, SectionHeader } from '@/components/ui/Card'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { formatCurrency } from '@/lib/utils'
import type { Client, ClientBudgetSummary } from '@/types'

export function ClientSettingsPanel({
  client,
  onSaved,
}: {
  client?: Client | null
  onSaved: (client: Client) => void
}) {
  const isNew = !client?.id
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [industry, setIndustry] = useState('')
  const [plan, setPlan] = useState<'starter' | 'growth' | 'enterprise'>('growth')
  const [engagementType, setEngagementType] = useState<Client['engagementType']>('')
  const [specificAmount, setSpecificAmount] = useState('')
  const [retainerWeeklyAmount, setRetainerWeeklyAmount] = useState('')
  const [engagementStart, setEngagementStart] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [budget, setBudget] = useState<ClientBudgetSummary | null>(null)
  const [saving, setSaving] = useState(false)
  const [depositing, setDepositing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setName(client?.name ?? '')
    setSlug(client?.slug ?? '')
    setIndustry(client?.industry ?? '')
    setPlan(client?.plan ?? 'growth')
    setEngagementType(client?.engagementType ?? '')
    setSpecificAmount(client?.specificAmount ? String(client.specificAmount) : '')
    setRetainerWeeklyAmount(client?.retainerWeeklyAmount ? String(client.retainerWeeklyAmount) : '')
    setEngagementStart(client?.engagementStart ?? '')
    setContactName(client?.primaryContact?.name ?? '')
    setEmail(client?.primaryContact?.email ?? '')
    setRole(client?.primaryContact?.role ?? '')
    setError('')
    setNotice('')
  }, [client])

  useEffect(() => {
    if (!client?.id) {
      setBudget(null)
      return
    }
    void repo.getAdminClientBudget(client.id).then(setBudget).catch(() => setBudget(null))
  }, [client?.id])

  const parseMoney = (raw: string) => {
    const n = Number(raw.replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  const submit = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        industry: industry.trim(),
        plan,
        engagementType: engagementType ?? '',
        specificAmount: parseMoney(specificAmount),
        retainerWeeklyAmount: parseMoney(retainerWeeklyAmount),
        engagementStart: engagementStart.trim(),
        primaryContact: {
          name: contactName.trim(),
          email: email.trim(),
          role: role.trim(),
        },
      }
      const saved = isNew
        ? await repo.createClient(payload)
        : await repo.updateClient(client!.id, payload)
      onSaved(saved)
      setNotice(isNew ? 'Client workspace created.' : 'Client settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  const recordDeposit = async () => {
    if (!client?.id) return
    const amount = parseMoney(depositAmount)
    if (amount <= 0) {
      setError('Enter a deposit amount greater than zero.')
      return
    }
    setDepositing(true)
    setError('')
    setNotice('')
    try {
      const next = await repo.depositClientWallet(client.id, amount)
      setBudget(next)
      setDepositAmount('')
      setNotice(`Recorded ${formatCurrency(amount)} deposit.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed')
    } finally {
      setDepositing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader title="Workspace" description="Identity and plan for this client workspace." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldGroup className="sm:col-span-2">
            <FieldLabel htmlFor="cs-name" required>Name</FieldLabel>
            <Input id="cs-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" data-autofocus />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="cs-slug">Slug</FieldLabel>
            <Input id="cs-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-corp" />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="cs-plan">Plan</FieldLabel>
            <Select
              id="cs-plan"
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
          <FieldGroup className="sm:col-span-2">
            <FieldLabel htmlFor="cs-industry">Industry</FieldLabel>
            <Input id="cs-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Finance" />
          </FieldGroup>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader title="Engagement" description="Contract type and agreed amounts for this client." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="cs-engagement-type">Engagement type</FieldLabel>
            <Select
              id="cs-engagement-type"
              value={engagementType ?? ''}
              onChange={(v) => setEngagementType(v as Client['engagementType'])}
              ariaLabel="Engagement type"
              options={[
                { value: '', label: 'Not set' },
                { value: 'specific', label: 'Specific (one-time)' },
                { value: 'retainer_weekly', label: 'Weekly retainer' },
              ]}
              className="w-full"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="cs-engagement-start">Engagement start</FieldLabel>
            <Input id="cs-engagement-start" value={engagementStart} onChange={(e) => setEngagementStart(e.target.value)} placeholder="DD/MM/YYYY" />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="cs-specific-amount">Specific amount ($)</FieldLabel>
            <Input
              id="cs-specific-amount"
              inputMode="decimal"
              value={specificAmount}
              onChange={(e) => setSpecificAmount(e.target.value)}
              placeholder="0"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="cs-retainer-amount">Weekly retainer ($)</FieldLabel>
            <Input
              id="cs-retainer-amount"
              inputMode="decimal"
              value={retainerWeeklyAmount}
              onChange={(e) => setRetainerWeeklyAmount(e.target.value)}
              placeholder="0"
            />
          </FieldGroup>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader title="Primary contact" description="Owner or main point of contact for this workspace." />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="cs-cname">Name</FieldLabel>
            <Input id="cs-cname" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John Doe" />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="cs-role">Role</FieldLabel>
            <Input id="cs-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="owner" />
          </FieldGroup>
          <FieldGroup className="sm:col-span-2">
            <FieldLabel htmlFor="cs-email">Email</FieldLabel>
            <Input id="cs-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@acme.com" />
          </FieldGroup>
        </div>
      </Card>

      {!isNew && (
        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Wallet & deposits"
            description="Prepaid balance the client can allocate into campaign budgets. Record manual deposits from AOA."
          />
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
                <FieldLabel htmlFor="cs-deposit">Amount ($)</FieldLabel>
                <Input
                  id="cs-deposit"
                  inputMode="decimal"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 1000"
                />
              </FieldGroup>
              <Button
                variant="primary"
                className="mt-3 w-full"
                onClick={() => void recordDeposit()}
                disabled={depositing}
              >
                {depositing ? 'Recording…' : 'Record deposit'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="min-h-5 text-sm">
          {notice && <p className="text-success">{notice}</p>}
          {error && <FieldError>{error}</FieldError>}
        </div>
        <Button variant="primary" onClick={() => void submit()} disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Create client' : 'Save settings'}
        </Button>
      </div>
    </div>
  )
}
