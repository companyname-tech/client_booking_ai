import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { AITrainingPanel, AISimulation } from '@/components/admin/AITrainingPanel'
import { Reveal } from '@/components/motion/Reveal'
import { CampaignStatus } from '@/components/campaigns/CampaignStatus'

export default function AdminAITraining() {
  const training = repo.getTrainingCampaigns()
  const campaigns = repo.getCampaigns()

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader eyebrow={<WorkspaceEyebrow name="Super Admin" context="AI Training" />} title="AI training workspace" description="Train and simulate AI agents for submitted campaigns." />
        <div className="grid gap-4 lg:grid-cols-2">
          {training.map(({ campaignId, status }) => {
            const c = campaigns.find((x) => x.id === campaignId)
            if (!c) return null
            return (
              <Reveal key={campaignId}>
                <div className="surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/admin/campaigns/${campaignId}/review`} className="font-medium text-fg hover:text-accent">{c.name}</Link>
                      <div className="mt-1 text-xs capitalize text-fg-muted">{status.replace('_', ' ')}</div>
                    </div>
                    <CampaignStatus status={c.status} size="sm" />
                  </div>
                  <div className="mt-4">
                    <AITrainingPanel onComplete={(score) => repo.completeCampaignTraining(campaignId, score)} />
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
        <Reveal>
          <AISimulation />
        </Reveal>
      </PageContainer>
    </PageTransition>
  )
}
