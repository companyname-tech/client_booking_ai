/**
 * Data access layer.
 *
 * UI components only talk to these functions, never to mock files directly.
 * When the backend exists, swap the bodies for API calls (or wrap them in a
 * query library) without touching a single component.
 */
import type {
  Activity,
  Agent,
  Analytics,
  AttentionItem,
  Call,
  Campaign,
  CampaignHealth,
  Client,
  Integration,
  Lead,
  User,
} from '@/types'
import { mockActivity, mockAttentionItems } from './mockActivity'
import { mockAgents, mockIntegrations } from './mockAgents'
import { mockAdminOverview, mockAnalytics, mockCampaignHealth } from './mockAnalytics'
import { mockCalls, mockBookings } from './mockCalls'
import { addCampaign, draftToCampaign, getCampaignStore, updateCampaign } from './campaignStore'
import {
  getAdminMeta,
  getAllAdminMeta,
  getReviewData,
  getAuditLog,
  getNotifications,
  markNotificationsRead,
  getUnreadCount,
  approveCampaign,
  rejectCampaign,
  requestChanges,
  completeTraining,
  startTraining,
  getTrainingCampaigns,
} from './adminStore'
import type { CampaignDraft } from '@/types/campaignDraft'
import { currentClient, currentUser, mockClients, superAdminUser } from './mockClients'
import { mockLeads } from './mockLeads'
import {
  getCallsForCampaign,
  getBookingsForCampaign,
  getLeadsForCampaign,
  getLeadDetail,
  getCallDetail,
  getRecordingsForCampaign,
  getCampaignFunnel,
  getCampaignHealth,
  getCampaignInsights,
  getCampaignAlerts,
  getPerformanceSeries,
} from './campaignCommandData'
import { getCampaignAnalytics } from './campaignAnalyticsData'
import type { AnalyticsFilters } from '@/types/campaignAnalytics'
import type { AICommandFilters } from '@/types/aiCommand'
import {
  getAIOverview,
  getAIActivity,
  getAIConversations,
  getAIConversation,
  getAIObjections,
  getAILearningPatterns,
  getAIImprovements,
  getAIFollowUps,
  getAIEscalations,
  getAIBookings,
  getAIInsights,
  getAIHealth,
  getAIAgentProfile,
  getAIPerformance,
  searchAI,
  markConversationViewed,
  addSimulatedActivity,
} from './aiCommandData'
import {
  getAllLeads,
  getLeadHubMetrics,
  getLeadHubStats,
  getLeadSegments,
  filterLeads,
  getLeadIntelligence,
  findLeadById,
  getRecommendedLeads,
  getPriorityLeads,
} from './leadIntelligenceData'
import {
  getLeadNotes,
  addLeadNote,
  updateLeadNote,
  deleteLeadNote,
  getLeadTags,
  toggleLeadTag,
  setLeadStatus,
  getSelectedLeadIds,
  toggleLeadSelection,
  clearLeadSelection,
  selectAllLeads,
} from './leadIntelligenceStore'

