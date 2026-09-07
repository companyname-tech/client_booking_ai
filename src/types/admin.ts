import type { Budget, CampaignStatus, Lead, LeadCriteria, Tone } from '@/types'

/**
 * A lead as shown on the Super Admin → Leads screen: the client-shared `Lead`
 * shape plus the campaign it belongs to and the extra fields the admin
 * inventory surfaces (outcome, meeting, verification, notes, created).
 */
export interface AdminLead extends Lead {
  campaignName: string
  lastCallOutcome: string
  lastCallSummary: string
  meetingLink: string
  notes: string
  verificationStatus: string
  createdAt: string
}

export type AdminWorkflowStatus =
  | 'submitted'
  | 'awaiting_approval'
  | 'compliance_review'
  | 'training'
  | 'approved'
  | 'launching'
  | 'live'
  | 'changes_requested'
  | 'rejected'

export type ComplianceItemStatus = 'passed' | 'needs_review' | 'warning' | 'not_applicable'

export type RiskLevel = 'low' | 'medium' | 'high'

export type TrainingStatus = 'not_started' | 'ready' | 'training' | 'trained' | 'needs_improvement'

export interface AdminNotification {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  tone: Tone
  href?: string
}

export interface AuditEvent {
  id: string
  timestamp: string
  title: string
  description?: string
  actor?: 'client' | 'ai' | 'admin' | 'system'
}

// ---------------------------------------------------------------------------
// Activity log (Super Admin → Activity — audit trail + system events)
// ---------------------------------------------------------------------------

export type ActivitySource = 'audit' | 'cost' | 'call'

export interface ActivityLogEntry {
  id: string
  source: ActivitySource
  kind: string
  action: string
  actor: string
  targetType: string
  targetId: string
  target: string
  description: string
  offerId: string
  timestamp: string
}

export interface AIAssessment {
  score: number
  summary: string
  strengths: string[]
  issues: string[]
  recommendations: string[]
}

export interface OfferAnalysis {
  clarity: string
  valueProposition: string
  cta: string
  recommendation: string
}

export interface BudgetProjection {
  monthlyBudget: number
  expectedLeads: number
  projectedConversations: number
  projectedBookingsMin: number
  projectedBookingsMax: number
  aiNote: string
}

export interface AIAgentConfig {
  agentName: string
  voice: string
  language: string
  model: string
  role: string
  objective: string
  qualificationCriteria: string[]
  bookingObjective: string
  fallbackBehavior: string
}

export interface ReadinessChecklist {
  id: string
  label: string
  done: boolean
  score?: number
}

export interface ComplianceItem {
  id: string
  label: string
  status: ComplianceItemStatus
  note?: string
}

/**
 * Admin-editable campaign content — the sections of the campaign review screen.
 * Persisted as `campaign_content` on the backend offer row via PUT /offers/{id}
 * and round-tripped through the review payload (`campaignContent`).
 */
export interface ReviewCampaignContent {
  /** Target-audience configuration (mirrors the FE LeadCriteria shape). */
  targeting?: Partial<LeadCriteria>
  /** Campaign budget (mirrors the FE Budget shape, minus runtime usage). */
  budget?: Partial<Omit<Budget, 'used'>>
  /** Booking-destination configuration shown on the Booking review section. */
  booking?: { titleTemplate?: string; email?: string }
  /** Review-time agent-config snapshot (display only by default). */
  agentConfig?: Partial<AIAgentConfig>
  /** Booking-integration states (gmail/calendly/zoom). */
  integrations?: { gmail?: string; calendly?: string; zoom?: string }
}

export interface CampaignReviewData {
  offerCampaignId: string
  displayId: string
  submittedAt: string
  aiReadiness: number
  riskLevel: RiskLevel
  workflowStatus: AdminWorkflowStatus
  trainingStatus: TrainingStatus
  trainingScore?: number
  targetAssessment: AIAssessment
  offerAnalysis: OfferAnalysis
  budgetProjection: BudgetProjection
  agentConfig: AIAgentConfig
  complianceItems: ComplianceItem[]
  readinessChecklist: ReadinessChecklist[]
  auditEvents: AuditEvent[]
  hasVideo: boolean
  videoMeta?: { name: string; size: string; orientation: string }
  bookingTitle: string
  bookingEmail: string
  integrations: { gmail: string; calendly: string; zoom: string }
  /** Stored admin-editable content — null when the campaign has none yet. */
  campaignContent?: ReviewCampaignContent | null
}

export interface AdminCampaignMeta {
  offerCampaignId: string
  workflowStatus: AdminWorkflowStatus
  aiReadiness: number
  complianceScore: number
  riskLevel: RiskLevel
  trainingStatus: TrainingStatus
  trainingScore?: number
  targetingScore: number
  offerScore: number
  submittedAt: string
  changesRequested?: boolean
  changesMessage?: string
}

export function workflowToCampaignStatus(wf: AdminWorkflowStatus): CampaignStatus {
  const map: Record<AdminWorkflowStatus, CampaignStatus> = {
    submitted: 'awaiting_approval',
    awaiting_approval: 'awaiting_approval',
    compliance_review: 'legal_review',
    training: 'ai_training',
    approved: 'preparing',
    launching: 'preparing',
    live: 'active',
    changes_requested: 'preparing',
    rejected: 'rejected',
  }
  return map[wf]
}
