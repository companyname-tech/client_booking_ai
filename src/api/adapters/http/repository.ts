/**
 * HTTP repository adapter — the single place backend contracts are translated
 * (snake_case → camelCase, BE enums → FE enums, wrapped lists → bare arrays).
 *
 * Every method maps to a real leads_to_conversion endpoint. Tier A/B domains
 * (settings, connections, agents, offers, leads, calls, recordings) have live
 * endpoints; Tier C domains (admin workflow, AI command center, lead
 * intelligence, analytics) target the endpoints the backend worker implements
 * under the same paths — until then those screens render the error/empty state.
 *
 * See the data-contract map (t_17cd0499) for the full tier split.
 */
import { apiClient } from './client'
import { ensureEntryIds, stripEntryIds } from '@/lib/pronunciation'
import type { Agent, OfferCampaign, User, Client, Lead, Call, Booking, CallDetail, LeadDetail, Recording, CampaignFunnelStage, CampaignInsight, CampaignAttentionAlert, CampaignPerformancePoint, CampaignHealthSnapshot, CampaignHealth, Analytics, Activity, AttentionItem, Integration, LeadStatus } from '@/types'
import type { AppSettings, ConnectionsState, ConnectionKey, TwilioNumber, FishVoice, SettingsSchemaField, AgentModels, AgentVoiceOption, AgentRole } from '@/types/settings'
import type { AdminCampaignMeta, CampaignReviewData, AuditEvent, AdminNotification, TrainingStatus } from '@/types/admin'
import type { CampaignAnalyticsData, AnalyticsFilters } from '@/types/campaignAnalytics'
import type { EnrichedLead, LeadHubMetrics, LeadHubStats, LeadSegment, LeadHubFilters, LeadIntelligenceProfile, LeadNote } from '@/types/leadIntelligence'
import type { AICommandOverview, AIActivityEvent, AIConversationSummary, AIConversationDetail, AIObjection, AILearningPattern, AIImprovement, AIFollowUp, AIEscalation, AIBookingConversation, AIInsight, AIHealthSnapshot, AIAgentProfile, AIPerformanceSnapshot, AICommandFilters } from '@/types/aiCommand'
import type { CampaignDraft } from '@/types/campaignDraft'
import type { PronunciationAgentOption, PronunciationConfigDto, PronunciationLexiconEntry, TranscribePronunciationReply } from '@/types/pronunciation'

// ---------------------------------------------------------------------------
// Wire DTOs (snake_case) for the Tier B domains.
// ---------------------------------------------------------------------------

interface OfferWire {
  id: string
  title: string
  name?: string
  description?: string
  value_proposition?: string
  minimum_price?: string
  cta?: string
  agent_id?: string
  category?: string
  company?: string
  phone?: string
  contact_name?: string
  currency?: string
  value?: string
  source?: string
  created_at?: string
  lead_count?: number
  verification?: Record<string, number>
  approved_leads?: number
  contacted_leads?: number
  meetings_booked?: number
  conversion_rate?: number
  agent_name?: string
}

interface LeadWire {
  lead_id: string
  lead_name: string
  website_link?: string
  offer_id?: string
  offer?: string
  industry?: string
  emails?: { email?: string }[]
  phone_numbers?: { phone_number?: string }[]
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
  lead_status?: string
  verification_status?: string
  verified_business_name?: string
  verified_email?: string
  verified_phone?: string
  relevance_score?: number
  intent_score?: number
  last_call_outcome?: string
  last_call_at?: string
  last_call_summary?: string
  meeting_link?: string
  meeting_created_at?: string
  call_scheduled_at?: string
  created_at?: string
}

interface AgentWire {
  agent_id: string
  name: string
  voice?: string
  language?: string
  role?: string
  role_label?: string
  identity?: string
  effective_identity?: string
  audio_model?: string
  transcription_model?: string
  agent_model?: string
  pronunciation_lexicon?: PronunciationLexiconEntry[]
}

interface CallWire {
  id?: string | number
  call_id?: string | number
  lead_id?: string
  offer_id?: string
  agent_id?: string
  started_at?: string
  created_at?: string
  duration?: number
  duration_sec?: number
  outcome?: string
  last_call_outcome?: string
  summary?: string
  last_call_summary?: string
  recording_url?: string
  audio_url?: string
  lead_name?: string
  phone?: string
  transcript?: string
}

