/**
 * Domain types shared across the app. The API adapter returns these shapes.
 */

export type ID = string

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'violet'

// ---------------------------------------------------------------------------
// Client / workspace
// ---------------------------------------------------------------------------

export interface User {
  id: ID
  name: string
  email: string
  avatarUrl?: string
  role: 'owner' | 'admin' | 'member' | 'super_admin'
}

export interface Client {
  id: ID
  name: string
  slug: string
  industry: string
  plan: 'starter' | 'growth' | 'enterprise'
  createdAt: string
  primaryContact: User
}

// ---------------------------------------------------------------------------
// OfferCampaign
// ---------------------------------------------------------------------------

/** Lifecycle stage of a campaign — drives the ProgressTimeline. */
export const CAMPAIGN_STAGES = [
  'onboarding',
  'ai_training',
  'legal_review',
  'approved',
  'calling',
  'optimization',
] as const
export type CampaignStage = (typeof CAMPAIGN_STAGES)[number]

/** Operational status shown in lists and badges. */
export type CampaignStatus =
  | 'draft'
  | 'preparing'
  | 'awaiting_ai_training'
  | 'ai_training'
  | 'legal_review'
  | 'awaiting_approval'
  | 'active'
  | 'paused'
  | 'completed'
  | 'rejected'
  | 'failed'

export interface LeadCriteria {
  industry: string
  companySize: string
  decisionMakers: string[]
  ageRange: string
  location: string
  other?: string
}

export interface Budget {
  total: number
  used: number
  daily: number
  currency: 'USD'
  expectedDurationDays: number
}

export interface CampaignMetrics {
  leadsFound: number
  leadsContacted: number
  callsCompleted: number
  bookings: number
  conversionRate: number
  bookingRate: number
  detailsRequested: number
}

export interface OfferCampaign {
  id: ID
  clientId: ID
  name: string
  offerName: string
  status: CampaignStatus
  stage: CampaignStage
  targetAudience: string
  geography: string
  criteria: LeadCriteria
  budget: Budget
  metrics: CampaignMetrics
  progress: number // 0..100
  agentId: ID // 1:1 — exactly one agent per offer campaign
  createdAt: string
  lastActivityAt: string
  history: number[] // recent daily bookings, for sparklines
}

// ---------------------------------------------------------------------------
// Leads / calls / bookings
// ---------------------------------------------------------------------------

export type LeadStatus =
  | 'new'
  | 'queued'
  | 'contacted'
  | 'interested'
  | 'details_requested'
  | 'booked'
  | 'not_interested'
  | 'no_response'
  | 'do_not_contact'
  | 'unreachable'

export interface Lead {
  id: ID
  offerCampaignId: ID
  name: string
  title: string
  company: string
  companySize: string
  location: string
  industry?: string
  website?: string
  email?: string
  phone?: string
  status: LeadStatus
  score: number // 0..100 AI fit score
  lastContactAt?: string
}

export type CallOutcome =
  | 'booked'
  | 'interested'
  | 'details_requested'
  | 'follow_up'
  | 'not_interested'
  | 'no_answer'
  | 'voicemail'
  | 'unknown'
  | 'callback'
  | 'declined'

export type CallSentiment = 'positive' | 'neutral' | 'negative' | 'high_intent' | 'low_intent'

export interface Call {
  id: ID
  offerCampaignId: ID
  leadId: ID
  agentId: ID
  startedAt: string
  durationSec: number
  outcome: CallOutcome
  sentiment: CallSentiment
  recordingUrl?: string
  summary: string
}

export interface Booking {
  id: ID
  offerCampaignId: ID
  leadId: ID
  scheduledFor: string
  durationMin: number
  title: string
  channel: 'zoom' | 'phone' | 'in_person' | 'calendly'
  meetingProvider?: 'zoom' | 'calendly'
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  createdAt: string
}

// ---------------------------------------------------------------------------
// OfferCampaign command center (Phase 3)
// ---------------------------------------------------------------------------

export interface LeadTimelineEvent {
  id: ID
  timestamp: string
  title: string
  description?: string
}

export interface LeadAnalysis {
  summary: string
  signals: string[]
  confidence: number
}

export interface TranscriptMessage {
  speaker: 'ai' | 'lead'
  text: string
}

export interface CallMoment {
  offsetSec: number
  label: string
}

export interface CallDetail extends Call {
  keyMoments: CallMoment[]
  signals: string[]
  confidence: number
  transcript: TranscriptMessage[]
}

