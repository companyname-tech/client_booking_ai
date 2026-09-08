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
  campaign: Pick<OfferCampaign, 'status' | 'stage' | 'source' | 'budget'>,
  userOverride?: CampaignStatus | null,
): CampaignStatus {
  if (isBudgetStopped(campaign)) return 'paused'
  return userOverride ?? campaign.status
}