interface RecordingWire {
  id?: string | number
  recording_id?: string | number
  lead_id?: string
  offer_id?: string
  agent_id?: string
  created_at?: string
  duration?: number
  duration_sec?: number
  outcome?: string
  summary?: string
  audio_url?: string
  lead_name?: string
  lead_company?: string
  phone?: string
}

interface UserWire {
  username?: string
  email?: string
  name?: string
}

interface SettingsSchemaWire {
  fields?: SettingsSchemaField[]
}

interface FishVoicesWire {
  provider?: string
  fish_configured?: boolean
  voices?: FishVoice[]
}

interface TwilioNumbersWire {
  numbers?: TwilioNumber[]
}

interface AgentsVoicesWire {
  provider?: string
  voices?: AgentVoiceOption[]
  models?: AgentModels['audio']
}

interface LeadHubStatsWire {
  status_distribution?: { status: string; count: number }[]
  quality_distribution?: { range: string; percent: number }[]
  sources?: { campaign_name: string; percent: number }[]
}

// ---------------------------------------------------------------------------
// Enum + shape translation helpers.
// ---------------------------------------------------------------------------

const LEAD_STATUS_TO_BE: Partial<Record<LeadStatus, string>> = {
  new: 'NEW',
  queued: 'NEW',
  contacted: 'CONTACTED',
  interested: 'CONTACTED',
  details_requested: 'CONTACTED',
  booked: 'MEETING_BOOKED',
  not_interested: 'LOST',
  no_response: 'CONTACTED',
  do_not_contact: 'LOST',
  unreachable: 'INVALID',
}

const BE_TO_LEAD_STATUS: Record<string, LeadStatus> = {
  NEW: 'new',
  CONTACTED: 'contacted',
  MEETING_BOOKED: 'booked',
  LOST: 'not_interested',
  INVALID: 'unreachable',
  QUALIFIED: 'interested',
  WON: 'booked',
}

function toLeadStatus(be: string | undefined): LeadStatus {
  if (!be) return 'new'
  return BE_TO_LEAD_STATUS[be.toUpperCase()] ?? 'contacted'
}

function toBeLeadStatus(fe: LeadStatus): string {
  return LEAD_STATUS_TO_BE[fe] ?? 'NEW'
}

function toAgent(wire: AgentWire): Agent {
  return {
    id: wire.agent_id,
    name: wire.name,
    voice: wire.voice ?? '',
    language: wire.language ?? 'he',
    status: 'ready',
    offerCampaignIds: [],
    callsToday: 0,
    successRate: 0,
    trainingProgress: 100,
    role: (wire.role ?? 'cold_call_seller') as AgentRole,
    role_label: wire.role_label ?? '',
    identity: wire.identity ?? '',
    effective_identity: wire.effective_identity ?? wire.identity ?? '',
    audio_model: wire.audio_model ?? '',
    transcription_model: wire.transcription_model ?? '',
    agent_model: wire.agent_model ?? '',
  }
}

function toLead(wire: LeadWire): Lead {
  return {
    id: wire.lead_id,
    offerCampaignId: wire.offer_id ?? '',
    name: wire.lead_name,
    title: wire.contact_name ?? '',
    company: wire.verified_business_name ?? '',
    companySize: '',
    location: '',
    industry: wire.industry ?? '',
    website: wire.website_link ?? '',
    email: wire.emails?.[0]?.email ?? wire.contact_email ?? '',
    phone: wire.phone_numbers?.[0]?.phone_number ?? wire.contact_phone ?? '',
    status: toLeadStatus(wire.lead_status),
    score: Math.round((wire.relevance_score ?? 0) * 100),
    lastContactAt: wire.last_call_at || wire.created_at || undefined,
  }
}

