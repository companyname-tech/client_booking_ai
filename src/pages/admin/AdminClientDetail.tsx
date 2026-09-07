import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/motion/Reveal'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ClientFormModal } from '@/components/admin/ClientFormModal'

export default function AdminClientDetail() {
  const { id } = useParams()
  const [editing, setEditing] = useState(false)
  const { data, loading, error, reload } = useAsyncData(
    async () => (id ? repo.getClient(id) : undefined),
    [id],
  )

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
  const campaigns = data?.campaigns ?? []

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
          actions={<Button variant="secondary" leadingIcon={<Pencil />} onClick={() => setEditing(true)}>Edit</Button>}
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
            <CampaignTable campaigns={campaigns} zone="admin" />
          ) : (
            <EmptyState title="No campaigns yet" description="Campaigns linked to this client will appear here." />
          )}
        </Reveal>
        <Link to="/admin/clients" className="text-xs text-accent">← All clients</Link>
      </PageContainer>
      <ClientFormModal
        open={editing}
        client={client}
        onClose={() => setEditing(false)}
        onSaved={reload}
      />
    </PageTransition>
  )
}
