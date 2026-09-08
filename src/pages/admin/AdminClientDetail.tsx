import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/motion/Reveal'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ClientFormModal } from '@/components/admin/ClientFormModal'
import { ClientMeetingsCalendar } from '@/components/calendar/ClientMeetingsCalendar'
import { NewCampaignModal } from '@/components/admin/NewCampaignModal'
import { EditCampaignModal } from '@/components/admin/EditCampaignModal'
import type { OfferCampaign } from '@/types'

export default function AdminClientDetail() {
  const { id } = useParams()
  const [editing, setEditing] = useState(false)
  const [creating, setCreating] = useState(false)
  const { data, loading, error, reload } = useAsyncData(
    async () => (id ? repo.getClient(id) : undefined),
    [id],
  )

  const campaigns = data?.campaigns ?? []
  const selection = useBulkSelection(campaigns.map((c) => c.id))
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkNotice, setBulkNotice] = useState('')
  const [editingCampaign, setEditingCampaign] = useState<OfferCampaign | null>(null)

  const runBulkDelete = async () => {
    const ids = campaigns.filter((c) => selection.selected.has(c.id)).map((c) => c.id)
    if (ids.length === 0) return
    setBulkBusy(true)
    setBulkNotice('')
    try {
      const res = await repo.bulkDeleteCampaigns(ids)
      setBulkNotice(
        res.failed ? `Deleted ${res.affected}, ${res.failed} failed` : `Deleted ${res.affected} campaign${res.affected === 1 ? '' : 's'}`,
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

  const openEdit = () => {
    const target = campaigns.find((c) => selection.selected.has(c.id))
    if (target) setEditingCampaign(target)
  }

  if (loading) {
    return (
      <PageTransition>
        <PageContainer><LoadingState rows={5} /></PageContainer>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <PageContainer><ErrorState message={error} onRetry={reload} /></PageContainer>
      </PageTransition>
    )
  }

  const client = data?.client

  if (!client) {
    return (
      <PageTransition>
        <PageContainer><EmptyState title="Client not found" /></PageContainer>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Client" />}
          title={
            <span className="flex items-center gap-3">
              <Avatar name={client.name} size="lg" className="rounded-md" />
              {client.name}
            </span>
          }
          description={`${client.industry || 'No industry'} · ${client.plan} plan`}
          actions={
            <>
              <Button variant="primary" leadingIcon={<Plus />} onClick={() => setCreating(true)}>
                New campaign
              </Button>
              <Button variant="secondary" leadingIcon={<Pencil />} onClick={() => setEditing(true)}>
                Edit
              </Button>
            </>
          }
        />
        {client.primaryContact && (client.primaryContact.name || client.primaryContact.email) && (
          <Reveal>
            <div className="surface p-4 text-sm text-fg-secondary">
              <span className="text-fg-muted">Primary contact:</span>{' '}
              {client.primaryContact.name || '—'}
              {client.primaryContact.email ? ` · ${client.primaryContact.email}` : ''}
              {client.primaryContact.role ? ` · ${client.primaryContact.role}` : ''}
            </div>
          </Reveal>
        )}
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface p-4"><div className="text-2xs text-fg-muted">Campaigns</div><div className="text-2xl font-semibold tabular">{campaigns.length}</div></div>
            <div className="surface p-4"><div className="text-2xs text-fg-muted">Active</div><div className="text-2xl font-semibold tabular">{campaigns.filter((c) => c.status === 'active').length}</div></div>
            <div className="surface p-4"><div className="text-2xs text-fg-muted">Bookings</div><div className="text-2xl font-semibold tabular">{campaigns.reduce((s, c) => s + c.metrics.bookings, 0)}</div></div>
          </div>
        </Reveal>
        <Reveal>
          <h2 className="mb-3 text-sm font-semibold text-fg">Campaigns</h2>
          {campaigns.length ? (
            <div className="space-y-3">
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
              <CampaignTable campaigns={campaigns} zone="admin" selection={selection} />
            </div>
          ) : (
            <EmptyState
              title="No campaigns yet"
              description="Campaigns linked to this client will appear here."
              action={
                <Button variant="primary" leadingIcon={<Plus />} onClick={() => setCreating(true)}>
                  New campaign
                </Button>
              }
            />
          )}
        </Reveal>

        <Reveal>
          <ClientMeetingsCalendar clientId={client.id} />
        </Reveal>

        <Link to="/admin/clients" className="text-xs text-accent">← All clients</Link>
      </PageContainer>
      <ClientFormModal
        open={editing}
        client={client}
        onClose={() => setEditing(false)}
        onSaved={reload}
      />
      <NewCampaignModal
        open={creating}
        fixedClient={{ id: client.id, name: client.name }}
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
    </PageTransition>
  )
}