function toCampaign(wire: OfferWire): OfferCampaign {
  const leadCount = wire.lead_count ?? 0
  const status = leadCount > 0 ? 'active' : 'draft'
  return {
    id: wire.id,
    clientId: '',
    name: wire.name || wire.title,
    offerName: wire.title,
    status,
    stage: status === 'active' ? 'calling' : 'onboarding',
    targetAudience: '',
    geography: '',
    criteria: { industry: '', companySize: '', decisionMakers: [], ageRange: '', location: '' },
    budget: { total: 0, used: 0, daily: 0, currency: 'USD', expectedDurationDays: 0 },
    metrics: {
      leadsFound: leadCount,
      leadsContacted: wire.contacted_leads ?? 0,
      callsCompleted: wire.contacted_leads ?? 0,
      bookings: wire.meetings_booked ?? 0,
      conversionRate: wire.conversion_rate ?? 0,
      bookingRate: wire.conversion_rate ?? 0,
      detailsRequested: 0,
    },
    progress: Math.min(100, Math.round((wire.conversion_rate ?? 0) * 100)),
    agentId: wire.agent_id ?? '',
    createdAt: wire.created_at ?? '',
    lastActivityAt: wire.created_at ?? '',
    history: [],
  }
}

// ---------------------------------------------------------------------------
// Client-side lead selection (UI state, not persisted).
// ---------------------------------------------------------------------------

const selectedLeadIds = new Set<string>()

// ---------------------------------------------------------------------------
// The repository.
// ---------------------------------------------------------------------------

