import type { CampaignStatus } from '@/types'

export type ConversationStage = 'calling' | 'connecting' | 'qualifying' | 'objection' | 'booking' | 'follow_up' | 'completed'
export type ConversationIntent = 'high' | 'medium' | 'low'
export type FollowUpPriority = 'high' | 'medium' | 'low'
export type AICommandAvailability = 'pre_launch' | 'live' | 'paused' | 'completed'

export interface AIActivityEvent {
  id: string
  timestamp: string
  offerCampaignId: string
  campaignName: string
  leadId?: string
  leadName?: string
  event: string
  status: 'success' | 'info' | 'warning' | 'neutral'
}

export interface AIConversationSummary {
  id: string
  leadId: string
  leadName: string
  company: string
  offerCampaignId: string
  campaignName: string
  agentId: string
  callId?: string
  stage: ConversationStage
  intent: ConversationIntent
  confidence: number
  durationSec: number
  outcome?: string
  isActive: boolean
  needsReview?: boolean
  startedAt: string
  keywords?: string[]
}

export interface AIMessage {
  speaker: 'ai' | 'prospect'
  text: string
  timestamp: string
  marker?: { type: string; detail: string }
}

export interface AIDecisionMoment {
  id: string
  messageIndex: number
  intent: string
  confidence: number
  qualification: string
  objection?: string
  responseStrategy?: string
  nextAction: string
  explanation: string
}

export interface AIConversationDetail extends AIConversationSummary {
  transcript: AIMessage[]
  decisions: AIDecisionMoment[]
  summary: string
  leadProfile: {
    name: string
    role: string
    company: string
    industry: string
    companySize: string
    location: string
    campaign: string
    leadScore: number
    previousInteractions: number
    bookingStatus: string
    isDecisionMaker: boolean
    painPoint?: string
    currentSolution?: string
    interest: string
  }
  timeline: { id: string; label: string; timestamp: string }[]
  confidenceBreakdown: { label: string; value: number }[]
  outcomeDetails: {
    outcome: string
    confidence: number
    classification: string
    nextAction: string
  }
  recordingDurationSec: number
  keyMoments: { offsetSec: number; label: string }[]
}

export interface AIObjection {
  id: string
  label: string
  occurrences: number
  resolutionRate: number
  bookingRate: number
  trend: number
  strategy?: string
}

export interface AILearningPattern {
  id: string
  pattern: string
  confidence: number
  observed: number
  impact: 'High' | 'Medium' | 'Low'
}

export interface AIImprovement {
  id: string
  date: string
  title: string
  impact: string
}

export interface AIFollowUp {
  id: string
  leadId: string
  leadName: string
  company: string
  offerCampaignId: string
  note: string
  scheduledFor: string
  recommendation: string
  priority: FollowUpPriority
  status: 'scheduled' | 'waiting' | 'overdue'
}

export interface AIEscalation {
  id: string
  leadName: string
  company: string
  campaignName: string
  reason: string
  conversationId?: string
}

export interface AIBookingConversation {
  id: string
  leadName: string
  company: string
  campaignName: string
  durationSec: number
  bookingTime: string
  channel: string
  meetingType: string
  status: string
  conversationId: string
}

export interface AIInsight {
  id: string
  title: string
  evidence: string
  impact: 'High' | 'Medium' | 'Low'
  action: string
  category: string
}

export interface AIHealthSnapshot {
  status: 'healthy' | 'attention' | 'degraded'
  components: { label: string; status: string; tone: 'success' | 'warning' | 'info' | 'neutral' }[]
}

export interface AICommandOverview {
  availability: AICommandAvailability
  agentId: string
  agentName: string
  agentRole: string
  status: 'active' | 'paused' | 'training' | 'idle'
  activeCampaigns: number
  callsToday: number
  conversations: number
  bookings: number
  followUps: number
  successRate: number
  activeConversations: number
  bookingConversations: number
  qualificationConversations: number
  followUpConversations: number
  preparationStages?: { label: string; done: boolean }[]
}

export interface AIAgentProfile {
  id: string
  name: string
  role: string
  status: 'active' | 'paused' | 'training' | 'idle'
  language: string
  tone: string
  objective: string
  qualification: string
  booking: string
  meetingDuration: string
  fallback: string
  readiness: number
  readinessBreakdown: { label: string; value: number }[]
  activityToday: {
    calls: number
    conversations: number
    bookings: number
    followUps: number
    escalations: number
    deltas: Record<string, number>
  }
}

export interface AIPerformanceSnapshot {
  metrics: { label: string; value: number; delta: number }[]
  byCampaign: { offerCampaignId: string; campaignName: string; score: number }[]
}

export interface AICommandFilters {
  offerCampaignId?: string
  outcome?: string
  intent?: ConversationIntent
  search?: string
  tab?: string
}

export const PRE_LAUNCH_AI_STATUSES: CampaignStatus[] = [
  'draft',
  'preparing',
  'awaiting_ai_training',
  'ai_training',
  'legal_review',
  'awaiting_approval',
]
