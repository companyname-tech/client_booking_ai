import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { repo } from '@/api/repository'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, SectionHeader } from '@/components/ui/Card'
import { FieldGroup, FieldLabel, FieldError } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { ClientBudgetWidget } from '@/components/admin/ClientBudgetWidget'
import { ClientBusyDaysWidget } from '@/components/admin/ClientBusyDaysWidget'
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
  const location = useLocation()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [industry, setIndustry] = useState('')
  const [plan, setPlan] = useState<'starter' | 'growth' | 'enterprise'>('growth')
  const [specificAmount, setSpecificAmount] = useState('')
  const [retainerWeeklyAmount, setRetainerWeeklyAmount] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [initialWalletBalance, setInitialWalletBalance] = useState('')
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
    setSpecificAmount(client?.specificAmount ? String(client.specificAmount) : '')
    setRetainerWeeklyAmount(client?.retainerWeeklyAmount ? String(client.retainerWeeklyAmount) : '')
    setContactName(client?.primaryContact?.name ?? '')
    setEmail(client?.primaryContact?.email ?? '')
    setRole(client?.primaryContact?.role ?? '')
    setInitialWalletBalance('')
    setError('')
    setNotice('')
  }, [client])

  useEffect(() => {
    if (location.hash === '#wallet') {
      document.getElementById('client-wallet')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (location.hash === '#busy-days') {
      document.getElementById('client-busy-days')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, client?.id])

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
        specificAmount: parseMoney(specificAmount),
        retainerWeeklyAmount: parseMoney(retainerWeeklyAmount),
        primaryContact: {
          name: contactName.trim(),
          email: email.trim(),
          role: role.trim(),
        },
        ...(isNew ? { walletBalance: parseMoney(initialWalletBalance) } : {}),
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

      <ClientBusyDaysWidget clientId={client?.id} />

      <ClientBudgetWidget
        mode={isNew ? 'create' : 'edit'}
        specificAmount={specificAmount}
        onSpecificAmountChange={setSpecificAmount}
        retainerWeeklyAmount={retainerWeeklyAmount}
        onRetainerWeeklyAmountChange={setRetainerWeeklyAmount}
        initialWalletBalance={initialWalletBalance}
        onInitialWalletBalanceChange={setInitialWalletBalance}
        budget={budget}
        depositAmount={depositAmount}
        onDepositAmountChange={setDepositAmount}
        onRecordDeposit={recordDeposit}
        depositing={depositing}
      />

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
