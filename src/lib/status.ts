import type { AgentStatus, CampaignStage, CampaignStatus, IntegrationState, LeadStatus, Tone } from '@/types'

interface StatusMeta {
  label: string
  tone: Tone
  /** Show an animated live indicator. */
  live?: boolean
}

export const campaignStatusMeta: Record<CampaignStatus, StatusMeta> = {
  draft: { label: 'Draft', tone: 'neutral' },
  preparing: { label: 'Preparing', tone: 'neutral' },
  awaiting_ai_training: { label: 'Awaiting AI training', tone: 'warning' },
  ai_training: { label: 'AI Training', tone: 'violet', live: true },
  legal_review: { label: 'Legal review', tone: 'warning' },
  awaiting_approval: { label: 'Awaiting approval', tone: 'warning' },
  active: { label: 'Active', tone: 'success', live: true },
  paused: { label: 'Paused', tone: 'neutral' },
  completed: { label: 'Completed', tone: 'info' },
  rejected: { label: 'Rejected', tone: 'danger' },
  failed: { label: 'Failed', tone: 'danger' },
}

export const campaignStageMeta: Record<CampaignStage, { label: string; short: string; description: string }> = {
  onboarding: { label: 'Onboarding', short: 'Onboard', description: 'Targeting, offer and budget captured' },
  ai_training: { label: 'AI Training', short: 'Train', description: 'Agent learns the offer and objections' },
  legal_review: { label: 'Legal Review', short: 'Legal', description: 'Compliance and consent checks' },
  approved: { label: 'Approved', short: 'Approve', description: 'Cleared for outbound calling' },
  calling: { label: 'Calling', short: 'Call', description: 'AI is contacting and booking leads' },
  optimization: { label: 'Optimization', short: 'Optimize', description: 'Continuous tuning from outcomes' },
}

export const leadStatusMeta: Record<LeadStatus, StatusMeta> = {
  new: { label: 'New', tone: 'neutral' },
  queued: { label: 'Queued', tone: 'neutral' },
  contacted: { label: 'Contacted', tone: 'info' },
  interested: { label: 'Interested', tone: 'violet' },
  details_requested: { label: 'Details requested', tone: 'warning' },
  booked: { label: 'Booked', tone: 'success' },
  not_interested: { label: 'Not interested', tone: 'neutral' },
  no_response: { label: 'No response', tone: 'neutral' },
  do_not_contact: { label: 'Do not contact', tone: 'danger' },
  unreachable: { label: 'Unreachable', tone: 'danger' },
}

export const callOutcomeMeta: Record<import('@/types').CallOutcome, StatusMeta> = {
  booked: { label: 'Booked', tone: 'success' },
  interested: { label: 'Interested', tone: 'violet' },
  details_requested: { label: 'Details requested', tone: 'warning' },
  follow_up: { label: 'Follow up', tone: 'info' },
  not_interested: { label: 'Not interested', tone: 'neutral' },
  no_answer: { label: 'No answer', tone: 'neutral' },
  voicemail: { label: 'Voicemail', tone: 'neutral' },
  unknown: { label: 'Unknown', tone: 'neutral' },
  callback: { label: 'Callback', tone: 'info' },
  declined: { label: 'Declined', tone: 'neutral' },
}

export const callSentimentMeta: Record<import('@/types').CallSentiment, StatusMeta> = {
  positive: { label: 'Positive', tone: 'success' },
  neutral: { label: 'Neutral', tone: 'neutral' },
  negative: { label: 'Negative', tone: 'danger' },
  high_intent: { label: 'High intent', tone: 'violet' },
  low_intent: { label: 'Low intent', tone: 'neutral' },
}

/**
 * Raw `PostCallOutcome` → label, mirroring the old `leads_to_conversion_fe`
 * call-history screen (`call-history.js` / `CallHistoryScreen` OUTCOME_MAP)
 * plus the remaining enum members from `state.js` OUTCOME_LABEL.
 */
const callHistoryOutcomeLabels: Record<string, string> = {
  BOOKED: 'Booked',
  BOOKED_NO_EMAIL: 'Booked (no email)',
  NOT_INTERESTED: 'Not interested',
  NOT_ANSWERED: 'Not answered',
  CALLBACK_REQUESTED: 'Callback requested',
  WRONG_NUMBER: 'Wrong number',
  VOICEMAIL: 'Voicemail',
  DETAILS_EMAIL: 'Details (email)',
  DETAILS_WHATSAPP: 'Details (WhatsApp)',
  UNKNOWN: 'Unknown',
  ANSWERED: 'Answered',
  CALL_SCHEDULED: 'Scheduled Call',
  DO_NOT_CALL: 'Do Not Call',
}

const callHistoryOutcomeTones: Record<string, Tone> = {
  BOOKED: 'success',
  BOOKED_NO_EMAIL: 'warning',
  DETAILS_EMAIL: 'info',
  DETAILS_WHATSAPP: 'info',
  CALLBACK_REQUESTED: 'info',
  CALL_SCHEDULED: 'info',
  ANSWERED: 'violet',
  NOT_INTERESTED: 'neutral',
  DO_NOT_CALL: 'danger',
  NOT_ANSWERED: 'neutral',
  VOICEMAIL: 'neutral',
  WRONG_NUMBER: 'danger',
  UNKNOWN: 'neutral',
}

export function callHistoryOutcomeLabel(outcome: string | undefined): string {
  if (!outcome) return '—'
  return callHistoryOutcomeLabels[outcome] ?? outcome
}

export function callHistoryOutcomeTone(outcome: string | undefined): Tone {
  if (!outcome) return 'neutral'
  return callHistoryOutcomeTones[outcome] ?? 'neutral'
}

export const agentStatusMeta: Record<AgentStatus, StatusMeta> = {
  training: { label: 'Training', tone: 'violet', live: true },
  ready: { label: 'Ready', tone: 'info' },
  calling: { label: 'Calling', tone: 'success', live: true },
  idle: { label: 'Idle', tone: 'neutral' },
  error: { label: 'Error', tone: 'danger' },
}

export const integrationStateMeta: Record<IntegrationState, StatusMeta> = {
  connected: { label: 'Connected', tone: 'success' },
  disconnected: { label: 'Not connected', tone: 'neutral' },
  error: { label: 'Needs attention', tone: 'danger' },
  pending: { label: 'Pending', tone: 'warning' },
}
