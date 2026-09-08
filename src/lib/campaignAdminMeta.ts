import type { AdminCampaignMeta, AdminWorkflowStatus } from '@/types/admin'
import type { CampaignStage, CampaignStatus, OfferCampaign } from '@/types'

const WORKFLOW_STATUS: Record<AdminWorkflowStatus, CampaignStatus> = {
  submitted: 'awaiting_approval',
  awaiting_approval: 'awaiting_approval',
  compliance_review: 'legal_review',
  changes_requested: 'preparing',
  training: 'awaiting_approval',
  approved: 'active',
  launching: 'active',
  live: 'active',
  rejected: 'rejected',
}

const WORKFLOW_STAGE: Record<AdminWorkflowStatus, CampaignStage> = {
  submitted: 'onboarding',
  awaiting_approval: 'legal_review',
  compliance_review: 'legal_review',
  changes_requested: 'onboarding',
  training: 'legal_review',
  approved: 'approved',
  launching: 'approved',
  live: 'calling',
  rejected: 'onboarding',
}

export const REVIEWABLE_WORKFLOW_STATUSES: AdminWorkflowStatus[] = [
  'awaiting_approval',
  'submitted',
  'compliance_review',
  'changes_requested',
]

export function mergeCampaignWithMeta(campaign: OfferCampaign, meta: AdminCampaignMeta): OfferCampaign {
  const status = WORKFLOW_STATUS[meta.workflowStatus] ?? campaign.status
  const stage = WORKFLOW_STAGE[meta.workflowStatus] ?? campaign.stage
  return {
    ...campaign,
    status,
    stage,
    progress: meta.aiReadiness ?? campaign.progress,
  }
}

export function canReviewCampaign(meta: AdminCampaignMeta | undefined): boolean {
  if (!meta) return false
  return !['approved', 'rejected', 'live', 'launching'].includes(meta.workflowStatus)
}
