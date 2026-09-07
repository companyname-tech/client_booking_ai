import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { PronunciationLexicon } from '@/components/admin/PronunciationLexicon'
import { Reveal } from '@/components/motion/Reveal'
import { CampaignStatus } from '@/components/campaigns/CampaignStatus'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

export default function AdminAITraining() {
  const { data, loading, error, reload } = useAsyncData(() =>
    Promise.all([repo.getTrainingCampaigns(), repo.getCampaigns()]),
  )
  const training = data?.[0] ?? []
  const campaigns = data?.[1] ?? []

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader eyebrow={<WorkspaceEyebrow name="Super Admin" context="AI Training" />} title="AI training workspace" description="Review AI training status for submitted campaigns." />
        <Reveal>
          <PronunciationLexicon />
        </Reveal>
        {loading ? (
          <LoadingState rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : training.length === 0 ? (
          <EmptyState title="No campaigns in training" description="Submitted campaigns awaiting AI training will appear here." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {training.map(({ offerCampaignId, status }) => {
              const c = campaigns.find((x) => x.id === offerCampaignId)
              if (!c) return null
              return (
                <Reveal key={offerCampaignId}>
                  <div className="surface p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={`/admin/campaigns/${offerCampaignId}/review`} className="font-medium text-fg hover:text-accent">{c.name}</Link>
                        <div className="mt-1 text-xs capitalize text-fg-muted">{status.replace('_', ' ')}</div>
                      </div>
                      <CampaignStatus status={c.status} size="sm" />
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        )}
      </PageContainer>
    </PageTransition>
  )
}