export const mockRepository = {
  // Session
  getCurrentUser: (): User => currentUser,
  getSuperAdminUser: (): User => superAdminUser,
  getCurrentClient: (): Client => currentClient,
  getClients: (): Client[] => mockClients,

  // Campaigns
  getCampaigns: (clientId?: string): Campaign[] => {
    const list = getCampaignStore()
    return clientId ? list.filter((c) => c.clientId === clientId) : list
  },
  getCampaign: (id: string): Campaign | undefined => getCampaignStore().find((c) => c.id === id),
  getFeaturedCampaign: (): Campaign => getCampaignStore()[0],
  getCampaignHealth: (): CampaignHealth => mockCampaignHealth,
  createCampaignFromDraft: (draft: CampaignDraft): Campaign => {
    const client = currentClient
    return addCampaign(draftToCampaign(draft, client.id))
  },

  // Leads / calls
  getLeads: (campaignId?: string): Lead[] => {
    if (campaignId) return getLeadsForCampaign(campaignId)
    return mockLeads
  },
  getLead: (campaignId: string, leadId: string) => getLeadDetail(campaignId, leadId),
  getCalls: (campaignId?: string): Call[] => {
    if (campaignId) return getCallsForCampaign(campaignId)
    return mockCalls
  },
  getCall: (campaignId: string, callId: string) => getCallDetail(campaignId, callId),
  getBookings: (campaignId?: string) => (campaignId ? getBookingsForCampaign(campaignId) : mockBookings),
  getRecordings: (campaignId: string) => getRecordingsForCampaign(campaignId),
  getCampaignFunnel: (campaignId: string, metrics?: Campaign['metrics']) => getCampaignFunnel(campaignId, metrics),
  getCampaignHealthSnapshot: (campaignId: string) => getCampaignHealth(campaignId),
  getCampaignInsights: (campaignId: string) => getCampaignInsights(campaignId),
  getCampaignAlerts: (campaignId: string) => getCampaignAlerts(campaignId),
  getCampaignPerformance: (campaignId: string, days: 7 | 14 | 30 = 14) => getPerformanceSeries(campaignId, days),
  getCampaignAnalytics: (campaignId: string, filters: AnalyticsFilters) => {
    const campaign = getCampaignStore().find((c) => c.id === campaignId)
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`)
    return getCampaignAnalytics(campaign, filters)
  },

  // Agents / integrations
  getAgents: (): Agent[] => mockAgents,
  getIntegrations: (): Integration[] => mockIntegrations,

  // Analytics / activity
  getAnalytics: (): Analytics => mockAnalytics,
  getActivity: (limit = 7): Activity[] => mockActivity.slice(0, limit),
  getAttentionItems: (): AttentionItem[] => mockAttentionItems,
  getAdminOverview: () => mockAdminOverview,

  // Admin operations
  getAdminMeta: (campaignId: string) => getAdminMeta(campaignId),
  getAllAdminMeta: () => getAllAdminMeta(),
  getCampaignReview: (campaignId: string) => getReviewData(campaignId),
  getCampaignAudit: (campaignId: string) => getAuditLog(campaignId),
  getAdminNotifications: () => getNotifications(),
  markAdminNotificationsRead: () => markNotificationsRead(),
  getAdminUnreadCount: () => getUnreadCount(),
  approveCampaign: (id: string) => approveCampaign(id),
  rejectCampaign: (id: string, reason: string) => rejectCampaign(id, reason),
  requestCampaignChanges: (id: string, message: string) => requestChanges(id, message),
  completeCampaignTraining: (id: string, score: number) => completeTraining(id, score),
  startCampaignTraining: (id: string) => startTraining(id),
  getTrainingCampaigns: () => getTrainingCampaigns(),
  updateCampaign: (id: string, patch: Partial<Campaign>) => updateCampaign(id, patch),
  getClient: (id: string) => mockClients.find((c) => c.id === id),

  // AI Command Center
  getAIOverview: (clientId?: string) => getAIOverview(clientId),
  getAIActivity: (limit?: number) => getAIActivity(limit),
  getAIConversations: (filters?: AICommandFilters) => getAIConversations(filters),
  getAIConversation: (id: string) => getAIConversation(id),
  getAIObjections: () => getAIObjections(),
  getAILearningPatterns: () => getAILearningPatterns(),
  getAIImprovements: () => getAIImprovements(),
  getAIFollowUps: () => getAIFollowUps(),
  getAIEscalations: () => getAIEscalations(),
  getAIBookings: () => getAIBookings(),
  getAIInsights: () => getAIInsights(),
  getAIHealth: () => getAIHealth(),
  getAIAgentProfile: (id: string) => getAIAgentProfile(id),
  getAIPerformance: () => getAIPerformance(),
  searchAI: (q: string) => searchAI(q),
  markConversationViewed: (id: string) => markConversationViewed(id),
  addSimulatedActivity: (event: Parameters<typeof addSimulatedActivity>[0]) => addSimulatedActivity(event),

  // Lead Intelligence Hub
  getAllLeads: (clientId?: string) => getAllLeads(clientId),
  getLeadHubMetrics: () => getLeadHubMetrics(),
  getLeadHubStats: (leads?: ReturnType<typeof getAllLeads>) => getLeadHubStats(leads ?? getAllLeads()),
  getLeadSegments: () => getLeadSegments(),
  filterLeads: (leads: ReturnType<typeof getAllLeads>, filters: import('@/types/leadIntelligence').LeadHubFilters) => filterLeads(leads, filters),
  getLeadIntelligence: (leadId: string) => getLeadIntelligence(leadId),
  findLead: (leadId: string) => findLeadById(leadId),
  getRecommendedLeads: (limit?: number) => getRecommendedLeads(limit),
  getPriorityLeads: (limit?: number) => getPriorityLeads(limit),
  getLeadNotes: (leadId: string) => getLeadNotes(leadId),
  addLeadNote: (leadId: string, text: string) => addLeadNote(leadId, text),
  updateLeadNote: (leadId: string, noteId: string, text: string) => updateLeadNote(leadId, noteId, text),
  deleteLeadNote: (leadId: string, noteId: string) => deleteLeadNote(leadId, noteId),
  getLeadTags: (leadId: string) => getLeadTags(leadId),
  toggleLeadTag: (leadId: string, tag: string) => toggleLeadTag(leadId, tag),
  setLeadStatus: (leadId: string, status: import('@/types').LeadStatus) => setLeadStatus(leadId, status),
  getSelectedLeadIds: () => getSelectedLeadIds(),
  toggleLeadSelection: (id: string) => toggleLeadSelection(id),
  clearLeadSelection: () => clearLeadSelection(),
  selectAllLeads: (ids: string[]) => selectAllLeads(ids),
}

export type MockRepository = typeof mockRepository
