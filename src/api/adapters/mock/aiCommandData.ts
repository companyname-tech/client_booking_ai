import type { Campaign } from '@/types'
import type {
  AIActivityEvent,
  AIAgentProfile,
  AIBookingConversation,
  AICommandFilters,
  AICommandOverview,
  AIConversationDetail,
  AIConversationSummary,
  AIEscalation,
  AIFollowUp,
  AIHealthSnapshot,
  AIImprovement,
  AIInsight,
  AILearningPattern,
  AIObjection,
  AIPerformanceSnapshot,
} from '@/types/aiCommand'
import { PRE_LAUNCH_AI_STATUSES } from '@/types/aiCommand'
import { getCampaignStore } from './campaignStore'
import { getLeadsForCampaign, getCallsForCampaign } from './campaignCommandData'
import { minutesAgo, hoursAgo } from './time'

const viewed = new Set<string>()
const extraEvents: AIActivityEvent[] = []

export function markConversationViewed(id: string) {
  viewed.add(id)
}

export function addSimulatedActivity(event: AIActivityEvent) {
  extraEvents.unshift(event)
}

function activeCampaigns(clientId?: string): Campaign[] {
  return getCampaignStore().filter((c) => {
    if (clientId && c.clientId !== clientId) return false
    return c.status === 'active' || c.status === 'paused' || c.status === 'completed'
  })
}

function hasLiveCampaigns(clientId?: string): boolean {
  return getCampaignStore().some((c) => (!clientId || c.clientId === clientId) && c.status === 'active')
}

