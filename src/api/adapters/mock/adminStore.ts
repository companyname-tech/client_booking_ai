import type { Campaign } from '@/types'
import type {
  AdminCampaignMeta,
  AdminNotification,
  AdminWorkflowStatus,
  AuditEvent,
  CampaignReviewData,
  TrainingStatus,
} from '@/types/admin'
import { workflowToCampaignStatus } from '@/types/admin'
import { getCampaignById, updateCampaign } from './campaignStore'
import { hoursAgo, minutesAgo } from './time'
import { buildReviewData } from './mockAdminReview'

/** In-memory admin state — campaign workflow, notifications, audit. */
const meta = new Map<string, AdminCampaignMeta>()
let notifications: AdminNotification[] = []
const auditLogs = new Map<string, AuditEvent[]>()

function seedMeta(campaignId: string, wf: AdminWorkflowStatus, submittedAt: string, scores: Partial<AdminCampaignMeta> = {}) {
  meta.set(campaignId, {
    campaignId,
    workflowStatus: wf,
    aiReadiness: scores.aiReadiness ?? 88,
    complianceScore: scores.complianceScore ?? 85,
    riskLevel: scores.riskLevel ?? 'low',
    trainingStatus: scores.trainingStatus ?? 'not_started',
    targetingScore: scores.targetingScore ?? 90,
    offerScore: scores.offerScore ?? 88,
    submittedAt,
    ...scores,
  })
}

export function initAdminStore(campaigns: Campaign[]) {
  if (meta.size > 0) return
  campaigns.forEach((c) => {
    if (c.status === 'awaiting_approval') {
      seedMeta(c.id, 'awaiting_approval', c.createdAt, { aiReadiness: 92, riskLevel: 'low' })
    } else if (c.status === 'awaiting_ai_training') {
      seedMeta(c.id, 'submitted', c.createdAt, { aiReadiness: 78 })
    } else if (c.status === 'legal_review') {
      seedMeta(c.id, 'compliance_review', c.createdAt, { aiReadiness: 86, complianceScore: 72 })
    } else if (c.status === 'ai_training') {
      seedMeta(c.id, 'training', c.createdAt, { aiReadiness: 91, trainingStatus: 'training' })
    } else if (c.status === 'active') {
      seedMeta(c.id, 'live', c.createdAt, { aiReadiness: 96, trainingStatus: 'trained', trainingScore: 96 })
    } else if (c.status === 'rejected') {
      seedMeta(c.id, 'rejected', c.createdAt)
    }
  })

  notifications = [
    { id: 'n1', title: '3 campaigns are awaiting approval', description: 'Review queue needs attention', timestamp: minutesAgo(5), read: false, tone: 'warning', href: '/admin/approvals' },
    { id: 'n2', title: 'Acme Growth completed AI training', description: 'Dental Practice Expansion ready for simulation', timestamp: minutesAgo(18), read: false, tone: 'violet', href: '/admin/ai-training' },
    { id: 'n3', title: 'Campaign requires compliance review', description: 'Vertex Capital — Regulatory outreach', timestamp: hoursAgo(1), read: false, tone: 'warning', href: '/admin/compliance' },
    { id: 'n4', title: 'Client requested campaign changes', description: 'Lumen SaaS Labs updated targeting criteria', timestamp: hoursAgo(2), read: true, tone: 'info', href: '/admin/approvals' },
  ]
}

export function getAdminMeta(campaignId: string): AdminCampaignMeta | undefined {
  return meta.get(campaignId)
}

export function getAllAdminMeta(): AdminCampaignMeta[] {
  return [...meta.values()]
}

export function getReviewData(campaignId: string): CampaignReviewData | undefined {
  const campaign = getCampaignById(campaignId)
  if (!campaign) return undefined
  const m = meta.get(campaignId)
  return buildReviewData(campaign, m)
}

export function getAuditLog(campaignId: string): AuditEvent[] {
  if (auditLogs.has(campaignId)) return auditLogs.get(campaignId)!
  const review = getReviewData(campaignId)
  return review?.auditEvents ?? []
}

