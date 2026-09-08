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
import { apiClient, ApiError } from './client'
import { env } from '@/config/environment'
import { ensureEntryIds, stripEntryIds } from '@/lib/pronunciation'
import {
  buildTrainingProcessOperation,
  clearLocalTrainingProcessOperations,
  loadLocalTrainingProcessOperations,
  processRequestPath,
  removeLocalTrainingProcessOperation,
  updateLocalTrainingProcessOperationComment,
  upsertLocalTrainingProcessOperation,
} from '@/lib/trainingProcessOperationJournal'
import type { Agent, OfferCampaign, User, Client, ClientInput, ClientPage, ClientBudgetSummary, CampaignBudgetAddResult, Lead, Call, Booking, CallDetail, LeadDetail, Recording, CallHistoryEntry, CampaignFunnelStage, CampaignInsight, CampaignAttentionAlert, CampaignPerformancePoint, CampaignHealthSnapshot, CampaignHealth, Analytics, Activity, AttentionItem, Integration, LeadStatus, Meeting, WorkspaceAnalytics } from '@/types'
import type { AppSettings, ConnectionsState, ConnectionKey, TwilioNumber, FishVoice, SettingsSchemaField, AgentModels, AgentVoiceOption, AgentRole } from '@/types/settings'
import type { AdminCampaignMeta, AdminLead, CampaignReviewData, AuditEvent, AdminNotification, ActivityLogEntry, ActivitySource, ReviewCampaignContent } from '@/types/admin'
import type { CampaignAnalyticsData, AnalyticsFilters } from '@/types/campaignAnalytics'
import type { EnrichedLead, LeadHubMetrics, LeadHubStats, LeadSegment, LeadHubFilters, LeadIntelligenceProfile, LeadNote } from '@/types/leadIntelligence'
import type { AICommandOverview, AIActivityEvent, AIConversationSummary, AIConversationDetail, AIObjection, AILearningPattern, AIImprovement, AIFollowUp, AIEscalation, AIBookingConversation, AIInsight, AIHealthSnapshot, AIAgentProfile, AIPerformanceSnapshot, AICommandFilters } from '@/types/aiCommand'
import type { CampaignDraft } from '@/types/campaignDraft'
import type { PronunciationAgentOption, PronunciationConfigDto, PronunciationLexiconEntry, TranscribePronunciationReply } from '@/types/pronunciation'
import type { AcceptTrainingSuggestionInput, AcceptTrainingSuggestionResult, AgentMemoryRecord, BehaviorVersion, MemoryStatus, TrainingCampaignRow, TrainingExtractedData, TrainingProcessOperation, TrainingProcessOperationRunResult, TrainingRecordingComment, TrainingSessionResult, TrainingSuggestion, TrainingTalkCompleteResult, TrainingTalkSession, TrainingTalkTurn } from '@/types/training'
import type { CampaignType } from '@/lib/campaignTypes'
import { campaignTypeToSource, sourceToCampaignType } from '@/lib/campaignTypes'
import { resolveOperationalStatus } from '@/lib/campaignOperationalStatus'
import type { ImportPreviewResponse, LeadGenerateRequest, LeadImportResult, SmartSearchRequest, SmartSearchResponse } from '@/types/leadGeneration'
import type { CostBalance, CostEvent, CostPricing, CostSummary } from '@/types/costs'
import type { AdminUser, AdminUserCreateInput, AdminUserUpdateInput, PermissionCatalog, PermissionDescriptor, PermissionRoleDescriptor } from '@/types/admin'
import type { AvailabilityInstance, AvailabilityKind, AvailabilityRule, CalendarMeeting, GoogleIntegrationState, MeetingStatus as CalendarMeetingStatus } from '@/types/calendar'
import type { IntegrationHealthRecord, IntegrationProviderPatch, IntegrationProviderRow, IntegrationProvidersWire, IntegrationsHealthWire } from '@/types/leadSources'

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
  gen_country?: string
  gen_phone_type?: string
  gen_industry?: string
  gen_number_of_leads?: number
  lead_count?: number
  verification?: Record<string, number>
  approved_leads?: number
  contacted_leads?: number
  meetings_booked?: number
  conversion_rate?: number
  agent_name?: string
  user_paused?: boolean
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
  telegram_configured?: boolean
  telegram_masked?: string
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
  call_id?: string | number
  lead_id?: string
  offer_id?: string
  transcript_id?: string
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