export const httpRepository = {
  // --- Session / user -----------------------------------------------------
  async getCurrentUser(): Promise<User> {
    const me = await apiClient.get<UserWire>('/auth/me')
    const username = me?.username ?? me?.name ?? me?.email ?? 'admin'
    return { id: username, name: username, email: username, role: 'admin' }
  },
  async getSuperAdminUser(): Promise<User> {
    return this.getCurrentUser()
  },
  async getCurrentClient(): Promise<Client> {
    return apiClient.get<Client>('/workspace')
  },
  async getClients(): Promise<Client[]> {
    return apiClient.get<Client[]>('/admin/clients')
  },

  // --- Campaigns (→ BE offers) -------------------------------------------
  async getCampaigns(_clientId?: string): Promise<OfferCampaign[]> {
    const offers = await apiClient.get<OfferWire[]>('/offers')
    return (offers ?? []).map(toCampaign)
  },
  async getCampaign(id: string): Promise<OfferCampaign | undefined> {
    const offers = await this.getCampaigns()
    return offers.find((c) => c.id === id)
  },
  async getFeaturedCampaign(): Promise<OfferCampaign> {
    const offers = await this.getCampaigns()
    return offers[0]
  },
  async getCampaignHealth(): Promise<CampaignHealth> {
    return apiClient.get<CampaignHealth>('/campaigns/health')
  },
  async createCampaignFromDraft(draft: CampaignDraft): Promise<OfferCampaign> {
    const created = await apiClient.post<OfferWire>('/offers', {
      title: draft.offer.offerName,
      description: draft.offer.description,
      value_proposition: draft.offer.pitch,
      category: draft.target.industries[0] ?? '',
    })
    return toCampaign(created)
  },

  // --- Leads / calls ------------------------------------------------------
  async getLeads(offerCampaignId?: string): Promise<Lead[]> {
    const qs = offerCampaignId ? `?offer_id=${encodeURIComponent(offerCampaignId)}` : ''
    const res = await apiClient.get<{ leads?: LeadWire[] }>(`/leads${qs}`)
    return (res?.leads ?? []).map(toLead)
  },
  async getLead(_offerCampaignId: string, leadId: string): Promise<LeadDetail> {
    const lead = await apiClient.get<LeadWire>(`/leads/${leadId}`)
    return { ...toLead(lead), timeline: [], analysis: { summary: lead.last_call_summary ?? '', signals: [], confidence: 0 } }
  },
  async getCalls(_offerCampaignId?: string): Promise<Call[]> {
    const calls = await apiClient.get<CallWire[]>('/calls')
    return (calls ?? []).map(toCall)
  },
  async getCall(_offerCampaignId: string, callId: string): Promise<CallDetail> {
    const call = await apiClient.get<CallWire>(`/calls/${callId}`)
    const base = toCall(call)
    return {
      ...base,
      keyMoments: [],
      signals: [],
      confidence: 0,
      transcript: call.transcript ? parseTranscript(call.transcript) : [],
    }
  },
  async getBookings(_offerCampaignId?: string): Promise<Booking[]> {
    return apiClient.get<Booking[]>('/bookings')
  },
  async getRecordings(offerCampaignId: string): Promise<Recording[]> {
    const recordings = await apiClient.get<RecordingWire[]>('/recordings')
    return (recordings ?? []).map((r) => toRecording(r, offerCampaignId))
  },
  async getCampaignFunnel(_offerCampaignId: string): Promise<CampaignFunnelStage[]> {
    return apiClient.get<CampaignFunnelStage[]>(`/offers/${_offerCampaignId}/funnel`)
  },
  async getCampaignHealthSnapshot(_offerCampaignId: string): Promise<CampaignHealthSnapshot> {
    return apiClient.get<CampaignHealthSnapshot>(`/offers/${_offerCampaignId}/health`)
  },
  async getCampaignInsights(_offerCampaignId: string): Promise<CampaignInsight[]> {
    return apiClient.get<CampaignInsight[]>(`/offers/${_offerCampaignId}/insights`)
  },
  async getCampaignAlerts(_offerCampaignId: string): Promise<CampaignAttentionAlert[]> {
    return apiClient.get<CampaignAttentionAlert[]>(`/offers/${_offerCampaignId}/alerts`)
  },
  async getCampaignPerformance(_offerCampaignId: string, _days: 7 | 14 | 30 = 14): Promise<CampaignPerformancePoint[]> {
    return apiClient.get<CampaignPerformancePoint[]>(`/offers/${_offerCampaignId}/performance?days=${_days}`)
  },
  async getCampaignAnalytics(_offerCampaignId: string, _filters: AnalyticsFilters): Promise<CampaignAnalyticsData> {
    return apiClient.get<CampaignAnalyticsData>(`/campaigns/${_offerCampaignId}/analytics`)
  },

  // --- Agents / integrations ----------------------------------------------
  async getAgents(): Promise<Agent[]> {
    const agents = await apiClient.get<AgentWire[]>('/agents')
    return (agents ?? []).map(toAgent)
  },
  async getIntegrations(): Promise<Integration[]> {
    return apiClient.get<Integration[]>('/integrations')
  },
  async updateAgent(id: string, patch: Partial<Agent>): Promise<Agent> {
    const wire = await apiClient.put<AgentWire>(`/agents/${id}`, agentPatch(patch))
    return toAgent(wire)
  },
  async createAgent(patch: Partial<Agent>): Promise<Agent> {
    const wire = await apiClient.post<AgentWire>('/agents', agentPatch(patch))
    return toAgent(wire)
  },
  async deleteAgent(id: string): Promise<void> {
    await apiClient.delete(`/agents/${id}`)
  },
  async listAgentVoices(): Promise<AgentVoiceOption[]> {
    const res = await apiClient.get<AgentsVoicesWire>('/agents/voices')
    return res?.voices ?? []
  },
  async listAgentModels(): Promise<AgentModels> {
    return apiClient.get<AgentModels>('/agents/models')
  },

  // --- Settings / connections ----------------------------------------------
  async getSettings(): Promise<AppSettings> {
    return apiClient.get<AppSettings>('/settings')
  },
  async saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    return apiClient.put<AppSettings>('/settings', patch)
  },
  async getConnections(): Promise<ConnectionsState> {
    return apiClient.get<ConnectionsState>('/connections')
  },
  async saveConnection(patch: Record<string, string>): Promise<ConnectionsState> {
    return apiClient.put<ConnectionsState>('/connections', patch)
  },
  async disconnectConnection(key: ConnectionKey): Promise<ConnectionsState> {
    return apiClient.delete<ConnectionsState>(`/connections/${key}`)
  },
  async getTwilioNumbers(): Promise<TwilioNumber[]> {
    const res = await apiClient.get<TwilioNumbersWire>('/twilio-numbers')
    return res?.numbers ?? []
  },
  async saveTwilioNumber(n: Partial<TwilioNumber> & { id?: string }): Promise<TwilioNumber[]> {
    const res = n.id
      ? await apiClient.put<TwilioNumbersWire>(`/twilio-numbers/${n.id}`, n)
      : await apiClient.post<TwilioNumbersWire>('/twilio-numbers', n)
    return res?.numbers ?? []
  },
  async removeTwilioNumber(id: string): Promise<TwilioNumber[]> {
    const res = await apiClient.delete<TwilioNumbersWire>(`/twilio-numbers/${id}`)
    return res?.numbers ?? []
  },
  async getSettingsSchema(): Promise<SettingsSchemaField[]> {
    const res = await apiClient.get<SettingsSchemaWire>('/settings/schema')
    return res?.fields ?? []
  },
  async getRuntimeSettings(): Promise<Record<string, unknown>> {
    return apiClient.get<Record<string, unknown>>('/settings')
  },
  async saveSettingsSchema(patch: Record<string, unknown>): Promise<void> {
    await apiClient.put('/settings', patch)
  },
  async getFishVoices(): Promise<FishVoice[]> {
    const res = await apiClient.get<FishVoicesWire>('/fish-voices')
    return res?.voices ?? []
  },
  async addFishVoice(v: FishVoice): Promise<FishVoice[]> {
    const res = await apiClient.post<FishVoicesWire>('/fish-voices', v)
    return res?.voices ?? []
  },
  async removeFishVoice(referenceId: string): Promise<FishVoice[]> {
    const res = await apiClient.delete<FishVoicesWire>(`/fish-voices/${referenceId}`)
    return res?.voices ?? []
  },

  // --- Pronunciation lexicon (already wired) --------------------------------
  async listPronunciationAgents(): Promise<PronunciationAgentOption[]> {
    const agents = await apiClient.get<AgentWire[]>('/agents')
    return (agents ?? []).map((a) => ({ agentId: a.agent_id, name: a.name }))
  },
  async getGlobalLexicon(): Promise<PronunciationLexiconEntry[]> {
    const cfg = await apiClient.get<PronunciationConfigDto>('/agent/config')
    return ensureEntryIds(cfg.pronunciation_lexicon ?? [])
  },
  async saveGlobalLexicon(entries: PronunciationLexiconEntry[]): Promise<void> {
    await apiClient.put('/agent/config', { pronunciation_lexicon: stripEntryIds(entries) })
  },
  async getAgentLexicon(agentId: string): Promise<PronunciationLexiconEntry[]> {
    const agent = await apiClient.get<AgentWire>(`/agents/${agentId}`)
    return ensureEntryIds(agent.pronunciation_lexicon ?? [])
  },
  async saveAgentLexicon(agentId: string, entries: PronunciationLexiconEntry[]): Promise<void> {
    await apiClient.put(`/agents/${agentId}`, { pronunciation_lexicon: stripEntryIds(entries) })
  },
  async transcribePronunciation(file: File, language?: string): Promise<TranscribePronunciationReply> {
    const form = new FormData()
    form.append('file', file)
    if (language) form.append('language', language)
    return apiClient.upload<TranscribePronunciationReply>('/agent/pronunciation/transcribe', form)
  },

  // --- Analytics / activity --------------------------------------------------
  async getAnalytics(): Promise<Analytics> {
    return apiClient.get<Analytics>('/analytics')
  },
  async getActivity(limit = 7): Promise<Activity[]> {
    return apiClient.get<Activity[]>(`/activity?limit=${limit}`)
  },
  async getAttentionItems(): Promise<AttentionItem[]> {
    return apiClient.get<AttentionItem[]>('/attention')
  },
  async getAdminOverview(): Promise<Record<string, number>> {
    return apiClient.get<Record<string, number>>('/admin/overview')
  },

  // --- Admin review / approvals ----------------------------------------------
  async getAdminMeta(offerCampaignId: string): Promise<AdminCampaignMeta> {
    return apiClient.get<AdminCampaignMeta>(`/admin/campaigns/${offerCampaignId}/meta`)
  },
  async getAllAdminMeta(): Promise<AdminCampaignMeta[]> {
    return apiClient.get<AdminCampaignMeta[]>('/admin/campaigns/meta')
  },
  async getCampaignReview(offerCampaignId: string): Promise<CampaignReviewData> {
    return apiClient.get<CampaignReviewData>(`/admin/campaigns/${offerCampaignId}/review`)
  },
  async getCampaignAudit(offerCampaignId: string): Promise<AuditEvent[]> {
    return apiClient.get<AuditEvent[]>(`/admin/campaigns/${offerCampaignId}/audit`)
  },
  async getAdminNotifications(): Promise<AdminNotification[]> {
    return apiClient.get<AdminNotification[]>('/admin/notifications')
  },
  async markAdminNotificationsRead(): Promise<void> {
    await apiClient.post('/admin/notifications/read')
  },
  async getAdminUnreadCount(): Promise<number> {
    const res = await apiClient.get<{ count?: number }>('/admin/notifications/unread-count')
    return res?.count ?? 0
  },
  async approveCampaign(id: string): Promise<void> {
    await apiClient.post(`/admin/campaigns/${id}/approve`)
  },
  async rejectCampaign(id: string, reason: string): Promise<void> {
    await apiClient.post(`/admin/campaigns/${id}/reject`, { reason })
  },
  async requestCampaignChanges(id: string, message: string): Promise<void> {
    await apiClient.post(`/admin/campaigns/${id}/request-changes`, { message })
  },
  async completeCampaignTraining(id: string, score: number): Promise<void> {
    await apiClient.post(`/admin/campaigns/${id}/training/complete`, { score })
  },
  async startCampaignTraining(id: string): Promise<void> {
    await apiClient.post(`/admin/campaigns/${id}/training/start`)
  },
  async getTrainingCampaigns(): Promise<{ offerCampaignId: string; status: TrainingStatus }[]> {
    return apiClient.get<{ offerCampaignId: string; status: TrainingStatus }[]>('/admin/training/campaigns')
  },
  async updateCampaign(id: string, patch: Partial<OfferCampaign>): Promise<OfferCampaign> {
    const wire = await apiClient.put<OfferWire>(`/offers/${id}`, {
      title: patch.offerName ?? patch.name,
      description: patch.criteria?.other,
    })
    return toCampaign(wire)
  },
  async getClient(id: string): Promise<Client | undefined> {
    return apiClient.get<Client>(`/admin/clients/${id}`)
  },

  // --- AI Command Center ------------------------------------------------------
  async getAIOverview(_clientId?: string): Promise<AICommandOverview> {
    return apiClient.get<AICommandOverview>('/ai/overview')
  },
  async getAIActivity(_limit?: number): Promise<AIActivityEvent[]> {
    return apiClient.get<AIActivityEvent[]>('/ai/activity')
  },
  async getAIConversations(_filters?: AICommandFilters): Promise<AIConversationSummary[]> {
    return apiClient.get<AIConversationSummary[]>('/ai/conversations')
  },
  async getAIConversation(id: string): Promise<AIConversationDetail> {
    return apiClient.get<AIConversationDetail>(`/ai/conversations/${id}`)
  },
  async getAIObjections(): Promise<AIObjection[]> {
    return apiClient.get<AIObjection[]>('/ai/objections')
  },
  async getAILearningPatterns(): Promise<AILearningPattern[]> {
    return apiClient.get<AILearningPattern[]>('/ai/learning/patterns')
  },
  async getAIImprovements(): Promise<AIImprovement[]> {
    return apiClient.get<AIImprovement[]>('/ai/learning/improvements')
  },
  async getAIFollowUps(): Promise<AIFollowUp[]> {
    return apiClient.get<AIFollowUp[]>('/ai/follow-ups')
  },
  async getAIEscalations(): Promise<AIEscalation[]> {
    return apiClient.get<AIEscalation[]>('/ai/escalations')
  },
  async getAIBookings(): Promise<AIBookingConversation[]> {
    return apiClient.get<AIBookingConversation[]>('/ai/bookings')
  },
  async getAIInsights(): Promise<AIInsight[]> {
    return apiClient.get<AIInsight[]>('/ai/insights')
  },
  async getAIHealth(): Promise<AIHealthSnapshot> {
    return apiClient.get<AIHealthSnapshot>('/ai/health')
  },
  async getAIAgentProfile(id: string): Promise<AIAgentProfile> {
    return apiClient.get<AIAgentProfile>(`/ai/agents/${id}`)
  },
  async getAIPerformance(): Promise<AIPerformanceSnapshot> {
    return apiClient.get<AIPerformanceSnapshot>('/ai/performance')
  },
  async searchAI(q: string): Promise<{ conversations: AIConversationSummary[]; leads: Lead[] }> {
    return apiClient.get<{ conversations: AIConversationSummary[]; leads: Lead[] }>(`/ai/search?q=${encodeURIComponent(q)}`)
  },
  async markConversationViewed(id: string): Promise<void> {
    await apiClient.post(`/ai/conversations/${id}/viewed`)
  },
  async addSimulatedActivity(event: AIActivityEvent): Promise<void> {
    await apiClient.post('/ai/activity', event)
  },

  // --- Lead Intelligence Hub ---------------------------------------------------
  async getAllLeads(_clientId?: string): Promise<EnrichedLead[]> {
    const res = await apiClient.get<{ leads?: LeadWire[] }>('/leads')
    return (res?.leads ?? []).map((l) => ({
      ...toLead(l),
      campaignName: '',
      intent: 'unknown',
      intentLabel: 'Unknown',
    }))
  },
  async getLeadHubMetrics(): Promise<LeadHubMetrics> {
    return apiClient.get<LeadHubMetrics>('/leads/metrics')
  },
  async getLeadHubStats(_leads?: EnrichedLead[]): Promise<LeadHubStats> {
    const wire = await apiClient.get<LeadHubStatsWire>('/leads/stats')
    return {
      statusDistribution: (wire.status_distribution ?? []).map((s) => ({ status: s.status, count: s.count })),
      qualityDistribution: (wire.quality_distribution ?? []).map((q) => ({ range: q.range, percent: q.percent })),
      sources: (wire.sources ?? []).map((s) => ({ campaignName: s.campaign_name, percent: s.percent })),
    }
  },
  async getLeadSegments(): Promise<LeadSegment[]> {
    return apiClient.get<LeadSegment[]>('/leads/segments')
  },
  async filterLeads(leads: EnrichedLead[], filters: LeadHubFilters): Promise<EnrichedLead[]> {
    const search = filters.search.trim().toLowerCase()
    return leads.filter((l) => {
      if (search && !`${l.name} ${l.company} ${l.industry}`.toLowerCase().includes(search)) return false
      if (filters.status && filters.status !== 'all' && l.status !== filters.status) return false
      if (filters.industry && l.industry !== filters.industry) return false
      if (filters.minScore !== undefined && l.score < filters.minScore) return false
      if (filters.maxScore !== undefined && l.score > filters.maxScore) return false
      return true
    })
  },
  async getLeadIntelligence(leadId: string): Promise<LeadIntelligenceProfile | undefined> {
    return apiClient.get<LeadIntelligenceProfile>(`/leads/${leadId}/intelligence`)
  },
  async findLead(leadId: string): Promise<EnrichedLead | undefined> {
    const wire = await apiClient.get<LeadWire>(`/leads/${leadId}`)
    return {
      ...toLead(wire),
      campaignName: '',
      intent: 'unknown',
      intentLabel: 'Unknown',
    }
  },
  async getRecommendedLeads(limit = 5): Promise<EnrichedLead[]> {
    return apiClient.get<EnrichedLead[]>(`/leads/recommended?limit=${limit}`)
  },
  async getPriorityLeads(limit = 5): Promise<{ lead: EnrichedLead; reason: string }[]> {
    return apiClient.get<{ lead: EnrichedLead; reason: string }[]>(`/leads/priority?limit=${limit}`)
  },
  async getLeadNotes(leadId: string): Promise<LeadNote[]> {
    return apiClient.get<LeadNote[]>(`/leads/${leadId}/notes`)
  },
  async addLeadNote(leadId: string, text: string): Promise<LeadNote> {
    return apiClient.post<LeadNote>(`/leads/${leadId}/notes`, { text })
  },
  async updateLeadNote(leadId: string, noteId: string, text: string): Promise<void> {
    await apiClient.patch(`/leads/${leadId}/notes/${noteId}`, { text })
  },
  async deleteLeadNote(leadId: string, noteId: string): Promise<void> {
    await apiClient.delete(`/leads/${leadId}/notes/${noteId}`)
  },
  async getLeadTags(leadId: string): Promise<string[]> {
    return apiClient.get<string[]>(`/leads/${leadId}/tags`)
  },
  async toggleLeadTag(leadId: string, tag: string): Promise<string[]> {
    return apiClient.post<string[]>(`/leads/${leadId}/tags/toggle`, { tag })
  },
  async setLeadStatus(leadId: string, status: LeadStatus): Promise<void> {
    // BE expects form-encoded POST /leads/{id}/status {new_status, changed_by}
    const body = new URLSearchParams({ new_status: toBeLeadStatus(status), changed_by: 'admin' })
    await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/leads/${leadId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  },

  // --- Lead selection (client-side UI state) -----------------------------------
  getSelectedLeadIds(): string[] {
    return Array.from(selectedLeadIds)
  },
  toggleLeadSelection(id: string): void {
    if (selectedLeadIds.has(id)) selectedLeadIds.delete(id)
    else selectedLeadIds.add(id)
  },
  clearLeadSelection(): void {
    selectedLeadIds.clear()
  },
  selectAllLeads(ids: string[]): void {
    for (const id of ids) selectedLeadIds.add(id)
  },
}