export function addAuditEvent(campaignId: string, event: Omit<AuditEvent, 'id'>) {
  const list = auditLogs.get(campaignId) ?? getAuditLog(campaignId)
  const entry: AuditEvent = { ...event, id: `aud_${Date.now()}` }
  auditLogs.set(campaignId, [entry, ...list])
}

export function getNotifications(): AdminNotification[] {
  return notifications
}

export function markNotificationsRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }))
}

export function getUnreadCount(): number {
  return notifications.filter((n) => !n.read).length
}

export function approveCampaign(campaignId: string): void {
  const m = meta.get(campaignId)
  if (!m) return
  meta.set(campaignId, { ...m, workflowStatus: 'approved', trainingStatus: m.trainingStatus === 'trained' ? 'trained' : m.trainingStatus })
  updateCampaign(campaignId, { status: 'preparing', stage: 'approved', progress: 90 })
  addAuditEvent(campaignId, { timestamp: new Date().toISOString(), title: 'Admin approved campaign', actor: 'admin' })
  window.setTimeout(() => {
    const cur = meta.get(campaignId)
    if (cur?.workflowStatus === 'approved') {
      meta.set(campaignId, { ...cur, workflowStatus: 'launching' })
      updateCampaign(campaignId, { status: 'preparing', progress: 95 })
    }
    window.setTimeout(() => {
      const cur2 = meta.get(campaignId)
      if (cur2?.workflowStatus === 'launching') {
        meta.set(campaignId, { ...cur2, workflowStatus: 'live' })
        updateCampaign(campaignId, { status: 'active', stage: 'calling', progress: 100 })
        addAuditEvent(campaignId, { timestamp: new Date().toISOString(), title: 'Campaign entered launch queue', actor: 'system' })
      }
    }, 1500)
  }, 800)
}

export function rejectCampaign(campaignId: string, reason: string): void {
  const m = meta.get(campaignId)
  if (!m) return
  meta.set(campaignId, { ...m, workflowStatus: 'rejected' })
  updateCampaign(campaignId, { status: 'rejected' })
  addAuditEvent(campaignId, { timestamp: new Date().toISOString(), title: 'Campaign rejected', description: reason, actor: 'admin' })
}

export function requestChanges(campaignId: string, message: string): void {
  const m = meta.get(campaignId)
  if (!m) return
  meta.set(campaignId, { ...m, workflowStatus: 'changes_requested', changesRequested: true, changesMessage: message })
  updateCampaign(campaignId, { status: 'preparing' })
  addAuditEvent(campaignId, { timestamp: new Date().toISOString(), title: 'Changes requested from client', description: message, actor: 'admin' })
}

export function completeTraining(campaignId: string, score: number): void {
  const m = meta.get(campaignId)
  if (!m) return
  meta.set(campaignId, { ...m, trainingStatus: 'trained', trainingScore: score, workflowStatus: m.workflowStatus === 'training' ? 'awaiting_approval' : m.workflowStatus })
  updateCampaign(campaignId, { status: workflowToCampaignStatus(m.workflowStatus === 'training' ? 'awaiting_approval' : m.workflowStatus), stage: 'ai_training', progress: Math.max(65, score - 10) })
  addAuditEvent(campaignId, { timestamp: new Date().toISOString(), title: 'AI training completed', description: `Training score: ${score}%`, actor: 'ai' })
}

export function startTraining(campaignId: string): void {
  const m = meta.get(campaignId)
  if (!m) return
  meta.set(campaignId, { ...m, trainingStatus: 'training', workflowStatus: 'training' })
  updateCampaign(campaignId, { status: 'ai_training', stage: 'ai_training' })
}

export function getTrainingCampaigns(): { campaignId: string; status: TrainingStatus }[] {
  return [...meta.entries()].map(([campaignId, m]) => ({ campaignId, status: m.trainingStatus }))
}