/** Wire row for training-process operation log (BE may return snake_case). */
interface TrainingProcessOperationWire {
  operation_id?: string
  operationId?: string
  method?: string
  path?: string
  status?: number
  status_text?: string
  statusText?: string
  duration_ms?: number
  durationMs?: number
  response_preview?: string
  responsePreview?: string
  response_body?: Record<string, unknown> | unknown[] | null
  responseBody?: Record<string, unknown> | unknown[] | null
  model_comment?: string
  modelComment?: string
  created_at?: string
  createdAt?: string
  last_run_at?: string
  lastRunAt?: string
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
  title?: string
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

/** Feed-row → dashboard Activity shape. Exposes the campaign association
 * (BE wire `offer_id` → FE `offerCampaignId`) so feed entries can deep-link
 * into the campaign's activity view, and derives a tone from the row source
 * (same tones the ActivityTimeline uses for each stream). */
function toActivity(w: ActivityLogWire): Activity {
  const toneBySource: Record<string, Activity['tone']> = {
    audit: 'violet',
    cost: 'info',
    call: 'success',
  }
  return {
    id: w.id,
    kind: (w.kind ?? '') as Activity['kind'],
    title: w.title || w.action || '',
    description: w.description || '',
    offerCampaignId: w.offer_id || undefined,
    timestamp: w.timestamp ?? '',
    tone: toneBySource[w.source] ?? 'neutral',
  }
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
    telegram_configured: wire.telegram_configured ?? false,
    telegram_masked: wire.telegram_masked ?? '',
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
    verificationStatus: wire.verification_status ?? undefined,
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
  const isTraining = sourceToCampaignType(wire.source) === 'training'
  const baseStatus = isTraining
    ? 'awaiting_ai_training'
    : leadCount > 0
      ? 'active'
      : 'draft'
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
  const campaignBudget = {
    total: budget?.total ?? 0,
    used: 0,
    daily: budget?.daily ?? 0,
    currency: 'USD' as const,
    expectedDurationDays: budget?.expectedDurationDays ?? 0,
  }
  const draft: OfferCampaign = {
    id: wire.id,
    clientId: wire.client_id ?? '',
    name: wire.name || wire.title,
    offerName: wire.title,
    valueProposition: wire.value_proposition || wire.description || '',
    source: wire.source ?? '',
    leadGen: {
      country: wire.gen_country ?? '',
      phoneType: wire.gen_phone_type || 'mobile',
      industry: wire.gen_industry ?? '',
      numberOfLeads: wire.gen_number_of_leads ?? 10,
    },
    status: baseStatus,
    stage: isTraining ? 'ai_training' : baseStatus === 'active' ? 'calling' : 'onboarding',
    targetAudience: targeting ? [targeting.industry, targeting.companySize].filter(Boolean).join(' · ') : '',
    geography: targeting?.location ?? '',
    criteria,
    budget: campaignBudget,
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
    userPaused: wire.user_paused === true,
    createdAt: wire.created_at ?? '',
    lastActivityAt: wire.created_at ?? '',
    history: [],
  }
  return {
    ...draft,
    status: resolveOperationalStatus(draft),
  }
}

/**
 * Map the onboarding draft onto the `campaign_content` subdoc the admin
 * review edits (targeting/budget/booking/integrations). Keeps the exact
 * shapes toCampaign reads back (criteria/budget) and ReviewCampaignContent
 * declares, so a draft submitted from onboarding round-trips into the
 * campaign overview + admin review without loss.
 */
function campaignDraftToContent(draft: CampaignDraft): ReviewCampaignContent {
  return {
    targeting: {
      industry: draft.target.industries.join(', '),
      companySize: draft.target.companySize,
      decisionMakers: draft.target.decisionMakers,
      ageRange: `${draft.target.ageMin}-${draft.target.ageMax}`,
      location: draft.target.geographies.join(', '),
      ...(draft.target.additionalCriteria.trim() ? { other: draft.target.additionalCriteria.trim() } : {}),
    },
    budget: {
      total: draft.budget.total,
      daily: draft.budget.daily,
      currency: 'USD' as const,
      expectedDurationDays: draft.budget.durationDays,
    },
    booking: {
      titleTemplate: draft.booking.titleTemplate,
      email: draft.booking.email,
    },
    integrations: { ...draft.integrations },
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
  async getClientBudgetSummary(): Promise<ClientBudgetSummary> {
    return apiClient.get<ClientBudgetSummary>('/workspace/budget')
  },
  async topUpClientWallet(amount: number): Promise<ClientBudgetSummary> {
    return apiClient.post<ClientBudgetSummary>('/workspace/budget/top-up', { amount })
  },
  async getAdminClientBudget(clientId: string): Promise<ClientBudgetSummary> {
    return apiClient.get<ClientBudgetSummary>(`/admin/clients/${clientId}/budget`)
  },
  async depositClientWallet(clientId: string, amount: number): Promise<ClientBudgetSummary> {
    return apiClient.post<ClientBudgetSummary>(`/admin/clients/${clientId}/budget/deposit`, { amount })
  },
  async addCampaignBudget(
    campaignId: string,
    amount: number,
    fundFrom: 'wallet' | 'payment' = 'wallet',
  ): Promise<CampaignBudgetAddResult> {
    return apiClient.post<CampaignBudgetAddResult>(`/offers/${campaignId}/budget/add`, {
      amount,
      fundFrom,
    })
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
    // OfferIn does NOT accept campaign_content (extra fields are dropped by the
    // BE schema), so the six onboarding sections ride on a follow-up PUT — the
    // same /offers/{id} campaign_content path the admin review + edit flow use.
    return this.updateCampaignOffer(created.id, { content: campaignDraftToContent(draft) })
  },
  /** Edit an existing campaign from the onboarding flow — PUT /offers/{id} so
   * re-submitting never creates a duplicate; same payload shape as create. */
  async updateCampaignFromDraft(id: string, draft: CampaignDraft): Promise<OfferCampaign> {
    return this.updateCampaignOffer(id, {
      title: draft.offer.offerName,
      description: draft.offer.description,
      pitch: draft.offer.pitch,
      content: campaignDraftToContent(draft),
    })
  },
  async createCampaign(input: {
    name: string
    offerName?: string
    description?: string
    category?: string
    company?: string
    clientId?: string
    type?: CampaignType
    budget?: number
  }): Promise<OfferCampaign> {
    const created = await apiClient.post<OfferWire>('/offers', {
      title: input.name,
      description: input.description ?? '',
      value_proposition: input.offerName ?? input.name,
      category: input.category ?? '',
      company: input.company ?? '',
      client_id: input.clientId ?? '',
      agent_id: '',
      source: campaignTypeToSource(input.type ?? 'live'),
      phone: '', // OfferIn requires phone; a campaign/offer has no phone of its own
    })
    if (input.budget !== undefined && input.budget > 0) {
      return this.updateCampaignOffer(created.id, {
        content: { budget: { total: input.budget, currency: 'USD' } },
      })
    }
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
  async previewLeadsImport(file: File, offerId = ''): Promise<ImportPreviewResponse> {
    const form = new FormData()
    form.append('file', file)
    if (offerId) form.append('offer_id', offerId)
    return apiClient.upload<ImportPreviewResponse>('/leads/import/preview', form)
  },
  async importLeadsCsv(file: File, offerId = '', dedupMode = 'skip'): Promise<LeadImportResult> {
    const form = new FormData()
    form.append('file', file)
    if (offerId) form.append('offer_id', offerId)
    form.append('dedup_mode', dedupMode)
    return apiClient.upload<LeadImportResult>('/leads/import', form)
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
    const qs = offerCampaignId ? `?offer_id=${encodeURIComponent(offerCampaignId)}` : ''
    const res = await apiClient.get<{ recordings?: RecordingWire[] }>(`/recordings${qs}`)
    return (res?.recordings ?? []).map((r) => toRecording(r, offerCampaignId))
  },
  async getCallHistory(offerCampaignId?: string): Promise<CallHistoryEntry[]> {
    const qs = offerCampaignId ? `?offer_id=${encodeURIComponent(offerCampaignId)}` : ''
    const res = await apiClient.get<{ recordings?: RecordingWire[] }>(`/recordings${qs}`)
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
  async saveAgentTelegramConnection(agentId: string, telegramBotToken: string): Promise<Agent> {
    const wire = await apiClient.put<AgentWire>(`/agents/${agentId}/connections`, {
      telegram_bot_token: telegramBotToken,
    })
    return toAgent(wire)
  },
  async disconnectAgentTelegram(agentId: string): Promise<Agent> {
    const wire = await apiClient.delete<AgentWire>(`/agents/${agentId}/connections/telegram`)
    return toAgent(wire)
  },
  async listAgentVoices(): Promise<AgentVoiceOption[]> {
    const res = await apiClient.get<AgentsVoicesWire>('/agents/voices')
    return res?.voices ?? []
  },
  async listAgentModels(): Promise<AgentModels> {
    const res = await apiClient.get<AgentModels>('/agents/models')
    // Safe default — a partial/absent BE payload must never leak undefined
    // into the UI (a missing sub-array would crash the Agent tab render).
    return {
      audio: res?.audio ?? [],
      transcription: res?.transcription ?? [],
      chat: res?.chat ?? [],
    }
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

  // --- Lead Sources & Enrichment (OSINT provider health + masked config) -----
  // GET /integrations/health runs REAL probes per call, so a "Test" button is
  // just this GET again (optionally narrowed to one provider). Secrets never
  // cross the wire — the backend masks every key to the boolean `configured`.
  async getIntegrationHealth(provider?: string): Promise<IntegrationHealthRecord[]> {
    const qs = provider ? `?provider=${encodeURIComponent(provider)}` : ''
    const res = await apiClient.get<IntegrationsHealthWire>(`/integrations/health${qs}`)
    return res?.integrations ?? []
  },
  async getIntegrationProviders(): Promise<IntegrationProviderRow[]> {
    const res = await apiClient.get<IntegrationProvidersWire>('/integrations/providers')
    return res?.providers ?? []
  },
  async updateIntegrationProvider(
    provider: string,
    patch: IntegrationProviderPatch,
  ): Promise<IntegrationProviderRow> {
    return apiClient.put<IntegrationProviderRow>(`/integrations/providers/${provider}`, patch)
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
    const rows = await apiClient.get<ActivityLogWire[]>(`/activity?limit=${limit}`)
    return (rows ?? []).map(toActivity)
  },
  async getActivityLog(filters: { source?: ActivitySource | 'all'; search?: string; offerId?: string; limit?: number } = {}): Promise<ActivityLogEntry[]> {
    const params = new URLSearchParams()
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.source && filters.source !== 'all') params.set('source', filters.source)
    if (filters.offerId?.trim()) params.set('offer_id', filters.offerId.trim())
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
  async getTrainingTalkSessions(offerId: string): Promise<TrainingTalkSession[]> {
    const reply = await apiClient.get<{
      offerCampaignId: string
      sessions?: Record<string, unknown>[]
    }>(`/admin/training/campaigns/${offerId}/sessions`)
    return (reply.sessions ?? []).map(toTrainingTalkSession)
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
    const reply = await apiClient.post<{
      meta: TrainingTalkCompleteResult['meta']
      trainingSession?: Record<string, unknown>
      duplicate?: boolean
    }>(`/admin/campaigns/${id}/training/complete`, {
      transcript: input.transcript.map((turn) => ({
        role: turn.role,
        text: turn.text,
        timestamp_ms: turn.timestampMs ?? 0,
        timestamp_end_ms: turn.timestampEndMs ?? 0,
        segment_id: turn.segmentId ?? '',
      })),
      agent_id: input.agentId ?? '',
      duration_s: input.durationS ?? 0,
      conversation_id: input.conversationId ?? '',
    })
    return {
      meta: reply.meta,
      trainingSession: toTrainingSessionResult(reply.trainingSession ?? {}),
      duplicate: Boolean(reply.duplicate),
    }
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
  /**
   * Agent memory review queue. Training only ever produces `candidate`
   * records; validate then publish are separate deliberate steps, so nothing
   * here can change live behavior by itself.
   */
  async listAgentMemories(
    status: MemoryStatus = 'candidate',
    campaignId = '',
    agentId = '',
  ): Promise<AgentMemoryRecord[]> {
    const query = new URLSearchParams({ status })
    if (campaignId) query.set('campaign_id', campaignId)
    if (agentId) query.set('agent_id', agentId)
    const reply = await apiClient.get<{ status: string; memories?: AgentMemoryRecord[] }>(
      `/admin/memories?${query.toString()}`,
    )
    return reply?.memories ?? []
  },
  async validateAgentMemory(
    memoryId: string,
    input: { reviewer: string; rationale: string },
  ): Promise<AgentMemoryRecord> {
    return apiClient.post<AgentMemoryRecord>(`/admin/memories/${memoryId}/validate`, {
      reviewer: input.reviewer,
      rationale: input.rationale,
    })
  },
  async publishAgentMemory(memoryId: string): Promise<BehaviorVersion> {
    return apiClient.post<BehaviorVersion>(`/admin/memories/${memoryId}/publish`)
  },
  async disableAgentMemory(memoryId: string): Promise<BehaviorVersion> {
    return apiClient.post<BehaviorVersion>(`/admin/memories/${memoryId}/disable`)
  },
  async dismissAgentMemory(memoryId: string): Promise<AgentMemoryRecord> {
    return apiClient.post<AgentMemoryRecord>(`/admin/memories/${memoryId}/dismiss`)
  },
  async getBehaviorVersion(campaignId: string, agentId = ''): Promise<BehaviorVersion> {
    const query = new URLSearchParams({ campaign_id: campaignId })
    if (agentId) query.set('agent_id', agentId)
    return apiClient.get<BehaviorVersion>(`/admin/behavior-version?${query.toString()}`)
  },
  /** Promote a real call into the review pipeline as candidates only. */
  async reviewProductionCall(input: {
    callId: string
    transcriptId?: string
    recordingId?: string
  }): Promise<{ trainingSession: Record<string, unknown>; duplicate: boolean }> {
    return apiClient.post(`/admin/calls/review`, {
      call_id: input.callId,
      transcript_id: input.transcriptId ?? '',
      recording_id: input.recordingId ?? '',
    })
  },
  async listTrainingRecordingComments(
    offerId: string,
    sessionId: string,
  ): Promise<TrainingRecordingComment[]> {
    const reply = await apiClient.get<{ comments?: Record<string, unknown>[] }>(
      `/admin/campaigns/${offerId}/training/sessions/${sessionId}/comments`,
    )
    return (reply?.comments ?? []).map((row) => ({
      id: String(row.comment_id ?? row.id ?? ''),
      timestampS: Number(row.timestamp_s ?? row.timestampS ?? 0) || 0,
      comment: String(row.comment ?? ''),
      transcriptSnippet: String(row.transcript_snippet ?? row.transcriptSnippet ?? ''),
      createdAt: String(row.created_at ?? row.createdAt ?? ''),
      memoryId: String(row.memory_id ?? row.memoryId ?? ''),
      rule: String(row.rule ?? ''),
    }))
  },
  async addTrainingRecordingComment(
    offerId: string,
    sessionId: string,
    input: { comment: string; timestampS: number; transcriptSnippet: string },
  ): Promise<TrainingRecordingComment> {
    const reply = await apiClient.post<{ comment?: Record<string, unknown> }>(
      `/admin/campaigns/${offerId}/training/sessions/${sessionId}/comments`,
      {
        comment: input.comment,
        timestamp_s: input.timestampS,
        transcript_snippet: input.transcriptSnippet,
      },
    )
    const row = reply?.comment ?? {}
    return {
      id: String(row.comment_id ?? ''),
      timestampS: Number(row.timestamp_s ?? 0) || 0,
      comment: String(row.comment ?? input.comment),
      transcriptSnippet: String(row.transcript_snippet ?? input.transcriptSnippet),
      createdAt: String(row.created_at ?? ''),
      memoryId: String(row.memory_id ?? ''),
      rule: String(row.rule ?? ''),
    }
  },
  async deleteTrainingRecordingComment(
    offerId: string,
    sessionId: string,
    commentId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/admin/campaigns/${offerId}/training/sessions/${sessionId}/comments/${commentId}`,
    )
  },
  async getConversationProcess(offerId: string): Promise<{ offerCampaignId: string; process: string }> {
    return apiClient.get<{ offerCampaignId: string; process: string }>(
      `/admin/campaigns/${offerId}/training/process`,
    )
  },
  async saveConversationProcess(offerId: string, process: string): Promise<{ offerCampaignId: string; process: string }> {
    return apiClient.put<{ offerCampaignId: string; process: string }>(
      `/admin/campaigns/${offerId}/training/process`,
      { process },
    )
  },
  async deleteConversationProcess(offerId: string): Promise<{ offerCampaignId: string; cleared: boolean }> {
    return apiClient.delete<{ offerCampaignId: string; cleared: boolean }>(
      `/admin/campaigns/${offerId}/training/process`,
    )
  },
  /**
   * Network-tab log for GET/DELETE against the training process.
   * Uses the BE list endpoint when available; falls back to a local journal
   * while the parallel BE work is still deploying.
   */
  async listTrainingProcessOperations(offerId: string): Promise<{
    operations: TrainingProcessOperation[]
    source: 'server' | 'local'
  }> {
    try {
      const reply = await apiClient.get<{
        offerCampaignId: string
        operations?: TrainingProcessOperationWire[]
      }>(`/admin/campaigns/${offerId}/training/process/operations`)
      clearLocalTrainingProcessOperations(offerId)
      return {
        operations: (reply.operations ?? []).map(toTrainingProcessOperation),
        source: 'server',
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return {
          operations: loadLocalTrainingProcessOperations(offerId),
          source: 'local',
        }
      }
      throw error
    }
  },
  /** Send GET or DELETE to the process endpoint and return the logged row. */
  async executeTrainingProcessRequest(
    offerId: string,
    method: 'GET' | 'DELETE',
    operationId?: string,
  ): Promise<TrainingProcessOperation> {
    const started = performance.now()
    let body: Record<string, unknown>
    if (method === 'GET') {
      body = await apiClient.get<{ offerCampaignId: string; process: string }>(
        processRequestPath(offerId),
      )
    } else {
      body = await apiClient.delete<{ offerCampaignId: string; cleared: boolean }>(
        processRequestPath(offerId),
      )
    }
    const durationMs = Math.round(performance.now() - started)
    const operation = buildTrainingProcessOperation({
      offerId,
      method,
      status: 200,
      statusText: 'OK',
      durationMs,
      responseBody: body,
      operationId,
    })

    try {
      const listed = await this.listTrainingProcessOperations(offerId)
      if (listed.source === 'server') {
        const match = listed.operations.find((row) => row.operationId === operationId)
          ?? listed.operations.find(
            (row) =>
              row.method.toUpperCase() === method && row.path === processRequestPath(offerId),
          )
        if (match) return match
        if (listed.operations[0]) return listed.operations[0]
      }
    } catch {
      /* fall through to local journal */
    }

    upsertLocalTrainingProcessOperation(offerId, operation)
    return operation
  },
  async runTrainingProcessOperation(
    offerId: string,
    operationId: string,
  ): Promise<TrainingProcessOperationRunResult> {
    try {
      const reply = await apiClient.post<{
        operation: TrainingProcessOperationWire
        response: Record<string, unknown>
      }>(`/admin/campaigns/${offerId}/training/process/operations/${operationId}/run`)
      return {
        operation: toTrainingProcessOperation(reply.operation),
        response: reply.response,
      }
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      const listed = await this.listTrainingProcessOperations(offerId)
      const target = listed.operations.find((row) => row.operationId === operationId)
      if (!target) throw error
      const method = target.method.toUpperCase()
      if (method !== 'GET' && method !== 'DELETE') {
        throw new Error(`Only GET and DELETE operations can be replayed (got ${method})`)
      }
      const operation = await this.executeTrainingProcessRequest(
        offerId,
        method as 'GET' | 'DELETE',
        target.operationId,
      )
      return {
        operation,
        response: (operation.responseBody as Record<string, unknown>) ?? {},
      }
    }
  },
  async deleteTrainingProcessOperation(offerId: string, operationId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/campaigns/${offerId}/training/process/operations/${operationId}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        removeLocalTrainingProcessOperation(offerId, operationId)
        return
      }
      throw error
    }
  },
  async updateTrainingProcessOperationComment(
    offerId: string,
    operationId: string,
    comment: string,
  ): Promise<TrainingProcessOperation> {
    try {
      const reply = await apiClient.patch<{ operation: TrainingProcessOperationWire }>(
        `/admin/campaigns/${offerId}/training/process/operations/${operationId}`,
        { comment },
      )
      return toTrainingProcessOperation(reply.operation)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const updated = updateLocalTrainingProcessOperationComment(offerId, operationId, comment)
        if (!updated) throw error
        return updated
      }
      throw error
    }
  },
  async updateCampaign(id: string, patch: Partial<OfferCampaign>): Promise<OfferCampaign> {
    const wire = await apiClient.put<OfferWire>(`/offers/${id}`, {
      title: patch.offerName ?? patch.name,
      description: patch.criteria?.other,
    })
    return toCampaign(wire)
  },
  /** Persist a user pause/resume on the campaign — PUT /offers/{id} with
   * `user_paused` (the stored flag survives refetch; see toCampaign). */
  async setCampaignPaused(id: string, paused: boolean): Promise<OfferCampaign> {
    const wire = await apiClient.put<OfferWire>(`/offers/${id}`, { user_paused: paused })
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
  /**
   * Update campaign budget fields while preserving the rest of campaign_content
   * (stored whole on the offer row — must read-merge-write).
   */
  async updateCampaignBudget(
    id: string,
    budget: { total: number; daily: number; expectedDurationDays: number },
  ): Promise<OfferCampaign> {
    const wire = await apiClient.get<OfferWire>(`/offers/${id}`)
    const stored = wire.campaign_content ?? {}
    return this.updateCampaignOffer(id, {
      content: {
        ...stored,
        budget: { ...budget, currency: 'USD' },
      },
    })
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

  // --- Calendar (Phase 3, pinned §3.3) ----------------------------------------
  async getCalendarMeetings(p: { clientId?: string; from: string; to: string; status?: CalendarMeetingStatus }): Promise<CalendarMeeting[]> {
    const qs = new URLSearchParams()
    if (p.clientId) qs.set('client_id', p.clientId)
    qs.set('from', p.from)
    qs.set('to', p.to)
    if (p.status) qs.set('status', p.status)
    const res = await apiClient.get<{ items?: CalendarMeetingWire[] }>(`/calendar/meetings?${qs.toString()}`)
    return (res?.items ?? []).map(toCalendarMeeting)
  },
  async createCalendarMeeting(i: { leadId: string; scheduledFor: string; durationMin?: number; title?: string; notes?: string }): Promise<CalendarMeeting> {
    const wire = await apiClient.post<CalendarMeetingWire>('/calendar/meetings', {
      lead_id: i.leadId,
      scheduled_for: i.scheduledFor,
      duration_min: i.durationMin,
      title: i.title,
      notes: i.notes,
    })
    return toCalendarMeeting(wire)
  },
  async updateCalendarMeeting(id: string, p: { scheduledFor?: string; durationMin?: number; title?: string; status?: CalendarMeetingStatus }): Promise<CalendarMeeting> {
    const body: Record<string, unknown> = {}
    if (p.scheduledFor !== undefined) body.scheduled_for = p.scheduledFor
    if (p.durationMin !== undefined) body.duration_min = p.durationMin
    if (p.title !== undefined) body.title = p.title
    if (p.status !== undefined) body.status = p.status
    const wire = await apiClient.patch<CalendarMeetingWire>(`/calendar/meetings/${id}`, body)
    return toCalendarMeeting(wire)
  },
  async syncCalendarMeeting(id: string): Promise<{ state: 'synced' | 'error'; meetingLink?: string; error?: string }> {
    const res = await apiClient.post<{ state?: 'synced' | 'error'; meeting_link?: string; error?: string }>(`/calendar/meetings/${id}/sync`)
    return { state: res?.state ?? 'error', meetingLink: res?.meeting_link, error: res?.error }
  },
  async getAvailability(p: { clientId?: string; from: string; to: string }): Promise<AvailabilityInstance[]> {
    const qs = new URLSearchParams()
    if (p.clientId) qs.set('client_id', p.clientId)
    qs.set('from', p.from)
    qs.set('to', p.to)
    const res = await apiClient.get<{ items?: AvailabilityInstanceWire[] }>(`/calendar/availability?${qs.toString()}`)
    return (res?.items ?? []).map(toAvailabilityInstance)
  },
  async upsertAvailability(i: { id?: string; clientId?: string; kind: AvailabilityKind; start: string; end: string; daysOfWeek?: number[]; timezone: string; note?: string }): Promise<AvailabilityRule> {
    const body: Record<string, unknown> = {
      kind: i.kind,
      start_datetime: i.start,
      end_datetime: i.end,
      timezone: i.timezone,
    }
    if (i.id !== undefined) body.availability_id = i.id
    if (i.daysOfWeek !== undefined && i.daysOfWeek.length > 0) body.days_of_week = i.daysOfWeek
    if (i.note !== undefined) body.note = i.note
    const wire = await apiClient.put<AvailabilityRuleWire>(`/calendar/availability?client_id=${encodeURIComponent(i.clientId ?? '')}`, body)
    return toAvailabilityRule(wire)
  },
  async deleteAvailability(id: string): Promise<void> {
    await apiClient.delete(`/calendar/availability/${id}`)
  },
  async getSlots(p: { clientId?: string; from: string; to: string; durationMin?: number }): Promise<string[]> {
    const qs = new URLSearchParams()
    if (p.clientId) qs.set('client_id', p.clientId)
    qs.set('from', p.from)
    qs.set('to', p.to)
    if (p.durationMin) qs.set('duration_min', String(p.durationMin))
    const res = await apiClient.get<{ items?: string[] }>(`/calendar/slots?${qs.toString()}`)
    return res?.items ?? []
  },
  async getGoogleIntegration(clientId?: string): Promise<GoogleIntegrationState> {
    const qs = clientId ? `?client_id=${encodeURIComponent(clientId)}` : ''
    const res = await apiClient.get<GoogleIntegrationWire>(`/calendar/integration${qs}`)
    return toGoogleIntegration(res)
  },
  googleAuthUrl(p: { clientId?: string; returnTo?: string }): string {
    const qs = new URLSearchParams()
    if (p.clientId) qs.set('client_id', p.clientId)
    qs.set('return_to', p.returnTo ?? '/client/calendar')
    return `${env.apiBaseUrl}/calendar/integration/google/auth?${qs.toString()}`
  },
  async disconnectGoogle(clientId?: string): Promise<void> {
    const body = clientId ? { client_id: clientId } : {}
    await apiClient.post('/calendar/integration/google/disconnect', body)
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
export function mediaUrl(path: string | undefined): string {
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
    permissions: role === 'super_admin' ? [] : (w.permissions ?? []),
    active: w.active ?? true,
    tokenVersion: w.token_version ?? 0,
    createdAt: w.created_at ?? '',
  }
}

// --- Calendar wire types + mappers (Phase 3, pinned §3.3) ---------------------

interface CalendarMeetingWire {
  booking_id: string
  lead: { lead_id: string; name: string; company: string }
  offer: { offer_id: string; title: string }
  scheduled_for: string
  end: string
  timezone: string
  duration_min: number
  title: string
  status: string
  source: string
  meeting_link?: string
  google?: { state?: string; event_id?: string; calendar_id?: string; error?: string }
  notes?: string
  created_at?: string
}

function toCalendarMeeting(w: CalendarMeetingWire): CalendarMeeting {
  const isStatus = (s: string): s is CalendarMeeting['status'] =>
    s === 'confirmed' || s === 'pending' || s === 'cancelled' || s === 'completed'
  const isSource = (s: string): s is CalendarMeeting['source'] =>
    s === 'call' || s === 'manual' || s === 'client' || s === 'landing'
  return {
    bookingId: w.booking_id,
    lead: { id: w.lead?.lead_id ?? '', name: w.lead?.name ?? '', company: w.lead?.company ?? '' },
    offer: { id: w.offer?.offer_id ?? '', title: w.offer?.title ?? '' },
    scheduledFor: w.scheduled_for,
    end: w.end,
    timezone: w.timezone,
    durationMin: w.duration_min ?? 60,
    title: w.title,
    status: isStatus(w.status) ? w.status : 'pending',
    source: isSource(w.source) ? w.source : 'manual',
    meetingLink: w.meeting_link ?? undefined,
    google: w.google
      ? {
          state: w.google.state === 'synced' || w.google.state === 'error' ? w.google.state : 'none',
          eventId: w.google.event_id,
          calendarId: w.google.calendar_id,
          error: w.google.error,
        }
      : undefined,
    notes: w.notes ?? undefined,
    createdAt: w.created_at ?? '',
  }
}

interface AvailabilityInstanceWire {
  availability_id: string
  kind: string
  start: string
  end: string
  timezone: string
  note?: string
  recurring?: boolean
}

function toAvailabilityInstance(w: AvailabilityInstanceWire): AvailabilityInstance {
  return {
    id: w.availability_id,
    kind: w.kind === 'range' || w.kind === 'recurring_weekly' ? w.kind : 'single',
    start: w.start,
    end: w.end,
    timezone: w.timezone,
    note: w.note,
    recurring: w.recurring ? { daysOfWeek: undefined } : undefined,
  }
}

interface AvailabilityRuleWire {
  id: string
  kind: string
  start: string
  end: string
  timezone: string
  days_of_week?: number[]
  note?: string
}

function toAvailabilityRule(w: AvailabilityRuleWire): AvailabilityRule {
  return {
    id: w.id,
    kind: w.kind === 'range' || w.kind === 'recurring_weekly' ? w.kind : 'single',
    start: w.start,
    end: w.end,
    timezone: w.timezone,
    daysOfWeek: w.days_of_week,
    note: w.note,
  }
}

interface GoogleIntegrationWire {
  connected?: boolean
  account_email?: string
  calendar_id?: string
  scopes?: string[]
  connected_at?: string
  needs_reconnect?: boolean
}

function toGoogleIntegration(w: GoogleIntegrationWire): GoogleIntegrationState {
  return {
    connected: w.connected ?? false,
    accountEmail: w.account_email ?? undefined,
    calendarId: w.calendar_id ?? undefined,
    scopes: w.scopes,
    connectedAt: w.connected_at ?? undefined,
    needsReconnect: w.needs_reconnect ?? false,
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
  if (patch.agent_model !== undefined) out.agent_model = patch.agent_model
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

function toTrainingProcessOperation(wire: TrainingProcessOperationWire): TrainingProcessOperation {
  return {
    operationId: wire.operationId ?? wire.operation_id ?? '',
    method: wire.method ?? 'GET',
    path: wire.path ?? '',
    status: wire.status ?? 0,
    statusText: wire.statusText ?? wire.status_text ?? '',
    durationMs: wire.durationMs ?? wire.duration_ms ?? 0,
    responsePreview: wire.responsePreview ?? wire.response_preview ?? '',
    responseBody: wire.responseBody ?? wire.response_body ?? null,
    modelComment: wire.modelComment ?? wire.model_comment ?? '',
    createdAt: wire.createdAt ?? wire.created_at ?? '',
    lastRunAt: wire.lastRunAt ?? wire.last_run_at ?? '',
  }
}

function toCallHistoryEntry(wire: RecordingWire): CallHistoryEntry {
  const id = String(wire.recording_id ?? wire.id ?? '')
  return {
    id,
    callId: String(wire.call_id ?? wire.lead_id ?? ''),
    leadId: wire.lead_id ?? '',
    offerCampaignId: wire.offer_id ?? '',
    transcriptId: wire.transcript_id ?? '',
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

function toTrainingExtractedData(raw: unknown): TrainingExtractedData | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const row = raw as Record<string, unknown>
  const emails = ((row.emails ?? []) as unknown[])
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const emailRow = entry as Record<string, unknown>
      const email = String(emailRow.email ?? '').trim()
      if (!email) return null
      return {
        email,
        confirmed: Boolean(emailRow.confirmed ?? emailRow.user_confirmed),
      }
    })
    .filter((entry): entry is { email: string; confirmed: boolean } => entry !== null)
  const phones = ((row.phones ?? []) as unknown[])
    .map((phone) => String(phone ?? '').trim())
    .filter(Boolean)
  const meetingRaw = row.meeting
  let meeting: TrainingExtractedData['meeting'] = null
  if (meetingRaw && typeof meetingRaw === 'object') {
    const meetingRow = meetingRaw as Record<string, unknown>
    const day = String(meetingRow.day ?? '').trim()
    const time = String(meetingRow.time ?? '').trim()
    if (day || time) meeting = { day, time }
  }
  if (emails.length === 0 && phones.length === 0 && !meeting) return undefined
  return { emails, phones, meeting }
}

function trainingSessionRecordingUrl(wire: Record<string, unknown>): string | undefined {
  const direct = String(wire.recordingUrl ?? wire.recording_url ?? '').trim()
  const recording = wire.recording
  const nested =
    recording && typeof recording === 'object'
      ? String((recording as Record<string, unknown>).reference ?? '').trim()
      : ''
  const path = direct || nested
  return path ? mediaUrl(path) : undefined
}

function toTrainingTalkSession(wire: Record<string, unknown>): TrainingTalkSession {
  const transcript = ((wire.transcript ?? []) as Record<string, unknown>[]).map((turn) => ({
    role: (String(turn.role ?? 'user') === 'agent' ? 'agent' : 'user') as 'user' | 'agent',
    text: String(turn.text ?? ''),
    timestampMs: Number(turn.timestamp_ms ?? turn.timestampMs ?? 0) || undefined,
    timestampEndMs: Number(turn.timestamp_end_ms ?? turn.timestampEndMs ?? 0) || undefined,
    segmentId: String(turn.segment_id ?? turn.segmentId ?? '') || undefined,
  }))
  const recording = wire.recording
  const recordingDurationMs =
    recording && typeof recording === 'object'
      ? Number((recording as Record<string, unknown>).duration_ms ?? 0)
      : Number(wire.recording_duration_ms ?? 0)
  return {
    sessionId: String(wire.sessionId ?? wire.session_id ?? ''),
    conversationId: String(wire.conversationId ?? wire.conversation_id ?? ''),
    agentId: String(wire.agentId ?? wire.agent_id ?? ''),
    startedAt: String(wire.startedAt ?? wire.started_at ?? ''),
    completedAt: String(wire.completedAt ?? wire.completed_at ?? ''),
    durationS: Number(wire.durationS ?? wire.duration_s ?? 0),
    recordingDurationS: recordingDurationMs > 0 ? recordingDurationMs / 1000 : undefined,
    recordingUrl: trainingSessionRecordingUrl(wire),
    transcript,
    score: Number(wire.score ?? 0),
    outcome: String(wire.outcome ?? 'needs_improvement'),
    summary: String(wire.summary ?? ''),
    extracted: toTrainingExtractedData(wire.extracted),
  }
}

function toTrainingSessionResult(wire: Record<string, unknown>): TrainingSessionResult {
  const evaluation = wire.evaluation
  const extracted =
    toTrainingExtractedData(wire.extracted)
    ?? (evaluation && typeof evaluation === 'object'
      ? toTrainingExtractedData((evaluation as Record<string, unknown>).extracted)
      : undefined)
  const strengths = (wire.strengths ?? []) as string[]
  const gaps = (wire.gaps ?? []) as string[]
  const flow = (wire.flowSuggestions ?? wire.flow_suggestions ?? []) as string[]
  return {
    sessionId: String(wire.sessionId ?? wire.session_id ?? ''),
    conversationId: String(wire.conversationId ?? wire.conversation_id ?? ''),
    agentId: String(wire.agentId ?? wire.agent_id ?? ''),
    startedAt: String(wire.startedAt ?? wire.started_at ?? ''),
    completedAt: String(wire.completedAt ?? wire.completed_at ?? ''),
    durationS: Number(wire.durationS ?? wire.duration_s ?? 0),
    score: Number(wire.score ?? 0),
    outcome: String(wire.outcome ?? 'needs_improvement') === 'ready' ? 'ready' : 'needs_improvement',
    summary: String(wire.summary ?? ''),
    strengths,
    gaps,
    flowSuggestions: flow,
    suggestionsAdded: Number(wire.suggestionsAdded ?? wire.suggestions_added ?? 0),
    memoriesCreated: Number(wire.memoriesCreated ?? wire.memories_created ?? 0),
    deterministic: Boolean(wire.deterministic),
    extracted,
    recordingUrl: trainingSessionRecordingUrl(wire),
  }
}

export type Repository = typeof httpRepository