export interface LeadDetail extends Lead {
  timeline: LeadTimelineEvent[]
  analysis: LeadAnalysis
  latestCall?: CallDetail
  booking?: Booking
}

export interface Recording extends CallDetail {
  leadName: string
  leadCompany: string
  phone?: string
}

/**
 * One row of the Super Admin call-history screen. Mirrors the enriched
 * `GET /recordings` response — lead/phone/duration/audio plus the RAW
 * `PostCallOutcome` value (not collapsed into the FE `CallOutcome` enum),
 * so the exact old-FE outcome labels can be rendered.
 */
export interface CallHistoryEntry {
  id: ID // recording_id
  leadId: ID
  agentId: ID
  leadName: string
  phone: string
  /** Raw PostCallOutcome value (e.g. "BOOKED", "NOT_ANSWERED"); "" = none. */
  outcome: string
  durationSec: number
  /** Playable recording URL (already prefixed with the API base path). */
  audioUrl: string
  startedAt: string
}

export interface CampaignFunnelStage {
  id: string
  label: string
  count: number
  conversionFromPrev?: number
  conversionFromTotal?: number
}

export interface CampaignInsight {
  id: ID
  text: string
  category: 'targeting' | 'timing' | 'messaging' | 'conversion'
}

export interface CampaignAttentionAlert {
  id: ID
  title: string
  description: string
  tone: Tone
  href?: string
  actionLabel?: string
}

export interface CampaignPerformancePoint {
  date: string
  leads: number
  calls: number
  bookings: number
}

export interface CampaignHealthSnapshot {
  overall: 'excellent' | 'good' | 'fair' | 'needs_attention'
  aiPerformance: 'excellent' | 'good' | 'fair'
  leadQuality: 'strong' | 'moderate' | 'weak'
  bookingRate: 'above_target' | 'on_target' | 'below_target'
  budgetEfficiency: 'healthy' | 'elevated' | 'critical'
  message: string
}

// ---------------------------------------------------------------------------
// Agents / integrations
// ---------------------------------------------------------------------------

export type AgentStatus = 'training' | 'ready' | 'calling' | 'idle' | 'error'

export interface Agent {
  id: ID
  name: string
  voice: string
  language: string
  status: AgentStatus
  offerCampaignIds: ID[] // offer campaigns this agent serves (campaign→agent is 1:1 via OfferCampaign.agentId)
  callsToday: number
  successRate: number
  trainingProgress: number // 0..100
  // Operational voice/identity/model editing fields (legacy Settings → Agent tab):
  role: import('./settings').AgentRole // AGENT_ROLES key
  role_label: string // computed label
  identity: string // custom identity; "" = use role template
  effective_identity: string // resolved identity (identity || role template)
  audio_model: string // TTS model ("" = default)
  transcription_model: string // caller STT model ("" = default)
  agent_model: string // chat-completions "brain" model
}

export type IntegrationProvider = 'gmail' | 'calendly' | 'zoom'
export type IntegrationState = 'connected' | 'disconnected' | 'error' | 'pending'

export interface Integration {
  provider: IntegrationProvider
  state: IntegrationState
  account?: string
  connectedAt?: string
  lastSyncAt?: string
}

// ---------------------------------------------------------------------------
// Activity / analytics
// ---------------------------------------------------------------------------

export type ActivityKind =
  | 'leads_analyzed'
  | 'calls_completed'
  | 'bookings_detected'
  | 'budget_threshold'
  | 'summary_generated'
  | 'training_progress'
  | 'integration'
  | 'approval'

export interface Activity {
  id: ID
  kind: ActivityKind
  title: string
  description?: string
  offerCampaignId?: ID
  timestamp: string
  tone: Tone
}

export interface MetricPoint {
  date: string
  value: number
}

export interface MetricSeries {
  key: string
  label: string
  value: number
  delta: number // percent change vs previous period
  format: 'number' | 'percent' | 'currency'
  history: MetricPoint[]
}

export interface Analytics {
  period: '7d' | '30d' | '90d'
  metrics: MetricSeries[]
  budget: { used: number; total: number }
}

export interface CampaignHealth {
  active: number
  inSetup: number
  awaitingApproval: number
  paused: number
  completed: number
}

export type AttentionKind = 'integration' | 'onboarding' | 'approval' | 'upload' | 'review'

export interface AttentionItem {
  id: ID
  kind: AttentionKind
  title: string
  description: string
  offerCampaignId?: ID
  href: string
  priority: 'high' | 'medium' | 'low'
}
