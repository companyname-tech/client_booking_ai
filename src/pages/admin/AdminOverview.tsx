import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatNumber } from '@/lib/utils'
import { PageTransition } from '@/components/motion/PageTransition'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/Card'
import { PriorityQueue } from '@/components/admin/PriorityQueue'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'

export default function AdminOverview() {
  const { data, loading, error, reload } = useAsyncData(() =>
    Promise.all([
      repo.getSuperAdminUser(),
      repo.getCampaigns(),
      repo.getClients(),
      repo.getAllAdminMeta(),
      repo.getAdminOverview(),
    ]),
  )

  if (loading) {
    return (
      <PageTransition>
        <PageContainer><LoadingState rows={6} /></PageContainer>
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

  if (!data) return null

  const [user, campaigns, clients, metas, overview] = data
  const pending = metas.filter((m) => ['awaiting_approval', 'submitted', 'compliance_review'].includes(m.workflowStatus)).length

  const metrics = [
    { label: 'Pending Review', value: pending },
    { label: 'Active Campaigns', value: campaigns.filter((c) => c.status === 'active').length },
    { label: 'Campaigns Launching', value: metas.filter((m) => m.workflowStatus === 'launching').length },
    { label: 'Clients', value: clients.length },
    { label: 'Leads Processing', value: overview.leads ?? 0 },
    { label: 'Bookings Today', value: overview.meetings_booked ?? 0 },
  ]

  return (
    <PageTransition>
      <PageContainer className="space-y-8">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Mission Control" />}
          title={`Good morning, ${user.name.split(' ')[0]}`}
          description="Here's what needs your attention."
          actions={
            <Link to="/admin/campaigns">
              <Button variant="primary" trailingIcon={<ArrowRight />}>Review queue</Button>
            </Link>
          }
        />

        <Stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3 lg:grid-cols-6" stagger={0.04}>
          {metrics.map((m) => (
            <Reveal key={m.label} className="bg-surface-2 p-4 sm:p-5">
              <div className="text-xs text-fg-muted">{m.label}</div>
              <AnimatedNumber value={m.value} format={formatNumber} className="mt-2 text-2xl font-semibold tabular text-fg sm:text-3xl" />
            </Reveal>
          ))}
        </Stagger>

        <section>
          <SectionHeader title="Needs your attention" description="Campaigns requiring action" className="mb-4" />
          <PriorityQueue items={metas} clients={clients} campaigns={campaigns} />
        </section>

        <section>
          <SectionHeader title="All campaigns" description="Cross-client operations" className="mb-4" />
          <CampaignTable campaigns={campaigns.slice(0, 8)} zone="admin" />
          <Link to="/admin/campaigns" className="mt-3 inline-block text-xs font-medium text-accent">View all campaigns →</Link>
        </section>
      </PageContainer>
    </PageTransition>
  )
}