// ---------------------------------------------------------------------------
// Mapping helpers (declared after the object; hoisted function declarations).
// ---------------------------------------------------------------------------

function agentPatch(patch: Partial<Agent>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (patch.name !== undefined) out.name = patch.name
  if (patch.voice !== undefined) out.voice = patch.voice
  if (patch.language !== undefined) out.language = patch.language
  if (patch.role !== undefined) out.role = patch.role
  if (patch.identity !== undefined) out.identity = patch.identity
  if (patch.audio_model !== undefined) out.audio_model = patch.audio_model
  if (patch.transcription_model !== undefined) out.transcription_model = patch.transcription_model
  return out
}

function toCall(wire: CallWire): Call {
  const id = String(wire.call_id ?? wire.id ?? '')
  return {
    id,
    offerCampaignId: wire.offer_id ?? '',
    leadId: wire.lead_id ?? '',
    agentId: wire.agent_id ?? '',
    startedAt: wire.started_at ?? wire.created_at ?? '',
    durationSec: wire.duration_sec ?? wire.duration ?? 0,
    outcome: mapCallOutcome(wire.last_call_outcome ?? wire.outcome),
    sentiment: 'neutral',
    recordingUrl: wire.recording_url ?? wire.audio_url,
    summary: wire.last_call_summary ?? wire.summary ?? '',
  }
}

