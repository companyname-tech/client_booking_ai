import { useState } from 'react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { Card, SectionHeader } from '@/components/ui/Card'
import { CampaignStatus } from '@/components/campaigns/CampaignStatus'
import { AIActivityFeed } from '@/components/activity/AIActivityFeed'
import { CampaignHealthPanel } from '@/components/campaign/CampaignHealthPanel'
import { CampaignMetricsGrid } from '@/components/campaign/CampaignMetricsGrid'
import { CampaignPerformanceChart, PerformancePeriodToggle } from '@/components/campaign/CampaignPerformanceChart'
import { CampaignFunnel } from '@/components/campaign/CampaignFunnel'
import { AIAgentStatus } from '@/components/campaign/AIAgentStatus'
import { NeedsAttention } from '@/components/campaign/NeedsAttention'
import { CampaignInsights } from '@/components/campaign/CampaignInsights'
import { CampaignLifecycle } from '@/components/campaign/CampaignLifecycle'
import { useCampaignContext } from './campaignContext'

export default function CampaignDetailOverview() {
  const { campaign, zone, effectiveStatus } = useCampaignContext()
  const awaitingApproval = effectiveStatus === 'awaiting_approval'
  const [period, setPeriod] = useState<7 | 14 | 30>(14)

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        repo.getAgents(),
        repo.getActivity(12),
        repo.getCampaignHealthSnapshot(campaign.id),
        repo.getCampaignFunnel(campaign.id),
        repo.getCampaignInsights(campaign.id),
        repo.getCampaignAlerts(campaign.id),
      ]),
    [campaign.id],
  )

  const { data: performance } = useAsyncData(
    () => repo.getCampaignPerformance(campaign.id, period),
    [campaign.id, period],
  )

  if (loading) return <LoadingState rows={8} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null

  const [agents, activityRaw, health, funnel, insights, alerts] = data
  const agent = campaign.agentId ? agents.find((a) => a.id === campaign.agentId) : undefined
  const activity = activityRaw.filter((a) => !a.offerCampaignId || a.offerCampaignId === campaign.id)
  const stageProgress = campaign.stage === 'ai_training' && agent ? agent.trainingProgress : (campaign.progress % 17) * 5
  const isOperational = ['active', 'paused', 'completed'].includes(effectiveStatus) || campaign.metrics.leadsFound > 100
  const basePath = `/${zone}/campaigns/${campaign.id}`

  return (
    <Stagger className="space-y-6" stagger={0.05}>
      {awaitingApproval && (
        <Reveal>
          <Card raised className="border-warning/20 bg-warning-soft/10 p-5 sm:p-6">
            <CampaignStatus status="awaiting_approval" size="md" />
            <h2 className="mt-3 text-lg font-semibold text-fg">Your campaign is under review</h2>
            <p className="mt-1 max-w-xl text-sm text-fg-secondary">
              Our team is reviewing your submission and preparing your AI agent. You&apos;ll be notified when it&apos;s approved.
            </p>
          </Card>
        </Reveal>
      )}

      {isOperational && !awaitingApproval && (
        <Reveal>
          <CampaignHealthPanel health={health} />
        </Reveal>
      )}

      <Reveal>
        <CampaignLifecycle campaign={{ ...campaign, status: effectiveStatus }} stageProgress={stageProgress} />
      </Reveal>

      {isOperational && !awaitingApproval ? (
        <>
          <Reveal>
            <CampaignMetricsGrid metrics={campaign.metrics} budget={campaign.budget} />
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-3">
            <Reveal className="lg:col-span-2">
              <Card className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <SectionHeader title="OfferCampaign performance" description="Leads, calls, and bookings over time" />
                  <PerformancePeriodToggle value={period} onChange={setPeriod} />
                </div>
                <CampaignPerformanceChart data={performance ?? []} className="mt-6" />
              </Card>
            </Reveal>
            <Reveal>
              {agent ? <AIAgentStatus agent={agent} /> : null}
            </Reveal>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <Card className="p-5 sm:p-6">
                <SectionHeader title="OfferCampaign funnel" description="Conversion through each stage" />
                <div className="mt-6">
                  <CampaignFunnel stages={funnel} />
                </div>
              </Card>
            </Reveal>
            <Reveal>
              <AIActivityFeed items={activity} className="h-full" />
            </Reveal>
          </div>

          <Reveal>
            <NeedsAttention alerts={alerts} basePath={basePath} />
          </Reveal>

          <Reveal>
            <CampaignInsights insights={insights} />
          </Reveal>
        </>
      ) : !awaitingApproval ? (
        <Reveal>
          <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-medium text-fg">Metrics available after launch</p>
            <p className="mt-1 max-w-sm text-xs text-fg-muted">
              Performance data will appear here once your campaign is active.
            </p>
          </Card>
        </Reveal>
      ) : (
        <Reveal>
          <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-medium text-fg">Metrics available after launch</p>
            <p className="mt-1 max-w-sm text-xs text-fg-muted">
              Performance data will appear here once your campaign is approved.
            </p>
          </Card>
        </Reveal>
      )}

    </Stagger>
  )
}
