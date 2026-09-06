import type { Lead, LeadStatus } from '@/types'
import type {
  EnrichedLead,
  LeadHubFilters,
  LeadHubMetrics,
  LeadHubStats,
  LeadIntelligenceProfile,
  LeadIntent,
  LeadSegment,
} from '@/types/leadIntelligence'
import { getCampaignStore } from './campaignStore'
import { getLeadsForCampaign, getCallsForCampaign, getBookingsForCampaign } from './campaignCommandData'
import { getAIConversations } from './aiCommandData'
import { daysAgo, hoursAgo, minutesAgo } from './time'
import { applyLeadPatch, getLeadTags } from './leadIntelligenceStore'

function intentFromScore(score: number, status: LeadStatus): LeadIntent {
  if (status === 'booked' || score >= 90) return 'very_high'
  if (score >= 80) return 'high'
  if (score >= 70) return 'medium'
  if (score >= 60) return 'low'
  return 'unknown'
}

function intentLabel(intent: LeadIntent): string {
  return { very_high: 'Very High', high: 'High', medium: 'Medium', low: 'Low', unknown: 'Unknown' }[intent]
}

function bookingStatus(status: LeadStatus): string | undefined {
  if (status === 'booked') return 'Confirmed'
  if (status === 'details_requested') return 'Pending'
  if (status === 'interested') return '—'
  return undefined
}

export function getAllLeads(clientId = 'cli_acme'): EnrichedLead[] {
  const campaigns = getCampaignStore().filter((c) => c.clientId === clientId)
  const list: EnrichedLead[] = []
  for (const campaign of campaigns) {
    for (const lead of getLeadsForCampaign(campaign.id)) {
      const patched = applyLeadPatch(lead)
      const intent = intentFromScore(patched.score, patched.status)
      list.push({
        ...patched,
        campaignName: campaign.name,
        intent,
        intentLabel: intentLabel(intent),
        bookingStatus: bookingStatus(patched.status),
      })
    }
  }
  return list.sort((a, b) => (b.lastContactAt ?? '').localeCompare(a.lastContactAt ?? ''))
}

export function getLeadHubMetrics(): LeadHubMetrics {
  return { total: 12480, qualified: 3842, highIntent: 1142, detailsRequested: 842, booked: 386, followUp: 614 }
}

export function getLeadHubStats(leads: EnrichedLead[]): LeadHubStats {
  const statusCounts: Record<string, number> = {}
  leads.forEach((l) => {
    const key = l.status.replace('_', ' ')
    statusCounts[key] = (statusCounts[key] ?? 0) + 1
  })
  const campaigns = getCampaignStore()
  return {
    statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    qualityDistribution: [
      { range: '90–100', percent: 18 },
      { range: '80–89', percent: 29 },
      { range: '70–79', percent: 31 },
      { range: '60–69', percent: 16 },
      { range: 'Below 60', percent: 6 },
    ],
    sources: campaigns.slice(0, 3).map((c, i) => ({
      campaignName: c.name,
      percent: [62, 21, 17][i] ?? 10,
    })),
  }
}

export function getLeadSegments(): LeadSegment[] {
  return [
    { id: 'high-intent', label: 'High Intent', count: 1142, filter: { intent: 'high' } },
    { id: 'decision-makers', label: 'Decision Makers', count: 3842, filter: { minScore: 80 } },
    { id: 'follow-up', label: 'Needs Follow-up', count: 614, filter: { status: 'no_response' } },
    { id: 'booked', label: 'Booked', count: 386, filter: { status: 'booked' } },
    { id: 'strong-fit', label: 'Strong Fit', count: 2184, filter: { minScore: 85 } },
  ]
}

export function filterLeads(leads: EnrichedLead[], filters: LeadHubFilters): EnrichedLead[] {
  let list = [...leads]
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    list = list.filter((l) =>
      [l.name, l.company, l.title, l.email, l.phone, l.location, l.industry, l.campaignName].some((f) => f?.toLowerCase().includes(q)),
    )
  }
  if (filters.campaignId) list = list.filter((l) => l.campaignId === filters.campaignId)
  if (filters.status && filters.status !== 'all') list = list.filter((l) => l.status === filters.status)
  if (filters.intent && filters.intent !== 'all') list = list.filter((l) => l.intent === filters.intent)
  if (filters.minScore) list = list.filter((l) => l.score >= filters.minScore!)
  if (filters.maxScore) list = list.filter((l) => l.score <= filters.maxScore!)
  if (filters.industry) list = list.filter((l) => l.industry?.toLowerCase().includes(filters.industry!.toLowerCase()))
  if (filters.location) list = list.filter((l) => l.location.toLowerCase().includes(filters.location!.toLowerCase()))
  if (filters.segment === 'high-intent') list = list.filter((l) => ['very_high', 'high'].includes(l.intent))
  if (filters.segment === 'booked') list = list.filter((l) => l.status === 'booked')
  if (filters.segment === 'follow-up') list = list.filter((l) => ['no_response', 'contacted'].includes(l.status))
  if (filters.segment === 'strong-fit') list = list.filter((l) => l.score >= 85)
  return list
}

