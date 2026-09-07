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
import { env } from '@/config/environment'
import { ensureEntryIds, stripEntryIds } from '@/lib/pronunciation'
import type { Agent, OfferCampaign, User, Client, ClientInput, ClientPage, Lead, Call, Booking, CallDetail, LeadDetail, Recording, CallHistoryEntry, CampaignFunnelStage, CampaignInsight, CampaignAttentionAlert, CampaignPerformancePoint, CampaignHealthSnapshot, CampaignHealth, Analytics, Activity, AttentionItem, Integration, LeadStatus, Meeting, WorkspaceAnalytics } from '@/types'
import type { AppSettings, ConnectionsState, ConnectionKey, TwilioNumber, FishVoice, SettingsSchemaField, AgentModels, AgentVoiceOption, AgentRole } from '@/types/settings'
import type { AdminCampaignMeta, AdminLead, CampaignReviewData, AuditEvent, AdminNotification, ActivityLogEntry, ActivitySource, ReviewCampaignContent } from '@/types/admin'
import type { CampaignAnalyticsData, AnalyticsFilters } from '@/types/campaignAnalytics'
import type { EnrichedLead, LeadHubMetrics, LeadHubStats, LeadSegment, LeadHubFilters, LeadIntelligenceProfile, LeadNote } from '@/types/leadIntelligence'
import type { AICommandOverview, AIActivityEvent, AIConversationSummary, AIConversationDetail, AIObjection, AILearningPattern, AIImprovement, AIFollowUp, AIEscalation, AIBookingConversation, AIInsight, AIHealthSnapshot, AIAgentProfile, AIPerformanceSnapshot, AICommandFilters } from '@/types/aiCommand'
import type { CampaignDraft } from '@/types/campaignDraft'
import type { PronunciationAgentOption, PronunciationConfigDto, PronunciationLexiconEntry, TranscribePronunciationReply } from '@/types/pronunciation'
import type { AcceptTrainingSuggestionInput, AcceptTrainingSuggestionResult, TrainingCampaignRow, TrainingSuggestion, TrainingTalkCompleteResult, TrainingTalkTurn } from '@/types/training'
import type { LeadGenerateRequest, LeadImportResult, SmartSearchRequest, SmartSearchResponse } from '@/types/leadGeneration'
import type { CostBalance, CostEvent, CostPricing, CostSummary } from '@/types/costs'
import type { AdminUser, AdminUserCreateInput, AdminUserUpdateInput, PermissionCatalog, PermissionDescriptor, PermissionRoleDescriptor } from '@/types/admin'

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
  client_id?: string
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
  campaign_content?: ReviewCampaignContent
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
  started_at?: string
  duration?: number
  duration_sec?: number
  outcome?: string
  call_outcome?: string
  summary?: string
  audio_url?: string
  lead_name?: string
  lead_company?: string
  phone?: string
  transcript?: string
}

interface BookingWire {
  lead_id: string
  lead_name?: string
  meeting_link?: string
  meeting_created_at?: string
  offer_id?: string
  offer?: string
  contact_name?: string
  email?: string
  phone?: string
  lead_status?: string
}

