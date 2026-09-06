import { Link } from 'react-router-dom'
import { ArrowUpRight, Bot } from 'lucide-react'
import type { Agent, Campaign } from '@/types'
import { CAMPAIGN_STAGES } from '@/types'
import { campaignStageMeta } from '@/lib/status'
import { cn, formatRelativeTime } from '@/lib/utils'
import { NOW } from '@/data/time'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CampaignStatus } from './CampaignStatus'
import { ProgressTimeline } from './ProgressTimeline'

export interface CampaignProgressPanelProps {
  campaign: Campaign
  agent?: Agent
  zone?: 'client' | 'admin'
  className?: string
}

/**
 * Large lifecycle visual for a single (featured) campaign. Wraps
 * ProgressTimeline with context: current state, agent, next step.
 */
export function CampaignProgressPanel({ campaign, agent, zone = 'client', className }: CampaignProgressPanelProps) {
  const stageIndex = CAMPAIGN_STAGES.indexOf(campaign.stage)
  const next = CAMPAIGN_STAGES[stageIndex + 1]
  const stageMeta = campaignStageMeta[campaign.stage]
  // Training progress comes from the agent when in AI training, otherwise
  // approximate from overall campaign progress.
  const stageProgress = campaign.stage === 'ai_training' && agent ? agent.trainingProgress : (campaign.progress % 17) * 5

  return (
    <Stagger
      as="section"
      aria-labelledby="progress-title"
      className={cn('surface-raised relative flex min-w-0 flex-col overflow-hidden p-5 sm:p-6', className)}
    >
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_100%,black,transparent)]" />

      <Reveal className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="label-caps">Campaign progress</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <h2 id="progress-title" className="text-lg font-semibold tracking-tight text-fg">
              {campaign.name}
            </h2>
            <CampaignStatus status={campaign.status} />
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            {campaign.targetAudience} · {campaign.geography}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <div>
            <div className="label-caps">Current state</div>
            <div className="mt-1 text-sm font-semibold text-violet">{stageMeta.label}</div>
            <div className="mt-0.5 hidden max-w-[180px] text-2xs leading-snug text-fg-muted lg:block">{stageMeta.description}</div>
          </div>
          {agent && (
            <div className="hidden sm:block">
              <div className="label-caps">Agent</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-fg">
                <Bot className="size-3.5 text-fg-muted" />
                {agent.name}
              </div>
            </div>
          )}
          <div>
            <div className="label-caps">Overall</div>
            <div className="mt-1 text-sm font-semibold tabular text-fg">{campaign.progress}%</div>
          </div>
        </div>
      </Reveal>

      <Reveal className="relative my-auto min-w-0 py-7 sm:py-8">
        <ProgressTimeline current={campaign.stage} stageProgress={stageProgress} compact />
      </Reveal>

      <Reveal className="relative flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <ProgressBar value={stageProgress} tone="violet" size="xs" className="w-24 shrink-0" label={`${stageMeta.label} progress`} />
          <span className="truncate text-xs text-fg-muted">
            <span className="tabular text-fg-secondary">{Math.round(stageProgress)}%</span> through {stageMeta.label.toLowerCase()}
            {next && (
              <>
                {' '}· next <span className="text-fg-secondary">{campaignStageMeta[next].label}</span>
              </>
            )}
            {' '}· updated {formatRelativeTime(campaign.lastActivityAt, NOW)}
          </span>
        </div>
        <Link
          to={`/${zone}/campaigns/${campaign.id}`}
          className="interactive ring-focus inline-flex items-center gap-1 self-start rounded-sm text-xs font-medium text-accent outline-none hover:text-fg sm:self-auto"
        >
          Open campaign <ArrowUpRight className="size-3.5" />
        </Link>
      </Reveal>
    </Stagger>
  )
}