function buildSarahProfile(lead: Lead, campaignName: string): LeadIntelligenceProfile {
  return {
    lead,
    campaignName,
    intent: 'very_high',
    intentLabel: 'High',
    tags: ['High Intent', 'Decision Maker', 'Existing Agency', 'Meeting Booked', 'Priority'],
    signals: ['Strong Fit', 'Decision Maker', 'High Intent', 'Pain Point Detected', 'Meeting Booked'],
    scoreBreakdown: { overall: 91, companyFit: 94, decisionMaker: 100, offerRelevance: 91, engagement: 88, intent: 92, label: 'High Quality' },
    aiSummary: 'Sarah is a managing partner at a 25-person architecture firm. The company currently works with an agency but is dissatisfied with lead quality. She showed strong interest after discussing conversion performance and booked a comparison call.',
    summaryFields: {
      role: 'Decision maker',
      companyFit: 'Excellent',
      painPoint: 'Lead quality',
      currentSolution: 'Existing agency',
      intent: 'High',
      nextAction: 'Meeting booked',
    },
    journey: [
      { id: 'discovered', label: 'Discovered', timestamp: 'Sep 1, 10:21 AM', detail: 'AI targeting engine', completed: true },
      { id: 'qualified', label: 'Qualified', timestamp: 'Sep 1, 11:05 AM', completed: true },
      { id: 'contacted', label: 'Contacted', timestamp: 'Sep 2, 11:42 AM', detail: 'AI agent', completed: true },
      { id: 'connected', label: 'Connected', timestamp: 'Sep 2, 11:43 AM', completed: true },
      { id: 'interested', label: 'Interested', timestamp: 'Sep 3, 2:35 PM', completed: true },
      { id: 'details', label: 'Details Requested', completed: false },
      { id: 'booked', label: 'Booked', timestamp: 'Sep 3, 2:41 PM', detail: 'Calendly', completed: true },
    ],
    activity: [
      { id: 'a1', type: 'booking', title: 'Calendar confirmation created', timestamp: minutesAgo(2), group: 'Today' },
      { id: 'a2', type: 'call', title: 'AI completed call', description: 'Outcome: Booked', timestamp: minutesAgo(18), group: 'Today' },
      { id: 'a3', type: 'call', title: 'AI contacted lead', timestamp: hoursAgo(26), group: 'Yesterday' },
      { id: 'a4', type: 'discovered', title: 'Lead discovered by campaign', timestamp: daysAgo(2), group: 'Sep 1' },
    ],
    conversations: [{ id: 'conv_q4_sarah', date: 'September 3', durationSec: 272, outcome: 'Booked', intent: 'very_high' }],
    calls: [{ id: 'call_q4_arch_001', date: 'Sep 3', durationSec: 272, outcome: 'Booked', confidence: 94, intent: 'very_high', hasRecording: true }],
    recordings: [{ id: 'call_q4_arch_001', date: 'Sep 3', durationSec: 272, outcome: 'Booked', summary: 'Prospect expressed dissatisfaction with current agency and agreed to a comparison meeting.' }],
    objections: [
      { label: 'Existing agency', occurrences: 2, resolution: 'Successful' },
      { label: 'Pricing', occurrences: 1, resolution: 'Partially resolved' },
      { label: 'Timing', occurrences: 1, resolution: 'Follow-up requested' },
    ],
    intentTimeline: [
      { label: 'Initial', value: 42 },
      { label: 'After first call', value: 61 },
      { label: 'After follow-up', value: 78 },
      { label: 'Before booking', value: 94 },
    ],
    engagement: { calls: 3, conversations: 2, followUps: 1, detailsRequests: 1, bookings: 1, firstContact: 'Sep 1', lastActivity: 'Today', timeToBooking: '2 days' },
    company: {
      name: 'Northline Architecture',
      industry: 'Architecture',
      employees: '25',
      location: 'New York',
      website: 'northline.example',
      companySizeRange: '11–50',
      companyFit: 94,
      fitBreakdown: [
        { label: 'Industry fit', value: 98 },
        { label: 'Company size fit', value: 94 },
        { label: 'Decision-maker fit', value: 100 },
        { label: 'Geographic fit', value: 91 },
        { label: 'Offer relevance', value: 93 },
      ],
    },
    contact: { email: 'sarah.mitchell@northline.example', phone: '+1 (555) 010-0142' },
    booking: { title: 'Meeting booked', datetime: 'Tuesday 11:30 AM', duration: '30 minutes', channel: 'Calendly', meetingType: 'Zoom', status: 'Confirmed' },
    followUp: { action: 'Prepare for scheduled meeting', scheduledFor: 'Tuesday 11:30 AM' },
    nextBestAction: 'Prepare for scheduled meeting.',
    conversationId: 'conv_q4_sarah',
    discoveredAt: daysAgo(2),
    whyTargeted: ['Strong company fit', 'Industry match', 'Decision maker', 'Campaign relevance'],
  }
}