function buildSarahConversation(campaign: Campaign): AIConversationDetail {
  const leadId = `lead_${campaign.id.slice(4)}_001`
  const callId = `call_${campaign.id.slice(4)}_001`
  return {
    id: 'conv_q4_sarah',
    leadId,
    leadName: 'Sarah Mitchell',
    company: 'Northline Architecture',
    campaignId: campaign.id,
    campaignName: campaign.name,
    agentId: 'agt_avi',
    callId,
    stage: 'completed',
    intent: 'high',
    confidence: 94,
    durationSec: 272,
    outcome: 'Booked',
    isActive: false,
    startedAt: minutesAgo(18),
    keywords: ['agency', 'lead quality', 'booking'],
    transcript: [
      { speaker: 'ai', text: 'Hi Sarah, I\'m calling because we work with architecture firms that want to generate more qualified project inquiries. Is that something your team is currently focused on?', timestamp: '00:08' },
      { speaker: 'prospect', text: 'Actually yes, but we\'re already working with an agency.', timestamp: '00:22', marker: { type: 'Objection detected', detail: 'Existing agency relationship' } },
      { speaker: 'ai', text: 'That makes sense. If you\'re already seeing results, I wouldn\'t suggest changing something that works. Can I ask how satisfied you are with the quality of opportunities they\'re generating?', timestamp: '00:38' },
      { speaker: 'prospect', text: 'That\'s probably the biggest issue.', timestamp: '01:04', marker: { type: 'Pain point discovered', detail: 'Lead quality dissatisfaction' } },
      { speaker: 'ai', text: 'Understood. That\'s exactly where we may be able to help. Would it make sense to schedule a short conversation so you can compare approaches?', timestamp: '01:18', marker: { type: 'High purchase intent', detail: 'Prospect engaged with comparison framing' } },
      { speaker: 'prospect', text: 'Sure.', timestamp: '01:42' },
      { speaker: 'ai', text: 'Great. I have Tuesday at 11:30 AM available.', timestamp: '01:48' },
      { speaker: 'prospect', text: 'That works.', timestamp: '02:02', marker: { type: 'Booking intent', detail: 'Meeting time accepted' } },
    ],
    decisions: [
      { id: 'd1', messageIndex: 1, intent: 'Interested', confidence: 88, qualification: 'In progress', objection: 'Existing agency', responseStrategy: 'Explore dissatisfaction', nextAction: 'Ask follow-up question', explanation: 'Detected an existing agency relationship and pivoted to quality assessment.' },
      { id: 'd2', messageIndex: 3, intent: 'High', confidence: 94, qualification: 'Passed', objection: 'Existing agency', responseStrategy: 'Identify performance gap', nextAction: 'Move toward booking', explanation: 'Prospect revealed dissatisfaction with lead quality — strong buying signal.' },
      { id: 'd3', messageIndex: 7, intent: 'High', confidence: 96, qualification: 'Passed', responseStrategy: 'Confirm calendar slot', nextAction: 'Generate booking', explanation: 'Prospect accepted meeting time. Conversation classified as booked.' },
    ],
    summary: 'Sarah is a decision maker at a 25-person architecture firm. She currently works with an agency but expressed dissatisfaction with lead quality. She agreed to a comparison call and booked Tuesday at 11:30 AM.',
    leadProfile: {
      name: 'Sarah Mitchell',
      role: 'Managing Partner',
      company: 'Northline Architecture',
      industry: 'Architecture',
      companySize: '11–50 employees',
      location: 'New York',
      campaign: campaign.name,
      leadScore: 91,
      previousInteractions: 1,
      bookingStatus: 'Confirmed',
      isDecisionMaker: true,
      painPoint: 'Lead quality',
      currentSolution: 'Existing agency',
      interest: 'High',
    },
    timeline: [
      { id: 't1', label: 'Call started', timestamp: '00:00' },
      { id: 't2', label: 'Connected', timestamp: '00:06' },
      { id: 't3', label: 'Decision maker confirmed', timestamp: '00:12' },
      { id: 't4', label: 'Pain point discovered', timestamp: '01:04' },
      { id: 't5', label: 'Objection detected', timestamp: '00:22' },
      { id: 't6', label: 'Objection handled', timestamp: '01:18' },
      { id: 't7', label: 'Interest confirmed', timestamp: '01:42' },
      { id: 't8', label: 'Meeting booked', timestamp: '02:02' },
    ],
    confidenceBreakdown: [
      { label: 'Intent detection', value: 96 },
      { label: 'Qualification', value: 92 },
      { label: 'Outcome classification', value: 95 },
      { label: 'Booking likelihood', value: 91 },
    ],
    outcomeDetails: {
      outcome: 'Booked',
      confidence: 94,
      classification: 'High-intent booking conversation',
      nextAction: 'Send calendar confirmation',
    },
    recordingDurationSec: 272,
    keyMoments: [
      { offsetSec: 42, label: 'Decision maker confirmed' },
      { offsetSec: 91, label: 'Pain point discovered' },
      { offsetSec: 138, label: 'Objection detected' },
      { offsetSec: 226, label: 'Booking intent' },
      { offsetSec: 251, label: 'Meeting booked' },
    ],
  }
}

