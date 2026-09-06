import { Link, useParams } from 'react-router-dom'
import { repo } from '@/data/repository'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/motion/Reveal'

export default function AdminClientDetail() {
  const { id } = useParams()
  const client = id ? repo.getClient(id) : undefined
  const campaigns = repo.getCampaigns(client?.id)

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
          description={`${client.industry} · ${client.plan} plan`}
        />
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface p-4"><div className="text-2xs text-fg-muted">Campaigns</div><div className="text-2xl font-semibold tabular">{campaigns.length}</div></div>
            <div className="surface p-4"><div className="text-2xs text-fg-muted">Active</div><div className="text-2xl font-semibold tabular">{campaigns.filter((c) => c.status === 'active').length}</div></div>
            <div className="surface p-4"><div className="text-2xs text-fg-muted">Bookings</div><div className="text-2xl font-semibold tabular">{campaigns.reduce((s, c) => s + c.metrics.bookings, 0)}</div></div>
          </div>
        </Reveal>
        <Reveal>
          <h2 className="mb-3 text-sm font-semibold text-fg">Campaigns</h2>
          <CampaignTable campaigns={campaigns} zone="admin" />
        </Reveal>
        <Link to="/admin/clients" className="text-xs text-accent">← All clients</Link>
      </PageContainer>
    </PageTransition>
  )
}
