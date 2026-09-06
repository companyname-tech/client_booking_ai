import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { repo } from '@/data/repository'
import { formatNumber } from '@/lib/utils'
import { PageTransition } from '@/components/motion/PageTransition'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/Card'
import { PriorityQueue } from '@/components/admin/PriorityQueue'
import { CampaignTable } from '@/components/campaigns/CampaignTable'

export default function AdminOverview() {
  const user = repo.getSuperAdminUser()
  const campaigns = repo.getCampaigns()
  const clients = repo.getClients()
  const metas = repo.getAllAdminMeta()
  const pending = metas.filter((m) => ['awaiting_approval', 'submitted', 'compliance_review'].includes(m.workflowStatus)).length

  const metrics = [
    { label: 'Pending Review', value: pending, delta: '+2' },
    { label: 'Active Campaigns', value: campaigns.filter((c) => c.status === 'active').length, delta: '+4' },
    { label: 'Campaigns Launching', value: metas.filter((m) => m.workflowStatus === 'launching').length, delta: '3' },
    { label: 'Clients', value: clients.length, delta: '+1' },
    { label: 'Leads Processing', value: 18492, delta: '+12%' },
    { label: 'Bookings Today', value: 126, delta: '+8' },
  ]

  return (
    <PageTransition>
      <PageContainer className="space-y-8">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Mission Control" />}
          title={`Good morning, ${user.name.split(' ')[0]}`}
          description="Here's what needs your attention."
          actions={
            <Link to="/admin/approvals">
              <Button variant="primary" trailingIcon={<ArrowRight />}>Review queue</Button>
            </Link>
          }
        />

        <Stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3 lg:grid-cols-6" stagger={0.04}>
          {metrics.map((m) => (
            <Reveal key={m.label} className="bg-surface-2 p-4 sm:p-5">
              <div className="text-xs text-fg-muted">{m.label}</div>
              <AnimatedNumber value={m.value} format={formatNumber} className="mt-2 text-2xl font-semibold tabular text-fg sm:text-3xl" />
              <div className="mt-1 text-2xs text-success">{m.delta} this week</div>
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
