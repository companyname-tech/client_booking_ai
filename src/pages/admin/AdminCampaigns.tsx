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
import { NewCampaignModal } from '@/components/admin/NewCampaignModal'
import { EditCampaignModal } from '@/components/admin/EditCampaignModal'
import { Button } from '@/components/ui/Button'
import type { OfferCampaign } from '@/types'

const FILTERS = ['All', 'Awaiting Review', 'Training', 'Live', 'Paused', 'Completed', 'Rejected'] as const

export default function AdminCampaigns() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('All')
  const [creating, setCreating] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<OfferCampaign | null>(null)
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

  const openEdit = () => {
    const target = filtered.find((c) => selection.selected.has(c.id))
    if (target) setEditingCampaign(target)
  }

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
          onEdit={openEdit}
          editDisabled={selection.count !== 1}
          editHint="Select one campaign to edit"
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

        <NewCampaignModal
          open={creating}
          clients={clients}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            void reload()
          }}
        />
        <EditCampaignModal
          open={!!editingCampaign}
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSaved={() => {
            setEditingCampaign(null)
            selection.clear()
            void reload()
          }}
        />
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