function mapCallOutcome(be: string | undefined): Call['outcome'] {
  switch (be?.toUpperCase()) {
    case 'BOOKED':
    case 'BOOKED_NO_EMAIL':
      return 'booked'
    case 'NOT_INTERESTED':
    case 'DO_NOT_CALL':
      return 'not_interested'
    case 'NOT_ANSWERED':
      return 'no_answer'
    case 'VOICEMAIL':
      return 'voicemail'
    case 'CALLBACK_REQUESTED':
    case 'CALL_SCHEDULED':
      return 'callback'
    case 'DETAILS_EMAIL':
    case 'DETAILS_WHATSAPP':
      return 'details_requested'
    case 'ANSWERED':
      return 'interested'
    case 'WRONG_NUMBER':
      return 'declined'
    default:
      return 'unknown'
  }
}

function parseTranscript(raw: string): CallDetail['transcript'] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((m) => m && typeof m.text === 'string')
        .map((m) => ({ speaker: m.speaker === 'lead' ? 'lead' : 'ai', text: m.text }))
    }
  } catch {
    /* fall through */
  }
  return raw ? [{ speaker: 'ai', text: raw }] : []
}

function toRecording(wire: RecordingWire, offerCampaignId: string): Recording {
  const id = String(wire.recording_id ?? wire.id ?? '')
  return {
    id,
    offerCampaignId: wire.offer_id ?? offerCampaignId,
    leadId: wire.lead_id ?? '',
    agentId: wire.agent_id ?? '',
    startedAt: wire.created_at ?? '',
    durationSec: wire.duration_sec ?? wire.duration ?? 0,
    outcome: mapCallOutcome(wire.outcome),
    sentiment: 'neutral',
    recordingUrl: wire.audio_url,
    summary: wire.summary ?? '',
    leadName: wire.lead_name ?? '',
    leadCompany: wire.lead_company ?? '',
    keyMoments: [],
    signals: [],
    confidence: 0,
    transcript: [],
  }
}

export type Repository = typeof httpRepository