function buildConversations(clientId?: string): AIConversationSummary[] {
  const campaigns = activeCampaigns(clientId)
  const list: AIConversationSummary[] = []
  const sarah = buildSarahConversation(campaigns.find((c) => c.id === 'cmp_q4_arch') ?? campaigns[0])
  list.push(sarah)

  for (const campaign of campaigns) {
    const leads = getLeadsForCampaign(campaign.id)
    const calls = getCallsForCampaign(campaign.id)
    leads.slice(0, 8).forEach((lead, i) => {
      if (lead.name === 'Sarah Mitchell') return
      const call = calls.find((c) => c.leadId === lead.id)
      const stageMap: Record<string, AIConversationSummary['stage']> = {
        booked: 'completed',
        interested: 'qualifying',
        details_requested: 'booking',
        contacted: 'connecting',
        not_interested: 'completed',
        no_response: 'completed',
      }
      const intent: AIConversationSummary['intent'] = lead.score > 85 ? 'high' : lead.score > 70 ? 'medium' : 'low'
      list.push({
        id: `conv_${campaign.id.slice(4)}_${String(i + 1).padStart(3, '0')}`,
        leadId: lead.id,
        leadName: lead.name,
        company: lead.company,
        campaignId: campaign.id,
        campaignName: campaign.name,
        agentId: 'agt_avi',
        callId: call?.id,
        stage: i === 1 && campaign.id === 'cmp_q4_arch' ? 'objection' : (stageMap[lead.status] ?? 'qualifying'),
        intent,
        confidence: lead.score,
        durationSec: call?.durationSec ?? 120 + i * 30,
        outcome: call?.outcome === 'booked' ? 'Booked' : call?.outcome === 'interested' ? 'Interested' : call?.outcome === 'details_requested' ? 'Details Requested' : call?.outcome === 'not_interested' ? 'Not Interested' : call?.outcome === 'no_answer' ? 'No Answer' : 'Follow-up',
        isActive: i < 2 && campaign.status === 'active' && lead.status !== 'booked',
        needsReview: i === 5,
        startedAt: lead.lastContactAt ?? hoursAgo(i + 1),
        keywords: lead.status === 'interested' ? ['agency', 'pricing'] : [],
      })
    })
  }
  return list.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

const CONVERSATIONS = buildConversations('cli_acme')

export function getAIOverview(clientId = 'cli_acme'): AICommandOverview {
  const live = hasLiveCampaigns(clientId)
  const active = activeCampaigns(clientId).filter((c) => c.status === 'active')
  const preLaunch = getCampaignStore().filter((c) => c.clientId === clientId && PRE_LAUNCH_AI_STATUSES.includes(c.status))

  if (!live && preLaunch.length > 0) {
    return {
      availability: 'pre_launch',
      agentId: 'agt_avi',
      agentName: 'Avi',
      agentRole: 'Outbound Booking Specialist',
      status: 'training',
      activeCampaigns: 0,
      callsToday: 0,
      conversations: 0,
      bookings: 0,
      followUps: 0,
      successRate: 0,
      activeConversations: 0,
      bookingConversations: 0,
      qualificationConversations: 0,
      followUpConversations: 0,
      preparationStages: [
        { label: 'Offer understanding', done: true },
        { label: 'Target analysis', done: true },
        { label: 'Conversation strategy', done: false },
        { label: 'Qualification', done: false },
        { label: 'Booking behavior', done: false },
        { label: 'Validation', done: false },
      ],
    }
  }

  const paused = active.length === 0 && activeCampaigns(clientId).some((c) => c.status === 'paused')
  const activeConv = CONVERSATIONS.filter((c) => c.isActive)

  return {
    availability: paused ? 'paused' : activeCampaigns(clientId).every((c) => c.status === 'completed') ? 'completed' : 'live',
    agentId: 'agt_avi',
    agentName: 'Avi',
    agentRole: 'Outbound Booking Specialist',
    status: paused ? 'paused' : 'active',
    activeCampaigns: active.length || activeCampaigns(clientId).length,
    callsToday: 2842,
    conversations: 1428,
    bookings: 184,
    followUps: 312,
    successRate: 94.2,
    activeConversations: activeConv.length || 12,
    bookingConversations: 3,
    qualificationConversations: 7,
    followUpConversations: 2,
  }
}

export function getAIActivity(limit = 12): AIActivityEvent[] {
  const base: AIActivityEvent[] = [
    { id: 'ev1', timestamp: '02:43:02', campaignId: 'cmp_q4_arch', campaignName: 'Q4 Architecture Outreach', leadId: 'lead_q4_arch_001', leadName: 'Sarah Mitchell', event: 'Calendar confirmation generated', status: 'success' },
    { id: 'ev2', timestamp: '02:42:41', campaignId: 'cmp_q4_arch', campaignName: 'Q4 Architecture Outreach', leadId: 'lead_q4_arch_001', leadName: 'Sarah Mitchell', event: 'Meeting booked', status: 'success' },
    { id: 'ev3', timestamp: '02:42:03', campaignId: 'cmp_q4_arch', campaignName: 'Q4 Architecture Outreach', leadId: 'lead_q4_arch_001', leadName: 'Sarah Mitchell', event: 'Objection handled', status: 'info' },
    { id: 'ev4', timestamp: '02:41:42', campaignId: 'cmp_q4_arch', campaignName: 'Q4 Architecture Outreach', leadId: 'lead_q4_arch_001', leadName: 'Sarah Mitchell', event: 'Primary objection detected: "Already working with an agency"', status: 'warning' },
    { id: 'ev5', timestamp: '02:41:18', campaignId: 'cmp_q4_arch', campaignName: 'Q4 Architecture Outreach', leadId: 'lead_q4_arch_001', leadName: 'Sarah Mitchell', event: 'Decision maker confirmed', status: 'success' },
    { id: 'ev6', timestamp: '02:41:12', campaignId: 'cmp_q4_arch', campaignName: 'Q4 Architecture Outreach', leadId: 'lead_q4_arch_001', leadName: 'Sarah Mitchell', event: 'Avi connected with Sarah from Northline Architecture', status: 'info' },
    { id: 'ev7', timestamp: '02:38:44', campaignId: 'cmp_q4_arch', campaignName: 'Q4 Architecture Outreach', leadName: 'David Carter', event: 'Objection handling in progress', status: 'warning' },
    { id: 'ev8', timestamp: '02:35:10', campaignId: 'cmp_fintech', campaignName: 'Fintech Growth', leadName: 'Jennifer Brooks', event: 'Qualification passed', status: 'success' },
  ]
  return [...extraEvents, ...base].slice(0, limit)
}

export function getAIConversations(filters?: AICommandFilters): AIConversationSummary[] {
  let list = [...CONVERSATIONS]
  if (filters?.campaignId) list = list.filter((c) => c.campaignId === filters.campaignId)
  if (filters?.intent) list = list.filter((c) => c.intent === filters.intent)
  if (filters?.outcome) {
    const o = filters.outcome.toLowerCase()
    list = list.filter((c) => c.outcome?.toLowerCase().includes(o) || (o === 'follow-up' && c.outcome?.includes('Follow')))
  }
  if (filters?.tab === 'booked') list = list.filter((c) => c.outcome === 'Booked')
  if (filters?.tab === 'interested') list = list.filter((c) => c.outcome === 'Interested')
  if (filters?.tab === 'follow-up') list = list.filter((c) => c.outcome?.includes('Follow'))
  if (filters?.tab === 'high-intent') list = list.filter((c) => c.intent === 'high')
  if (filters?.tab === 'objection') list = list.filter((c) => c.stage === 'objection')
  if (filters?.tab === 'review') list = list.filter((c) => c.needsReview)
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    list = list.filter((c) =>
      c.leadName.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.campaignName.toLowerCase().includes(q) ||
      c.keywords?.some((k) => k.includes(q)),
    )
  }
  return list
}

