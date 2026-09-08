import type { Budget, CampaignStatus, OfferCampaign } from '@/types'

const TRAINING_STATUSES = new Set<CampaignStatus>(['ai_training', 'awaiting_ai_training'])

/** Campaigns in AI training can run without a paid budget. */
export function isTrainingCampaign(campaign: Pick<OfferCampaign, 'status' | 'stage' | 'source'>): boolean {
  if (TRAINING_STATUSES.has(campaign.status)) return true
  if (campaign.stage === 'ai_training') return true
  return campaign.source === 'training'
}

/** Whether the campaign has any configured spend (total or daily). */
export function hasRunnableBudget(budget: Budget): boolean {
  return budget.total > 0 || budget.daily > 0
}

/** Non-training campaigns with no budget must stay paused. */
export function isBudgetStopped(campaign: Pick<OfferCampaign, 'status' | 'stage' | 'source' | 'budget'>): boolean {
  return !isTrainingCampaign(campaign) && !hasRunnableBudget(campaign.budget)
}

/** Apply the budget stop rule on top of the stored lifecycle status. */
export function resolveOperationalStatus(
  campaign: Pick<OfferCampaign, 'status' | 'stage' | 'source' | 'budget' | 'userPaused'>,
  userOverride?: CampaignStatus | null,
): CampaignStatus {
  // A stored user pause (persisted via PUT /offers/{id} {user_paused:true}) is
  // an override that survives refresh: it wins over the lifecycle status AND
  // over the budget-stop rule (a paused campaign with a configured budget must
  // still read as paused). Resuming clears the flag and lets the budget-stop
  // rule force paused again when there is no runnable budget.
  if (campaign.userPaused) return 'paused'
  if (isBudgetStopped(campaign)) return 'paused'
  const base = userOverride ?? campaign.status
  if (base === 'awaiting_agent_assignment') return campaign.status
  return base
}

/** UI status — campaigns without an agent block on "Awaiting agent assignment". */
export function resolveCampaignDisplayStatus(
  campaign: Pick<OfferCampaign, 'status' | 'stage' | 'source' | 'budget' | 'agentId'>,
  userOverride?: CampaignStatus | null,
): CampaignStatus {
  if (!campaign.agentId) return 'awaiting_agent_assignment'
  return resolveOperationalStatus(campaign, userOverride)
}