export function getLeadIntelligence(leadId: string): LeadIntelligenceProfile | undefined {
  const all = getAllLeads()
  const enriched = all.find((l) => l.id === leadId)
  if (!enriched) return undefined

  if (enriched.name === 'Sarah Mitchell') return buildSarahProfile(enriched, enriched.campaignName)

  const calls = getCallsForCampaign(enriched.campaignId).filter((c) => c.leadId === leadId)
  const bookings = getBookingsForCampaign(enriched.campaignId).filter((b) => b.leadId === leadId)
  const conv = getAIConversations().find((c) => c.leadId === leadId)
  const intent = intentFromScore(enriched.score, enriched.status)

  const nextAction = (() => {
    if (enriched.status === 'booked') return 'Prepare for scheduled meeting.'
    if (enriched.status === 'details_requested') return 'Send requested information and follow up.'
    if (enriched.status === 'interested') return 'Continue qualification.'
    if (enriched.status === 'no_response') return 'Retry during preferred contact window.'
    if (enriched.status === 'new' || enriched.status === 'queued') return 'Begin first outreach.'
    if (enriched.status === 'not_interested') return 'No action recommended.'
    return 'Monitor engagement and follow up as needed.'
  })()

  return {
    lead: enriched,
    campaignName: enriched.campaignName,
    intent,
    intentLabel: intentLabel(intent),
    tags: getLeadTags(leadId).length ? getLeadTags(leadId) : enriched.score >= 85 ? ['Strong Fit'] : [],
    signals: enriched.score >= 80 ? ['Decision Maker', 'Strong Fit'] : ['Moderate Fit'],
    scoreBreakdown: {
      overall: enriched.score,
      companyFit: Math.min(98, enriched.score + 3),
      decisionMaker: enriched.title.toLowerCase().includes('partner') || enriched.title.toLowerCase().includes('founder') ? 100 : 82,
      offerRelevance: enriched.score - 2,
      engagement: calls.length > 0 ? 75 + calls.length * 5 : 40,
      intent: enriched.score - 5,
      label: enriched.score >= 90 ? 'High Quality' : enriched.score >= 80 ? 'Strong' : 'Moderate',
    },
    aiSummary: `${enriched.name.split(' ')[0]} is a ${enriched.title.toLowerCase()} at ${enriched.company}. ${calls.length > 0 ? 'The AI has engaged through outbound calls.' : 'This lead was recently discovered and has not been contacted yet.'} Simulated lead intelligence summary.`,
    summaryFields: {
      role: enriched.title.toLowerCase().includes('partner') || enriched.title.toLowerCase().includes('founder') ? 'Decision maker' : 'Influencer',
      companyFit: enriched.score >= 85 ? 'Excellent' : 'Good',
      intent: intentLabel(intent),
      nextAction: nextAction.replace('.', ''),
    },
    journey: [
      { id: 'discovered', label: 'Discovered', timestamp: daysAgo(3), completed: true },
      { id: 'qualified', label: 'Qualified', completed: enriched.score >= 70 },
      { id: 'contacted', label: 'Contacted', completed: !['new', 'queued'].includes(enriched.status), timestamp: enriched.lastContactAt },
      { id: 'connected', label: 'Connected', completed: calls.length > 0 },
      { id: 'interested', label: 'Interested', completed: ['interested', 'details_requested', 'booked'].includes(enriched.status) },
      { id: 'details', label: 'Details Requested', completed: ['details_requested', 'booked'].includes(enriched.status) },
      { id: 'booked', label: 'Booked', completed: enriched.status === 'booked', timestamp: bookings[0] ? 'Confirmed' : undefined },
    ],
    activity: [
      ...(calls[0] ? [{ id: 'c1', type: 'call' as const, title: 'AI completed call', description: `Outcome: ${calls[0].outcome}`, timestamp: calls[0].startedAt, group: 'Recent' }] : []),
      { id: 'd1', type: 'discovered', title: 'Lead discovered by campaign', timestamp: daysAgo(3), group: 'Earlier' },
    ],
    conversations: conv ? [{ id: conv.id, date: 'Recent', durationSec: conv.durationSec, outcome: conv.outcome ?? 'In progress', intent }] : [],
    calls: calls.map((c) => ({
      id: c.id,
      date: new Date(c.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      durationSec: c.durationSec,
      outcome: c.outcome,
      confidence: 75 + (enriched.score % 20),
      intent,
      hasRecording: !!c.recordingUrl,
    })),
    recordings: calls.filter((c) => c.recordingUrl).map((c) => ({
      id: c.id,
      date: new Date(c.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      durationSec: c.durationSec,
      outcome: c.outcome,
      summary: c.summary ?? 'Mock AI summary of call conversation.',
    })),
    objections: [],
    intentTimeline: [
      { label: 'Initial', value: Math.max(40, enriched.score - 30) },
      { label: 'After first call', value: Math.max(50, enriched.score - 15) },
      { label: 'Current', value: enriched.score },
    ],
    engagement: {
      calls: calls.length,
      conversations: conv ? 1 : 0,
      followUps: enriched.status === 'no_response' ? 1 : 0,
      detailsRequests: enriched.status === 'details_requested' ? 1 : 0,
      bookings: bookings.length,
      firstContact: enriched.lastContactAt,
      lastActivity: enriched.lastContactAt,
    },
    company: {
      name: enriched.company,
      industry: enriched.industry ?? 'Professional Services',
      employees: enriched.companySize,
      location: enriched.location,
      website: enriched.website ?? `${enriched.company.toLowerCase().replace(/\s+/g, '')}.example`,
      companySizeRange: `${enriched.companySize} employees`,
      companyFit: enriched.score,
      fitBreakdown: [
        { label: 'Industry fit', value: 90 },
        { label: 'Company size fit', value: enriched.score },
        { label: 'Geographic fit', value: 88 },
      ],
    },
    contact: {
      email: enriched.email ?? `${enriched.name.split(' ')[0].toLowerCase()}@${enriched.company.toLowerCase().replace(/\s+/g, '')}.example`,
      phone: enriched.phone ?? '+1 (555) 010-0000',
    },
    booking: enriched.status === 'booked' ? { title: 'Meeting booked', datetime: 'Thursday 2:30 PM', duration: '30 minutes', channel: 'Calendly', meetingType: 'Zoom', status: 'Confirmed' } : undefined,
    followUp: enriched.status === 'no_response' ? { action: 'Follow-up recommended', scheduledFor: 'Tomorrow 10:30 AM', reason: 'No answer on last attempt', priority: 'medium' } : undefined,
    nextBestAction: nextAction,
    conversationId: conv?.id,
    discoveredAt: daysAgo(3),
    whyTargeted: ['Industry match', 'Company size fit', enriched.score >= 80 ? 'Decision maker profile' : 'Campaign targeting'],
  }
}

export function getRecommendedLeads(limit = 5): EnrichedLead[] {
  return getAllLeads()
    .filter((l) => l.score >= 85)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function getPriorityLeads(limit = 5): { lead: EnrichedLead; reason: string }[] {
  return getAllLeads()
    .filter((l) => l.score >= 80 || l.status === 'booked' || l.status === 'details_requested')
    .slice(0, limit)
    .map((lead) => ({
      lead,
      reason: lead.status === 'booked' ? 'Booking opportunity confirmed' : lead.score >= 90 ? 'High intent' : lead.status === 'details_requested' ? 'Requested pricing' : 'Strong company fit',
    }))
}

export function findLeadById(leadId: string): EnrichedLead | undefined {
  return getAllLeads().find((l) => l.id === leadId)
}