export function getAIConversation(id: string): AIConversationDetail | undefined {
  if (id === 'conv_q4_sarah') {
    const campaign = getCampaignStore().find((c) => c.id === 'cmp_q4_arch')
    if (campaign) return buildSarahConversation(campaign)
  }
  const summary = CONVERSATIONS.find((c) => c.id === id)
  if (!summary) return undefined
  const sarah = getAIConversation('conv_q4_sarah')
  if (!sarah) return undefined
  return {
    ...sarah,
    ...summary,
    id,
    transcript: sarah.transcript.slice(0, 4),
    summary: `${summary.leadName} engaged with the AI during a ${Math.floor(summary.durationSec / 60)}-minute conversation. Mock conversation data.`,
    leadProfile: { ...sarah.leadProfile, name: summary.leadName, company: summary.company },
  }
}

export function getAIObjections(): AIObjection[] {
  return [
    { id: 'obj1', label: 'Already have an agency', occurrences: 312, resolutionRate: 64, bookingRate: 11.2, trend: -12, strategy: 'Identify performance gap' },
    { id: 'obj2', label: 'Too expensive', occurrences: 184, resolutionRate: 58, bookingRate: 9.4, trend: 8, strategy: 'Value comparison' },
    { id: 'obj3', label: 'Not interested right now', occurrences: 161, resolutionRate: 42, bookingRate: 4.1, trend: 4, strategy: 'Schedule follow-up' },
    { id: 'obj4', label: 'Send information first', occurrences: 143, resolutionRate: 51, bookingRate: 6.8, trend: -2, strategy: 'Offer brief call instead' },
    { id: 'obj5', label: 'Need to speak with partner', occurrences: 118, resolutionRate: 48, bookingRate: 7.2, trend: 1, strategy: 'Book joint call' },
  ]
}