interface WorkspaceAnalyticsWire {
  offers?: number
  leads?: number
  verified?: number
  meetings_booked?: number
  calls?: number
  cost_events?: number
  spend_usd?: number
  conversion_rate?: number
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

interface ActivityLogWire {
  id: string
  source: string
  kind: string
  action: string
  actor: string
  target_type?: string
  target_id?: string
  target?: string
  description?: string
  offer_id?: string
  timestamp?: string
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

function toAdminLead(wire: LeadWire): AdminLead {
  return {
    ...toLead(wire),
    campaignName: wire.offer ?? '',
    lastCallOutcome: wire.last_call_outcome ?? '',
    lastCallSummary: wire.last_call_summary ?? '',
    meetingLink: wire.meeting_link ?? '',
    notes: wire.notes ?? '',
    verificationStatus: wire.verification_status ?? 'UNVERIFIED',
    createdAt: wire.created_at ?? '',
  }
}

function toCampaign(wire: OfferWire): OfferCampaign {
  const leadCount = wire.lead_count ?? 0
  const status = leadCount > 0 ? 'active' : 'draft'
  // Admin review content (stored on the offer as campaign_content) carries the
  // targeting/budget the review screen edits; map it onto the FE campaign shape.
  const content = wire.campaign_content
  const targeting = content?.targeting
  const budget = content?.budget
  const criteria: OfferCampaign['criteria'] = {
    industry: targeting?.industry ?? '',
    companySize: targeting?.companySize ?? '',
    decisionMakers: targeting?.decisionMakers ?? [],
    ageRange: targeting?.ageRange ?? '',
    location: targeting?.location ?? '',
    ...(targeting?.other ? { other: targeting.other } : {}),
  }
  return {
    id: wire.id,
    clientId: wire.client_id ?? '',
    name: wire.name || wire.title,
    offerName: wire.title,
    valueProposition: wire.value_proposition || wire.description || '',
    status,
    stage: status === 'active' ? 'calling' : 'onboarding',
    targetAudience: targeting ? [targeting.industry, targeting.companySize].filter(Boolean).join(' · ') : '',
    geography: targeting?.location ?? '',
    criteria,
    budget: {
      total: budget?.total ?? 0,
      used: 0,
      daily: budget?.daily ?? 0,
      currency: 'USD',
      expectedDurationDays: budget?.expectedDurationDays ?? 0,
    },
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
  async getClients(params?: { q?: string; page?: number; pageSize?: number }): Promise<ClientPage> {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('page_size', String(params.pageSize))
    const wire = await apiClient.get<{ items?: Client[]; total?: number; page?: number; page_size?: number }>(`/admin/clients?${qs.toString()}`)
    return {
      items: wire?.items ?? [],
      total: wire?.total ?? 0,
      page: wire?.page ?? 1,
      pageSize: wire?.page_size ?? 20,
    }
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
      phone: '', // OfferIn requires phone; a campaign/offer has no phone of its own
    })
    return toCampaign(created)
  },
  async createCampaign(input: { name: string; offerName?: string; description?: string; category?: string; company?: string; clientId?: string }): Promise<OfferCampaign> {
    const created = await apiClient.post<OfferWire>('/offers', {
      title: input.name,
      description: input.description ?? '',
      value_proposition: input.offerName ?? input.name,
      category: input.category ?? '',
      company: input.company ?? '',
      client_id: input.clientId ?? '',
      agent_id: '',
      phone: '', // OfferIn requires phone; a campaign/offer has no phone of its own
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
  async generateLeads(request: LeadGenerateRequest): Promise<LeadImportResult> {
    return apiClient.post<LeadImportResult>('/leads/generate', request)
  },
  async smartSearch(request: SmartSearchRequest): Promise<SmartSearchResponse> {
    return apiClient.post<SmartSearchResponse>('/leads/smart-search', request)
  },
  async getAdminLeads(): Promise<AdminLead[]> {
    // Platform-wide inventory: all leads across every campaign. The backend
    // caps /leads at limit=100 by default, so request the same high ceiling
    // the CSV export uses to mean "all" (see backend route_export_leads_csv).
    const res = await apiClient.get<{ leads?: LeadWire[]; total?: number }>('/leads?limit=10000')
    return (res?.leads ?? []).map(toAdminLead)
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
  async getMeetings(): Promise<Meeting[]> {
    const rows = await apiClient.get<BookingWire[]>('/bookings')
    return (rows ?? []).map((m) => ({
      id: m.lead_id,
      offerCampaignId: m.offer_id ?? '',
      leadName: m.lead_name ?? '',
      contactName: m.contact_name ?? '',
      email: m.email ?? '',
      phone: m.phone ?? '',
      offer: m.offer ?? '',
      meetingLink: m.meeting_link ?? '',
      scheduledAt: m.meeting_created_at ?? '',
    }))
  },
  async exportLeadsCsv(language: 'en' | 'he' = 'en', offerId?: string): Promise<void> {
    const qs = new URLSearchParams({ language })
    if (offerId) qs.set('offer_id', offerId)
    await apiClient.download(`/leads/export/csv?${qs.toString()}`, `leads_export_${language}.csv`)
  },
  async getRecordings(offerCampaignId: string): Promise<Recording[]> {
    const res = await apiClient.get<{ recordings?: RecordingWire[] }>('/recordings')
    return (res?.recordings ?? []).map((r) => toRecording(r, offerCampaignId))
  },
  async getCallHistory(): Promise<CallHistoryEntry[]> {
    const res = await apiClient.get<{ recordings?: RecordingWire[] }>('/recordings')
    return (res?.recordings ?? []).map(toCallHistoryEntry)
  },
  async getCampaignFunnel(_offerCampaignId: string): Promise<CampaignFunnelStage[]> {
    const res = await apiClient.get<{ stages?: { id: string; label: string; count: number; conversion_from_prev?: number | null }[] }>(`/offers/${_offerCampaignId}/funnel`)
    return (res?.stages ?? []).map((s) => ({
      id: s.id,
      label: s.label,
      count: s.count,
      conversionFromPrev: s.conversion_from_prev ?? undefined,
    }))
  },
  async getCampaignHealthSnapshot(_offerCampaignId: string): Promise<CampaignHealthSnapshot> {
    const res = await apiClient.get<{ overall?: CampaignHealthSnapshot['overall']; lead_quality?: CampaignHealthSnapshot['leadQuality']; booking_rate?: number; message?: string }>(`/offers/${_offerCampaignId}/health`)
    const br = res?.booking_rate ?? 0
    return {
      overall: res?.overall ?? 'fair',
      aiPerformance: 'good',
      leadQuality: res?.lead_quality ?? 'moderate',
      bookingRate: br >= 0.2 ? 'above_target' : br >= 0.1 ? 'on_target' : 'below_target',
      budgetEfficiency: 'healthy',
      message: res?.message ?? '',
    }
  },
  async getCampaignInsights(_offerCampaignId: string): Promise<CampaignInsight[]> {
    return apiClient.get<CampaignInsight[]>(`/offers/${_offerCampaignId}/insights`)
  },
  async getCampaignAlerts(_offerCampaignId: string): Promise<CampaignAttentionAlert[]> {
    return apiClient.get<CampaignAttentionAlert[]>(`/offers/${_offerCampaignId}/alerts`)
  },
  async getCampaignPerformance(_offerCampaignId: string, _days: 7 | 14 | 30 = 14): Promise<CampaignPerformancePoint[]> {
    const res = await apiClient.get<{ points?: { date: string; leads: number; meetings_booked?: number }[] }>(`/offers/${_offerCampaignId}/performance?days=${_days}`)
    return (res?.points ?? []).map((p) => ({ date: p.date, leads: p.leads, calls: 0, bookings: p.meetings_booked ?? 0 }))
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
    return (agents ?? []).map((a) => ({ agentId: a.agent_id, name: a.name, voice: a.voice ?? '' }))
  },
  async previewVoice(text: string, voice: string, language: string, model = ''): Promise<{ audioUrl: string }> {
    const res = await apiClient.post<{ audio_path?: string; audio_url?: string }>('/agents/preview-voice', {
      text,
      voice,
      language,
      model,
    })
    // @backend returns an explicit playable path (audio_url) when landed;
    // until then derive /audio/<basename> from the server-side audio_path.
    const playable =
      res?.audio_url || (res?.audio_path ? `/audio/${res.audio_path.split(/[\\/]/).pop()}` : '')
    return { audioUrl: mediaUrl(playable) }
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

  // --- Costs -----------------------------------------------------------------
  async getCostSummary(since?: string): Promise<CostSummary> {
    return apiClient.get<CostSummary>(`/costs/summary${since ? `?since=${encodeURIComponent(since)}` : ''}`)
  },
  async getCostBalance(force = false): Promise<CostBalance> {
    return apiClient.get<CostBalance>(`/costs/balance${force ? '?force=true' : ''}`)
  },
  async getCostEvents(query: { operation?: string; since?: string; limit?: number } = {}): Promise<CostEvent[]> {
    const params = new URLSearchParams()
    if (query.operation) params.set('operation', query.operation)
    if (query.since) params.set('since', query.since)
    if (query.limit) params.set('limit', String(query.limit))
    const qs = params.toString()
    const res = await apiClient.get<{ events?: CostEvent[] }>(`/costs/events${qs ? `?${qs}` : ''}`)
    return res?.events ?? []
  },
  async getCostPricing(): Promise<CostPricing> {
    return apiClient.get<CostPricing>('/costs/pricing')
  },

  // --- Analytics / activity --------------------------------------------------
  async getAnalytics(): Promise<Analytics> {
    return apiClient.get<Analytics>('/analytics')
  },
  async getWorkspaceAnalytics(): Promise<WorkspaceAnalytics> {
    const w = await apiClient.get<WorkspaceAnalyticsWire>('/analytics')
    return {
      offers: w?.offers ?? 0,
      leads: w?.leads ?? 0,
      verified: w?.verified ?? 0,
      meetingsBooked: w?.meetings_booked ?? 0,
      calls: w?.calls ?? 0,
      costEvents: w?.cost_events ?? 0,
      spendUsd: w?.spend_usd ?? 0,
      conversionRate: w?.conversion_rate ?? 0,
    }
  },
  async getActivity(limit = 7): Promise<Activity[]> {
    return apiClient.get<Activity[]>(`/activity?limit=${limit}`)
  },
  async getActivityLog(filters: { source?: ActivitySource | 'all'; search?: string; limit?: number } = {}): Promise<ActivityLogEntry[]> {
    const params = new URLSearchParams()
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.source && filters.source !== 'all') params.set('source', filters.source)
    if (filters.search?.trim()) params.set('search', filters.search.trim())
    const qs = params.toString()
    const rows = await apiClient.get<ActivityLogWire[]>(`/activity${qs ? `?${qs}` : ''}`)
    return (rows ?? []).map((w) => ({
      id: w.id,
      source: (w.source as ActivitySource) ?? 'cost',
      kind: w.kind,
      action: w.action,
      actor: w.actor,
      targetType: w.target_type ?? '',
      targetId: w.target_id ?? '',
      target: w.target ?? '',
      description: w.description ?? '',
      offerId: w.offer_id ?? '',
      timestamp: w.timestamp ?? '',
    }))
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
  async getTrainingCampaigns(): Promise<TrainingCampaignRow[]> {
    return apiClient.get<TrainingCampaignRow[]>('/admin/training/campaigns')
  },
  /**
   * Submit a finished LIVE training talk. The backend grades the real
   * transcript (score is server-derived — a client score is never trusted),
   * advances the campaign training state, and harvests pronunciation
   * suggestions for review. conversation_id makes re-submits idempotent.
   */
  async completeTrainingTalk(
    id: string,
    input: {
      transcript: TrainingTalkTurn[]
      agentId?: string
      durationS?: number
      conversationId?: string
    },
  ): Promise<TrainingTalkCompleteResult> {
    return apiClient.post<TrainingTalkCompleteResult>(
      `/admin/campaigns/${id}/training/complete`,
      {
        transcript: input.transcript,
        agent_id: input.agentId ?? '',
        duration_s: input.durationS ?? 0,
        conversation_id: input.conversationId ?? '',
      },
    )
  },
  async getTrainingSuggestions(status: 'pending' | 'accepted' | 'dismissed' = 'pending'): Promise<TrainingSuggestion[]> {
    return apiClient.get<TrainingSuggestion[]>(`/admin/training/suggestions?status=${status}`)
  },
  async acceptTrainingSuggestion(
    suggestionId: string,
    input: AcceptTrainingSuggestionInput,
  ): Promise<AcceptTrainingSuggestionResult> {
    return apiClient.post<AcceptTrainingSuggestionResult>(
      `/admin/training/suggestions/${suggestionId}/accept`,
      {
        scope: input.scope,
        agent_id: input.agentId ?? '',
        word: input.word ?? '',
        pronounce_as: input.pronounceAs ?? '',
        language: input.language ?? '',
      },
    )
  },
  async dismissTrainingSuggestion(suggestionId: string): Promise<{ status: string }> {
    return apiClient.post<{ status: string }>(
      `/admin/training/suggestions/${suggestionId}/dismiss`,
    )
  },
  async setTrainingSuggestionTimestamp(suggestionId: string, seconds: number): Promise<{ timestampS: number }> {
    return apiClient.post<{ timestampS: number }>(
      `/admin/training/suggestions/${suggestionId}/timestamp`,
      { seconds },
    )
  },
  async updateCampaign(id: string, patch: Partial<OfferCampaign>): Promise<OfferCampaign> {
    const wire = await apiClient.put<OfferWire>(`/offers/${id}`, {
      title: patch.offerName ?? patch.name,
      description: patch.criteria?.other,
    })
    return toCampaign(wire)
  },
  /**
   * Save admin review edits on a campaign with one PUT /offers/{id} — the
   * offer-details columns (title/description/pitch/cta), the assigned agent
   * (agent_id) and/or the campaign_content subdoc (targeting/budget/booking).
   * Content is stored WHOLE: the review screen merges section edits against the
   * last stored snapshot (review.campaignContent) before calling this.
   */
  async updateCampaignOffer(
    id: string,
    input: {
      title?: string
      description?: string
      pitch?: string
      cta?: string
      agentId?: string
      content?: ReviewCampaignContent
    },
  ): Promise<OfferCampaign> {
    const body: Record<string, unknown> = {}
    if (input.title !== undefined) body.title = input.title
    if (input.description !== undefined) body.description = input.description
    if (input.pitch !== undefined) body.value_proposition = input.pitch
    if (input.cta !== undefined) body.cta = input.cta
    if (input.agentId !== undefined) body.agent_id = input.agentId
    if (input.content !== undefined) body.campaign_content = input.content
    const wire = await apiClient.put<OfferWire>(`/offers/${id}`, body)
    return toCampaign(wire)
  },
  async getClient(id: string): Promise<{ client: Client; campaigns: OfferCampaign[] } | undefined> {
    const wire = await apiClient.get<{ client?: Client; campaigns?: OfferWire[] }>(`/admin/clients/${id}`)
    if (!wire?.client) return undefined
    return { client: wire.client, campaigns: (wire.campaigns ?? []).map(toCampaign) }
  },
  async createClient(payload: ClientInput): Promise<Client> {
    return apiClient.post<Client>('/admin/clients', payload)
  },
  async updateClient(id: string, payload: Partial<ClientInput>): Promise<Client> {
    return apiClient.put<Client>(`/admin/clients/${id}`, payload)
  },

  // --- Admin users (M-0017) ----------------------------------------------------
  async listUsers(): Promise<AdminUser[]> {
    const res = await apiClient.get<AdminUserWire[]>('/admin/users')
    return (res ?? []).map(toUser)
  },
  async createUser(input: AdminUserCreateInput): Promise<AdminUser> {
    const wire = await apiClient.post<AdminUserWire>('/admin/users', {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      client_ids: input.clientIds,
      permissions: input.permissions ?? [],
    })
    return toUser(wire)
  },
  async updateUser(id: string, patch: AdminUserUpdateInput): Promise<AdminUser> {
    const body: Record<string, unknown> = {}
    if (patch.name !== undefined) body.name = patch.name
    if (patch.email !== undefined) body.email = patch.email
    if (patch.password !== undefined) body.password = patch.password
    if (patch.role !== undefined) body.role = patch.role
    if (patch.clientIds !== undefined) body.client_ids = patch.clientIds
    if (patch.permissions !== undefined) body.permissions = patch.permissions
    if (patch.active !== undefined) body.active = patch.active
    const wire = await apiClient.put<AdminUserWire>(`/admin/users/${id}`, body)
    return toUser(wire)
  },
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`)
  },

  // --- Permission catalog (Super Admin → Permissions) ------------------------
  async listPermissions(): Promise<PermissionCatalog> {
    const wire = await apiClient.get<{
      roles?: PermissionRoleDescriptor[]
      permissions?: PermissionDescriptor[]
    }>('/admin/permissions')
    return {
      roles: wire?.roles ?? [],
      permissions: wire?.permissions ?? [],
    }
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
  async updateLead(id: string, patch: Partial<Lead>): Promise<Lead> {
    return apiClient.put<Lead>(`/leads/${id}`, patch)
  },
  async addLead(input: {
    leadName: string
    offerId?: string
    industry?: string
    email?: string
    phone?: string
    contactName?: string
    notes?: string
  }): Promise<void> {
    await apiClient.post('/leads', {
      lead_name: input.leadName,
      offer_id: input.offerId ?? '',
      offer: '',
      industry: input.industry ?? '',
      emails: input.email ? [{ email: input.email }] : [],
      phone_numbers: input.phone ? [{ phone_number: input.phone }] : [],
      whatsapp_phone: '',
      contact_name: input.contactName ?? '',
      notes: input.notes ?? '',
      lead_status: 'NEW',
    })
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
  async verifyLead(leadId: string): Promise<void> {
    await apiClient.post(`/leads/${leadId}/verify`)
  },
  async manualVerifyLead(leadId: string, action: 'approve' | 'reject'): Promise<void> {
    await apiClient.post(`/leads/${leadId}/verify/manual`, { action })
  },
  async deleteLead(leadId: string): Promise<void> {
    await apiClient.delete(`/leads/${leadId}`)
  },
  async bulkDeleteLeads(leadIds: string[]): Promise<{ affected: number }> {
    if (leadIds.length === 0) return { affected: 0 }
    const res = await apiClient.post<{ action?: string; affected?: number }>('/leads/bulk', {
      action: 'delete',
      lead_ids: leadIds,
      changed_by: 'admin',
    })
    return { affected: res?.affected ?? 0 }
  },
  async bulkDeleteCampaigns(offerIds: string[]): Promise<{ affected: number; failed: number }> {
    return bulkDelete('/offers/bulk', offerIds)
  },
  async bulkDeleteClients(clientIds: string[]): Promise<{ affected: number; failed: number }> {
    return bulkDelete('/admin/clients/bulk', clientIds)
  },
  async bulkDeleteRecordings(recordingIds: string[]): Promise<{ affected: number; failed: number }> {
    return bulkDelete('/recordings/bulk', recordingIds)
  },
  async bulkDeleteActivity(eventIds: string[]): Promise<{ affected: number; failed: number }> {
    return bulkDelete('/activity/bulk', eventIds)
  },
  async dialLead(leadId: string, offerId = ''): Promise<{ callSid: string; to: string }> {
    const res = await apiClient.post<{ call_sid?: string; to?: string }>('/twilio/dial', {
      lead_id: leadId,
      offer_id: offerId,
      agent_id: '',
    })
    return { callSid: res?.call_sid ?? '', to: res?.to ?? '' }
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

/** Shared bulk-delete call: POST {ids} -> {deleted}. Nonexistent ids are skipped server-side. */
async function bulkDelete(path: string, ids: string[]): Promise<{ affected: number; failed: number }> {
  if (ids.length === 0) return { affected: 0, failed: 0 }
  const res = await apiClient.post<{ deleted?: number }>(path, { ids })
  const deleted = Math.min(res?.deleted ?? ids.length, ids.length)
  return { affected: deleted, failed: ids.length - deleted }
}

/**
 * Prefix a BE media path ("/audio/x.wav") with the API base so the <audio>
 * src is same-origin (/api/audio/x.wav) and carries the session cookie.
 * Raw relative paths must never reach an <audio> element (they would resolve
 * against the FE origin root and 404).
 */
function mediaUrl(path: string | undefined): string {
  if (!path) return ''
  return path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`
}

/** GET/POST/PUT /admin/users element (snake_case wire). */
interface AdminUserWire {
  id: string
  name: string
  email: string
  role: string
  client_ids?: string[]
  permissions?: string[]
  active?: boolean
  token_version?: number
  created_at?: string
}

function toUser(w: AdminUserWire): AdminUser {
  const role = w.role === 'super_admin' ? 'super_admin' : w.role === 'admin' ? 'admin' : 'client_user'
  return {
    id: w.id,
    name: w.name,
    email: w.email,
    role,
    clientIds: w.client_ids ?? [],
    permissions: role === 'admin' ? (w.permissions ?? []) : [],
    active: w.active ?? true,
    tokenVersion: w.token_version ?? 0,
    createdAt: w.created_at ?? '',
  }
}

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
    recordingUrl: mediaUrl(wire.recording_url ?? wire.audio_url),
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
    startedAt: wire.started_at ?? wire.created_at ?? '',
    durationSec: wire.duration_sec ?? wire.duration ?? 0,
    outcome: mapCallOutcome(wire.call_outcome ?? wire.outcome),
    sentiment: 'neutral',
    recordingUrl: mediaUrl(wire.audio_url),
    summary: wire.summary ?? '',
    leadName: wire.lead_name ?? '',
    leadCompany: wire.lead_company ?? '',
    phone: wire.phone ?? '',
    keyMoments: [],
    signals: [],
    confidence: 0,
    transcript: [],
  }
}

function toCallHistoryEntry(wire: RecordingWire): CallHistoryEntry {
  const id = String(wire.recording_id ?? wire.id ?? '')
  return {
    id,
    leadId: wire.lead_id ?? '',
    agentId: wire.agent_id ?? '',
    leadName: wire.lead_name ?? '',
    phone: wire.phone ?? '',
    outcome: wire.call_outcome ?? wire.outcome ?? '',
    durationSec: wire.duration_sec ?? wire.duration ?? 0,
    audioUrl: mediaUrl(wire.audio_url),
    transcript: wire.transcript ?? '',
    startedAt: wire.started_at ?? wire.created_at ?? '',
  }
}

export type Repository = typeof httpRepository
