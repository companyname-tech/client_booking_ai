import type { Lead, LeadStatus } from '@/types'

export type LeadIntent = 'very_high' | 'high' | 'medium' | 'low' | 'unknown'

export interface LeadHubMetrics {
  total: number
  qualified: number
  highIntent: number
  detailsRequested: number
  booked: number
  followUp: number
}

export interface LeadScoreBreakdown {
  overall: number
  companyFit: number
  decisionMaker: number
  offerRelevance: number
  engagement: number
  intent: number
  label: string
}

export interface LeadJourneyStage {
  id: string
  label: string
  timestamp?: string
  detail?: string
  completed: boolean
}

export interface LeadActivityItem {
  id: string
  type: 'discovered' | 'call' | 'conversation' | 'classification' | 'status' | 'details' | 'follow_up' | 'booking' | 'recording' | 'note'
  title: string
  description?: string
  timestamp: string
  group?: string
}

export interface LeadConversationRef {
  id: string
  date: string
  durationSec: number
  outcome: string
  intent: LeadIntent
}

export interface LeadCallRef {
  id: string
  date: string
  durationSec: number
  outcome: string
  confidence: number
  intent: LeadIntent
  hasRecording: boolean
}

export interface LeadRecordingRef {
  id: string
  date: string
  durationSec: number
  outcome: string
  summary: string
}

export interface LeadObjectionRef {
  label: string
  occurrences: number
  resolution: string
}

export interface LeadAIInsights {
  strongestSignal: string
  objections: string[]
  positiveSignals: string[]
  recommendedAction: string
}

export interface CompanyProfile {
  name: string
  industry: string
  employees: string
  location: string
  website: string
  companySizeRange: string
  companyFit: number
  fitBreakdown: { label: string; value: number }[]
}

export interface LeadEngagement {
  calls: number
  conversations: number
  followUps: number
  detailsRequests: number
  bookings: number
  firstContact?: string
  lastActivity?: string
  timeToBooking?: string
}

export interface LeadFollowUp {
  action: string
  scheduledFor?: string
  reason?: string
  priority?: 'high' | 'medium' | 'low'
}

export interface LeadBookingInfo {
  title: string
  datetime: string
  duration: string
  channel: string
  meetingType: string
  status: string
}

export interface LeadNote {
  id: string
  text: string
  createdAt: string
  updatedAt?: string
}

export interface LeadIntelligenceProfile {
  lead: Lead
  campaignName: string
  intent: LeadIntent
  intentLabel: string
  tags: string[]
  signals: string[]
  scoreBreakdown: LeadScoreBreakdown
  aiSummary: string
  summaryFields: {
    role: string
    companyFit: string
    painPoint?: string
    currentSolution?: string
    intent: string
    nextAction: string
  }
  journey: LeadJourneyStage[]
  activity: LeadActivityItem[]
  conversations: LeadConversationRef[]
  calls: LeadCallRef[]
  recordings: LeadRecordingRef[]
  objections: LeadObjectionRef[]
  intentTimeline: { label: string; value: number }[]
  engagement: LeadEngagement
  company: CompanyProfile
  contact: {
    email: string
    phone: string
  }
  followUp?: LeadFollowUp
  booking?: LeadBookingInfo
  nextBestAction: string
  conversationId?: string
  discoveredAt: string
  whyTargeted: string[]
}

export interface LeadSegment {
  id: string
  label: string
  count: number
  filter: Partial<LeadHubFilters>
}

export interface LeadHubFilters {
  search: string
  campaignId?: string
  status?: LeadStatus | 'all'
  intent?: LeadIntent | 'all'
  minScore?: number
  maxScore?: number
  industry?: string
  location?: string
  segment?: string
}

export interface LeadHubStats {
  statusDistribution: { status: string; count: number }[]
  qualityDistribution: { range: string; percent: number }[]
  sources: { campaignName: string; percent: number }[]
}

export interface EnrichedLead extends Lead {
  campaignName: string
  intent: LeadIntent
  intentLabel: string
  bookingStatus?: string
}