export function getAILearningPatterns(): AILearningPattern[] {
  return [
    { id: 'p1', pattern: 'Architecture firms with 11–50 employees respond better to ROI-focused openings.', confidence: 91, observed: 184, impact: 'High' },
    { id: 'p2', pattern: 'Managing Partners respond better when the AI asks about current lead quality before presenting the offer.', confidence: 88, observed: 142, impact: 'High' },
    { id: 'p3', pattern: 'Shorter openings (under 20s) improve conversation continuation by 14%.', confidence: 85, observed: 312, impact: 'Medium' },
  ]
}

export function getAIImprovements(): AIImprovement[] {
  return [
    { id: 'i1', date: 'September 1', title: 'Improved opening message', impact: '+14% conversation continuation' },
    { id: 'i2', date: 'September 2', title: 'Updated agency objection response', impact: '+9% objection resolution' },
    { id: 'i3', date: 'September 3', title: 'Improved booking transition', impact: '+7% booking conversion' },
  ]
}

export function getAIFollowUps(): AIFollowUp[] {
  return [
    { id: 'fu1', leadId: 'lead_q4_arch_005', leadName: 'John Smith', company: 'Summit Design', campaignId: 'cmp_q4_arch', note: 'Asked to reconnect next Tuesday.', scheduledFor: 'Tuesday 10:30 AM', recommendation: 'Call again', priority: 'high', status: 'scheduled' },
    { id: 'fu2', leadId: 'lead_q4_arch_008', leadName: 'Maria Lopez', company: 'Forma Collective', campaignId: 'cmp_q4_arch', note: 'Requested pricing information.', scheduledFor: 'Tomorrow', recommendation: 'Send summary then call', priority: 'medium', status: 'waiting' },
    { id: 'fu3', leadId: 'lead_fintech_003', leadName: 'Robert Hayes', company: 'Ledgerline', campaignId: 'cmp_fintech', note: 'Early-stage curiosity.', scheduledFor: 'Friday 2:00 PM', recommendation: 'Qualify further', priority: 'low', status: 'scheduled' },
  ]
}

export function getAIEscalations(): AIEscalation[] {
  return [
    { id: 'esc1', leadName: 'Thomas Wright', company: 'Crestline Architects', campaignName: 'Q4 Architecture Outreach', reason: 'Prospect requested custom pricing.', conversationId: 'conv_q4_arch_006' },
    { id: 'esc2', leadName: 'Laura Bennett', company: 'Meridian Design', campaignName: 'Q4 Architecture Outreach', reason: 'Prospect asked a compliance-related question.', conversationId: 'conv_q4_arch_007' },
    { id: 'esc3', leadName: 'James Foster', company: 'Blueprint Works', campaignName: 'Fintech Growth', reason: 'AI confidence below threshold.', conversationId: 'conv_fintech_003' },
  ]
}

