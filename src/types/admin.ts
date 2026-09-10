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
  /** Client or campaign website URL captured at creation. */
  websiteUrl?: string
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
  /** Campaign-scoped email / WhatsApp message templates. */
  messaging?: import('@/types/messaging').CampaignMessagingContent
  /** Offer video uploaded for admin review (stored on BE, max 15 MB). */
  video?: CampaignReviewVideo
}

export interface CampaignReviewVideo {
  filename?: string
  name?: string
  size?: string
  sizeBytes?: number
  orientation?: string
  durationSec?: number
  resolution?: string
  mimeType?: string
  url?: string
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
  /** 0–100 score derived from applicable compliance checks. */
  complianceScore?: number
  /** Detected legal jurisdictions (e.g. US, IL, EU). */
  complianceJurisdictions?: string[]
  readinessChecklist: ReadinessChecklist[]
  auditEvents: AuditEvent[]
  hasVideo: boolean
  videoMeta?: {
    name: string
    size: string
    orientation: string
    url?: string
    durationSec?: number
    resolution?: string
  }
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

// ---------------------------------------------------------------------------
// Admin users (M-0017) — mirrors GET/POST/PUT/DELETE /admin/users.
// ---------------------------------------------------------------------------

export type AdminUserRole = 'super_admin' | 'admin' | 'client_user'

/** A platform user as returned by GET /admin/users. */
export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminUserRole
  /** Client workspaces a client_user is scoped to; [] for other roles. */
  clientIds: string[]
  /**
   * Console grants (catalog keys). Role "admin" AND "client_user". For a
   * client_user an empty list means FULL access within the assigned clients
   * (legacy); a non-empty list restricts them to those console areas.
   */
  permissions: string[]
  active: boolean
  tokenVersion: number
  createdAt: string
}

/** POST /admin/users body (name/email/password required). */
export interface AdminUserCreateInput {
  name: string
  email: string
  password: string
  role: AdminUserRole
  clientIds: string[]
  /**
   * Optional console grants (role "admin" or "client_user"; for client_user
   * an empty list = full access within the assigned clients).
   */
  permissions?: string[]
}

/** PUT /admin/users/{id} partial body — only provided fields are sent. */
export interface AdminUserUpdateInput {
  name?: string
  email?: string
  /** Provide to reset the password. */
  password?: string
  role?: AdminUserRole
  clientIds?: string[]
  /** Replace the whole console grant set (roles "admin" / "client_user"; for
   *  client_user [] = full access within the assigned clients). */
  permissions?: string[]
  /** false soft-disables the user and revokes their JWTs. */
  active?: boolean
}

// ---------------------------------------------------------------------------
// Permission catalog (Super Admin → Permissions) — mirrors GET /admin/permissions.
// ---------------------------------------------------------------------------

export type PermissionKind = 'section' | 'action'

export interface PermissionDescriptor {
  key: string
  label: string
  description: string
  group: string
  groupLabel: string
  kind: PermissionKind
  /** Section key this action requires (and implies); null for sections. */
  requires: string | null
}

export interface PermissionRoleDescriptor {
  value: AdminUserRole
  label: string
  description: string
}

export interface PermissionCatalog {
  roles: PermissionRoleDescriptor[]
  permissions: PermissionDescriptor[]
}
