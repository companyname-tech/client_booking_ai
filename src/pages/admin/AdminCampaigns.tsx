import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const FILTERS = ['All', 'Awaiting Review', 'Training', 'Live', 'Paused', 'Completed', 'Rejected'] as const

const inputClass =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent'

export default function AdminCampaigns() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('All')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', offerName: '', category: '', clientId: '' })
  const { data, loading, error, reload } = useAsyncData(() =>
    Promise.all([repo.getCampaigns(), repo.getAllAdminMeta()]),
  )
  const { data: clientsData } = useAsyncData(() => repo.getClients({ pageSize: 100 }), [])
  const campaigns = data?.[0] ?? []
  const metas = data?.[1] ?? []
  const clients = clientsData?.items ?? []

  const filtered = useMemo(() => {
    let list = campaigns
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
    }
    if (filter !== 'All') {
      list = list.filter((c) => {
        const m = metas.find((x) => x.offerCampaignId === c.id)
        if (filter === 'Awaiting Review') return ['awaiting_approval', 'preparing'].includes(c.status) || m?.workflowStatus === 'awaiting_approval'
        if (filter === 'Training') return c.status === 'ai_training'
        if (filter === 'Live') return c.status === 'active'
        if (filter === 'Paused') return c.status === 'paused'
        if (filter === 'Completed') return c.status === 'completed'
        if (filter === 'Rejected') return c.status === 'rejected'
        return true
      })
    }
    return list
  }, [campaigns, metas, search, filter])

  const selection = useBulkSelection(filtered.map((c) => c.id))
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkNotice, setBulkNotice] = useState('')

  const runBulkDelete = async () => {
    const ids = filtered.filter((c) => selection.selected.has(c.id)).map((c) => c.id)
    if (ids.length === 0) return
    setBulkBusy(true)
    setBulkNotice('')
    try {
      const res = await repo.bulkDeleteCampaigns(ids)
      setBulkNotice(
        res.failed
          ? `Deleted ${res.affected}, ${res.failed} failed`
          : `Deleted ${res.affected} campaign${res.affected === 1 ? '' : 's'}`,
      )
      selection.clear()
      setConfirmBulk(false)
      void reload()
    } catch (e) {
      setBulkNotice(`Bulk delete failed: ${e instanceof Error ? e.message : String(e)}`)
      setConfirmBulk(false)
    } finally {
      setBulkBusy(false)
    }
  }

  const submit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const selectedClient = clients.find((c) => c.id === form.clientId)
      await repo.createCampaign({
        name: form.name,
        offerName: form.offerName,
        category: form.category,
        clientId: form.clientId,
        company: selectedClient?.name ?? '',
      })
      setCreating(false)
      setForm({ name: '', offerName: '', category: '', clientId: '' })
      void reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader eyebrow={<WorkspaceEyebrow name="Super Admin" context="Campaigns" />} title="All campaigns" description="Cross-client campaign operations." />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaign, client, ID…" className="sm:max-w-xs" />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', filter === f ? 'border-line-strong bg-surface-3 text-fg' : 'border-line text-fg-muted')}>
                  {f}
                </button>
              ))}
            </div>
            <Button variant="primary" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={() => setCreating(true)}>
              New campaign
            </Button>
          </div>
        </div>
        <BulkActionBar
          count={selection.count}
          noun="campaigns"
          onClear={selection.clear}
          onDelete={() => setConfirmBulk(true)}
          busy={bulkBusy}
        />
        {bulkNotice && <p aria-live="polite" className="text-xs text-fg-secondary">{bulkNotice}</p>}
        {loading ? (
          <LoadingState rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <Reveal>
            <CampaignTable campaigns={filtered} zone="admin" selection={selection} />
          </Reveal>
        )}
        <p className="text-xs text-fg-muted">
          <Link to="/admin/approvals" className="text-accent">Open approval queue →</Link>
        </p>

        <Modal
          open={creating}
          onClose={() => !saving && setCreating(false)}
          title="New campaign"
          description="Create an offer campaign — attach it to a client and define the offer."
          size="sm"
        >
          <form
            className="space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <div>
              <span className="text-xs text-fg-muted">Client *</span>
              <select className={inputClass} autoFocus value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}>
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-2xs text-fg-muted">The campaign is attached to this client.</p>
            </div>
            <div>
              <span className="text-xs text-fg-muted">Campaign name *</span>
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Arch Sites" />
            </div>
            <div>
              <span className="text-xs text-fg-muted">Offer</span>
              <input className={inputClass} value={form.offerName} onChange={(e) => setForm((f) => ({ ...f, offerName: e.target.value }))} placeholder="The offer the campaign sells, e.g. Website redesign" />
            </div>
            <div>
              <span className="text-xs text-fg-muted">Category</span>
              <input className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Architecture" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" disabled={saving} onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={saving || !form.name.trim() || !form.clientId}>
                {saving ? 'Creating…' : 'Create campaign'}
              </Button>
            </div>
          </form>
        </Modal>
        <ConfirmDialog
          open={confirmBulk}
          onClose={() => setConfirmBulk(false)}
          title={`Delete ${selection.count} selected campaign${selection.count === 1 ? '' : 's'}?`}
          body={`This permanently deletes ${selection.count} campaign${selection.count === 1 ? '' : 's'} and their associated agents, leads and recordings. This cannot be undone.`}
          busy={bulkBusy}
          onConfirm={runBulkDelete}
        />
      </PageContainer>
    </PageTransition>
  )
}
