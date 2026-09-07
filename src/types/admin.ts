import type { CampaignStatus, Tone } from '@/types'

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
