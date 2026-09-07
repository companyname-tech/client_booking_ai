import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/Card'
import { StatusDot } from '@/components/ui/StatusDot'
import { MetricGrid } from '@/components/metrics/MetricGrid'
import { CampaignHealth } from '@/components/campaigns/CampaignHealth'
import { CampaignProgressPanel } from '@/components/campaigns/CampaignProgressPanel'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { AIActivityFeed } from '@/components/activity/AIActivityFeed'
import { AttentionList } from '@/components/activity/AttentionList'

function greeting(date: Date) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function ClientOverview() {
  const navigate = useNavigate()

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        repo.getCurrentClient(),
        repo.getCurrentUser(),
        repo.getAnalytics(),
        repo.getCampaignHealth(),
        repo.getFeaturedCampaign(),
        repo.getAgents(),
        repo.getActivity(6),
        repo.getAttentionItems(),
        repo.getCampaigns(),
      ]),
    [],
  )

  if (loading) {
    return (
      <PageTransition>
        <PageContainer>
          <LoadingState rows={6} />
        </PageContainer>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <PageContainer>
          <ErrorState message={error} onRetry={reload} />
        </PageContainer>
      </PageTransition>
    )
  }

  if (!data) return null

  const [client, user, analytics, health, featured, agents, activity, attention, allCampaigns] = data
  const agent = featured.agentId ? agents.find((a) => a.id === featured.agentId) : undefined
  const campaigns = allCampaigns.filter((c) => c.status !== 'completed')
  const firstName = user.name.split(' ')[0]

  return (
    <PageTransition>
      <PageContainer className="space-y-6 lg:space-y-8">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name={client.name} context="Client Workspace" />}
          title={
            <>
              {greeting(new Date())}, {firstName}.
            </>
          }
          description={
            <span className="inline-flex items-center gap-2">
              <StatusDot tone="success" live size={7} />
              Your AI booking campaigns are operating normally.
            </span>
          }
          actions={
            <Button variant="primary" size="lg" leadingIcon={<Plus />} onClick={() => navigate('/client/campaigns/new')}>
              Create campaign
            </Button>
          }
        />

        <CampaignHealth health={health} />

        <MetricGrid analytics={analytics} />

        <div className="grid gap-6 xl:grid-cols-3 xl:gap-8">
          {featured && <CampaignProgressPanel campaign={featured} agent={agent} className="xl:col-span-2" />}
          <AIActivityFeed items={activity} />
        </div>

        <Stagger as="section" aria-labelledby="campaigns-title" className="space-y-3">
          <Reveal>
            <SectionHeader
              title={<span id="campaigns-title">Active campaigns</span>}
              description={`${campaigns.length} campaigns in flight`}
              action={
                <Link to="/client/campaigns" className="interactive text-xs font-medium text-fg-muted hover:text-fg-secondary">
                  View all →
                </Link>
              }
            />
          </Reveal>
          <Reveal>
            <CampaignTable campaigns={campaigns} />
          </Reveal>
        </Stagger>

        <AttentionList items={attention} />
      </PageContainer>
    </PageTransition>
  )
}