export function getAIBookings(): AIBookingConversation[] {
  return CONVERSATIONS.filter((c) => c.outcome === 'Booked').map((c) => ({
    id: `bk_${c.id}`,
    leadName: c.leadName,
    company: c.company,
    campaignName: c.campaignName,
    durationSec: c.durationSec,
    bookingTime: c.leadName === 'Sarah Mitchell' ? 'Tuesday 11:30 AM' : 'Thursday 2:30 PM',
    channel: 'Calendly',
    meetingType: '30 minutes',
    status: 'Confirmed',
    conversationId: c.id,
  }))
}

export function getAIInsights(): AIInsight[] {
  return [
    { id: 'ins1', title: 'Architecture firms with 11–50 employees convert better.', evidence: '184 conversations · 14.2% conversion', impact: 'High', action: 'Prioritize this segment.', category: 'targeting' },
    { id: 'ins2', title: 'Agency objection resolution improved 9%.', evidence: '312 occurrences · 64% resolution', impact: 'Medium', action: 'Continue current strategy.', category: 'objections' },
    { id: 'ins3', title: 'Mid-morning calls produce highest booking rate.', evidence: '10 AM–1 PM · 6.9% booking rate', impact: 'High', action: 'Shift calling window.', category: 'timing' },
  ]
}

export function getAIHealth(): AIHealthSnapshot {
  return {
    status: 'healthy',
    components: [
      { label: 'Agent availability', status: 'Healthy', tone: 'success' },
      { label: 'Conversation quality', status: 'Strong', tone: 'success' },
      { label: 'Qualification', status: 'Strong', tone: 'success' },
      { label: 'Booking', status: 'Healthy', tone: 'success' },
      { label: 'Follow-up queue', status: 'Normal', tone: 'info' },
      { label: 'Human review', status: '3 pending', tone: 'warning' },
    ],
  }
}

export function getAIAgentProfile(agentId: string): AIAgentProfile | undefined {
  if (agentId !== 'agt_avi') return undefined
  return {
    id: 'agt_avi',
    name: 'Avi',
    role: 'Outbound Booking Specialist',
    status: 'active',
    language: 'English',
    tone: 'Professional',
    objective: 'Book qualified meetings',
    qualification: 'Custom campaign rules',
    booking: 'Calendly',
    meetingDuration: '30 minutes',
    fallback: 'Request human follow-up',
    readiness: 94,
    readinessBreakdown: [
      { label: 'Offer understanding', value: 96 },
      { label: 'Target understanding', value: 94 },
      { label: 'Qualification logic', value: 92 },
      { label: 'Booking behavior', value: 97 },
      { label: 'Objection handling', value: 89 },
    ],
    activityToday: {
      calls: 2842,
      conversations: 1428,
      bookings: 184,
      followUps: 312,
      escalations: 27,
      deltas: { calls: 8.4, conversations: 6.2, bookings: 12.1, followUps: 4.8, escalations: -12 },
    },
  }
}

export function getAIPerformance(): AIPerformanceSnapshot {
  return {
    metrics: [
      { label: 'Qualification accuracy', value: 94, delta: 2.1 },
      { label: 'Intent detection', value: 91, delta: 1.4 },
      { label: 'Objection handling', value: 86, delta: 4.8 },
      { label: 'Booking transition', value: 89, delta: 3.2 },
      { label: 'Follow-up effectiveness', value: 88, delta: 2.6 },
      { label: 'Conversation completion', value: 93, delta: 1.9 },
    ],
    byCampaign: [
      { campaignId: 'cmp_q4_arch', campaignName: 'Q4 Architecture Outreach', score: 94 },
      { campaignId: 'cmp_saas_founders', campaignName: 'SaaS Founders', score: 91 },
      { campaignId: 'cmp_fintech', campaignName: 'Fintech Growth', score: 89 },
      { campaignId: 'cmp_cre', campaignName: 'Regional Outreach', score: 87 },
    ],
  }
}

export function searchAI(query: string) {
  const q = query.toLowerCase()
  const conversations = getAIConversations({ search: q })
  const leads = getCampaignStore().flatMap((c) => getLeadsForCampaign(c.id)).filter((l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q)).slice(0, 5)
  return { conversations, leads }
}
