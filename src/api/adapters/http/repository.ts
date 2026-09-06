import type { Repository } from '@/api/contracts'
import { NotImplementedError } from './client'
import type { Campaign, User } from '@/types'

function todo(method: string, endpoint: string): never {
  throw new NotImplementedError(method, endpoint)
}

/**
 * HTTP repository adapter.
 * Replace `todo()` stubs with `apiClient` calls as you wire your backend.
 * See docs/API_CONTRACT.md for suggested endpoints.
 */
export const httpRepository: Repository = {
  // --- Session (example implementations) ---
  getCurrentUser(): User {
    // TODO: cache user from GET /me after login; example:
    // return apiClient.get<User>('/me')
    todo('getCurrentUser', 'GET /me')
  },
  getSuperAdminUser(): User {
    todo('getSuperAdminUser', 'GET /admin/me')
  },
  getCurrentClient() {
    todo('getCurrentClient', 'GET /workspace')
  },
  getClients() {
    todo('getClients', 'GET /admin/clients')
  },

  // --- Campaigns (example implementation) ---
  getCampaigns(_clientId?: string): Campaign[] {
    // TODO: return apiClient.get<Campaign[]>('/campaigns')
    console.warn('[httpRepository] getCampaigns: wire GET /campaigns')
    return []
  },
  getCampaign(_id: string) {
    todo('getCampaign', 'GET /campaigns/:id')
  },
  getFeaturedCampaign() {
    todo('getFeaturedCampaign', 'GET /campaigns/featured')
  },
  getCampaignHealth() {
    todo('getCampaignHealth', 'GET /campaigns/health')
  },
  createCampaignFromDraft() {
    todo('createCampaignFromDraft', 'POST /campaigns')
  },

  getLeads() {
    todo('getLeads', 'GET /campaigns/:id/leads')
  },
  getLead() {
    todo('getLead', 'GET /campaigns/:campaignId/leads/:leadId')
  },
  getCalls() {
    todo('getCalls', 'GET /calls')
  },
  getCall() {
    todo('getCall', 'GET /calls/:id')
  },
  getBookings() {
    todo('getBookings', 'GET /bookings')
  },
  getRecordings() {
    todo('getRecordings', 'GET /campaigns/:id/recordings')
  },
  getCampaignFunnel() {
    todo('getCampaignFunnel', 'GET /campaigns/:id/funnel')
  },
  getCampaignHealthSnapshot() {
    todo('getCampaignHealthSnapshot', 'GET /campaigns/:id/health')
  },
  getCampaignInsights() {
    todo('getCampaignInsights', 'GET /campaigns/:id/insights')
  },
  getCampaignAlerts() {
    todo('getCampaignAlerts', 'GET /campaigns/:id/alerts')
  },
  getCampaignPerformance() {
    todo('getCampaignPerformance', 'GET /campaigns/:id/performance')
  },
  getCampaignAnalytics() {
    todo('getCampaignAnalytics', 'GET /campaigns/:id/analytics')
  },

  getAgents() {
    todo('getAgents', 'GET /agents')
  },
  getIntegrations() {
    todo('getIntegrations', 'GET /integrations')
  },

  getAnalytics() {
    todo('getAnalytics', 'GET /analytics')
  },
  getActivity() {
    todo('getActivity', 'GET /activity')
  },
  getAttentionItems() {
    todo('getAttentionItems', 'GET /attention')
  },
  getAdminOverview() {
    todo('getAdminOverview', 'GET /admin/overview')
  },

  getAdminMeta() {
    todo('getAdminMeta', 'GET /admin/campaigns/:id/meta')
  },
  getAllAdminMeta() {
    todo('getAllAdminMeta', 'GET /admin/campaigns/meta')
  },
  getCampaignReview() {
    todo('getCampaignReview', 'GET /admin/campaigns/:id/review')
  },
  getCampaignAudit() {
    todo('getCampaignAudit', 'GET /admin/campaigns/:id/audit')
  },
  getAdminNotifications() {
    todo('getAdminNotifications', 'GET /admin/notifications')
  },
  markAdminNotificationsRead() {
    todo('markAdminNotificationsRead', 'POST /admin/notifications/read')
  },
  getAdminUnreadCount() {
    todo('getAdminUnreadCount', 'GET /admin/notifications/unread-count')
  },
  approveCampaign() {
    todo('approveCampaign', 'POST /admin/campaigns/:id/approve')
  },
  rejectCampaign() {
    todo('rejectCampaign', 'POST /admin/campaigns/:id/reject')
  },
  requestCampaignChanges() {
    todo('requestCampaignChanges', 'POST /admin/campaigns/:id/request-changes')
  },
  completeCampaignTraining() {
    todo('completeCampaignTraining', 'POST /admin/campaigns/:id/training/complete')
  },
  startCampaignTraining() {
    todo('startCampaignTraining', 'POST /admin/campaigns/:id/training/start')
  },
  getTrainingCampaigns() {
    todo('getTrainingCampaigns', 'GET /admin/training/campaigns')
  },
  updateCampaign() {
    todo('updateCampaign', 'PATCH /campaigns/:id')
  },
  getClient() {
    todo('getClient', 'GET /admin/clients/:id')
  },

  getAIOverview() {
    todo('getAIOverview', 'GET /ai/overview')
  },
  getAIActivity() {
    todo('getAIActivity', 'GET /ai/activity')
  },
  getAIConversations() {
    todo('getAIConversations', 'GET /ai/conversations')
  },
  getAIConversation() {
    todo('getAIConversation', 'GET /ai/conversations/:id')
  },
  getAIObjections() {
    todo('getAIObjections', 'GET /ai/objections')
  },
  getAILearningPatterns() {
    todo('getAILearningPatterns', 'GET /ai/learning/patterns')
  },
  getAIImprovements() {
    todo('getAIImprovements', 'GET /ai/learning/improvements')
  },
  getAIFollowUps() {
    todo('getAIFollowUps', 'GET /ai/follow-ups')
  },
  getAIEscalations() {
    todo('getAIEscalations', 'GET /ai/escalations')
  },
  getAIBookings() {
    todo('getAIBookings', 'GET /ai/bookings')
  },
  getAIInsights() {
    todo('getAIInsights', 'GET /ai/insights')
  },
  getAIHealth() {
    todo('getAIHealth', 'GET /ai/health')
  },
  getAIAgentProfile() {
    todo('getAIAgentProfile', 'GET /ai/agents/:id')
  },
  getAIPerformance() {
    todo('getAIPerformance', 'GET /ai/performance')
  },
  searchAI() {
    todo('searchAI', 'GET /ai/search')
  },
  markConversationViewed() {
    todo('markConversationViewed', 'POST /ai/conversations/:id/viewed')
  },
  addSimulatedActivity() {
    todo('addSimulatedActivity', 'POST /ai/activity')
  },

  getAllLeads() {
    todo('getAllLeads', 'GET /leads')
  },
  getLeadHubMetrics() {
    todo('getLeadHubMetrics', 'GET /leads/metrics')
  },
  getLeadHubStats() {
    todo('getLeadHubStats', 'GET /leads/stats')
  },
  getLeadSegments() {
    todo('getLeadSegments', 'GET /leads/segments')
  },
  filterLeads() {
    todo('filterLeads', 'client-side or GET /leads?filters')
  },
  getLeadIntelligence() {
    todo('getLeadIntelligence', 'GET /leads/:id/intelligence')
  },
  findLead() {
    todo('findLead', 'GET /leads/:id')
  },
  getRecommendedLeads() {
    todo('getRecommendedLeads', 'GET /leads/recommended')
  },
  getPriorityLeads() {
    todo('getPriorityLeads', 'GET /leads/priority')
  },
  getLeadNotes() {
    todo('getLeadNotes', 'GET /leads/:id/notes')
  },
  addLeadNote() {
    todo('addLeadNote', 'POST /leads/:id/notes')
  },
  updateLeadNote() {
    todo('updateLeadNote', 'PATCH /leads/:id/notes/:noteId')
  },
  deleteLeadNote() {
    todo('deleteLeadNote', 'DELETE /leads/:id/notes/:noteId')
  },
  getLeadTags() {
    todo('getLeadTags', 'GET /leads/:id/tags')
  },
  toggleLeadTag() {
    todo('toggleLeadTag', 'POST /leads/:id/tags/toggle')
  },
  setLeadStatus() {
    todo('setLeadStatus', 'PATCH /leads/:id/status')
  },
  getSelectedLeadIds() {
    return []
  },
  toggleLeadSelection() {
    todo('toggleLeadSelection', 'client-side selection state')
  },
  clearLeadSelection() {
    // no-op until wired
  },
  selectAllLeads() {
    todo('selectAllLeads', 'client-side selection state')
  },
}
