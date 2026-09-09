import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { CampaignStatus } from '@/types'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { EmptyState } from '@/components/ui/EmptyState'

type Filter = 'all' | 'active' | 'setup' | 'paused' | 'completed'

const filterMatch: Record<Filter, (s: CampaignStatus) => boolean> = {
  all: () => true,
  active: (s) => s === 'active',
  setup: (s) => ['draft', 'preparing', 'legal_review', 'awaiting_approval'].includes(s),
  paused: (s) => s === 'paused',
  completed: (s) => s === 'completed',
}

export default function ClientCampaigns() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')

  const { data, loading, error, reload } = useAsyncData(
    () => Promise.all([repo.getCurrentClient(), repo.getCampaigns()]),
    [],
  )
  const client = data?.[0]
  const all = data?.[1] ?? []

  const counts = useMemo(
    () =>
      (Object.keys(filterMatch) as Filter[]).reduce(
        (acc, f) => ({ ...acc, [f]: all.filter((c) => filterMatch[f](c.status)).length }),
        {} as Record<Filter, number>,
      ),
    [all],
  )
  const campaigns = useMemo(() => all.filter((c) => filterMatch[filter](c.status)), [all, filter])

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

  if (!client) return null

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name={client.name} context="Client Workspace" />}
          title="Campaigns"
          description="Every offer your AI agents are working, from onboarding through optimization."
          actions={
            <Button variant="primary" leadingIcon={<Plus />} onClick={() => navigate('/client/campaigns/new')}>
              Create campaign
            </Button>
          }
        >
          <Tabs<Filter>
            aria-label="Filter campaigns"
            value={filter}
            onChange={setFilter}
            items={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'active', label: 'Active', count: counts.active },
              { id: 'setup', label: 'In setup', count: counts.setup },
              { id: 'paused', label: 'Paused', count: counts.paused },
              { id: 'completed', label: 'Completed', count: counts.completed },
            ]}
          />
        </PageHeader>

        <Reveal key={filter} initial="hidden" animate="show">
          {campaigns.length ? (
            <CampaignTable campaigns={campaigns} />
          ) : (
            <div className="surface">
              <EmptyState title="No campaigns here" description="Try another filter or create a new campaign." />
            </div>
          )}
        </Reveal>
      </PageContainer>
    </PageTransition>
  )
}
