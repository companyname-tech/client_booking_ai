/**
 * Deterministic campaign command-center data for Phase 3.
 * Rich dataset for cmp_q4_arch; scaled sets for other campaigns.
 */
import type {
  Booking,
  Call,
  CallDetail,
  CampaignAttentionAlert,
  CampaignFunnelStage,
  CampaignHealthSnapshot,
  CampaignInsight,
  CampaignPerformancePoint,
  Lead,
  LeadDetail,
  LeadStatus,
  Recording,
} from '@/types'
import { daysFromNow, hoursAgo, minutesAgo } from './time'

const FIRST_NAMES = [
  'Sarah', 'Michael', 'David', 'Emily', 'James', 'Rachel', 'Thomas', 'Laura',
  'Robert', 'Jennifer', 'Daniel', 'Amanda', 'Christopher', 'Nicole', 'Matthew',
  'Jessica', 'Andrew', 'Stephanie', 'Kevin', 'Melissa', 'Brian', 'Ashley',
  'Ryan', 'Michelle', 'Jason', 'Kimberly', 'Eric', 'Lisa', 'Mark', 'Angela',
  'Steven', 'Rebecca', 'Paul', 'Samantha', 'Gregory', 'Elizabeth', 'Joshua',
  'Heather', 'Kenneth', 'Amy', 'Timothy', 'Anna',
]

const LAST_NAMES = [
  'Mitchell', 'Cohen', 'Miller', 'Parker', 'Sullivan', 'Brooks', 'Hayes',
  'Foster', 'Bennett', 'Reed', 'Morgan', 'Cooper', 'Bailey', 'Rivera',
  'Coleman', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons',
  'Foster', 'Gonzalez', 'Bryant', 'Alexander', 'Russell', 'Griffin',
  'Diaz', 'Hayes', 'Myers', 'Ford', 'Hamilton', 'Graham', 'Sullivan',
  'Wallace', 'Woods', 'Cole', 'West', 'Jordan', 'Owens', 'Reynolds', 'Fisher',
]

const COMPANIES = [
  'Vertex Architecture', 'Northline Studio', 'ArcForm', 'Marchetti Studio',
  'Okafor & Lane Architects', 'Vogel Design Group', 'Halstead Commercial',
  'Brightside Dental', 'Pipestack', 'Orbital Metrics', 'Ledgerline',
  'Summit Design Partners', 'Crestline Architects', 'Forma Collective',
  'Axis Studio', 'Meridian Design', 'Blueprint Works', 'Stonegate Architects',
  'Harborline Design', 'Pinnacle Studio', 'Westfield Architects', 'Novaform',
  'Clearview Design', 'Ironwood Studio', 'Lakeside Architects', 'Urbanform',
  'Skyline Partners', 'Cornerstone Design', 'Evergreen Studio', 'Bridgepoint',
]

const TITLES = [
  'Managing Partner', 'Founder', 'Principal', 'Partner', 'Co-Founder',
  'Director', 'VP of Operations', 'Head of Design', 'Founding Principal',
  'CEO', 'President', 'Studio Director',
]

const LOCATIONS = [
  'New York, NY', 'Chicago, IL', 'Boston, MA', 'Austin, TX', 'Portland, OR',
  'Denver, CO', 'San Francisco, CA', 'Los Angeles, CA', 'Seattle, WA',
  'Miami, FL', 'Atlanta, GA', 'Philadelphia, PA', 'Dallas, TX', 'Phoenix, AZ',
]

const STATUSES: LeadStatus[] = [
  'new', 'queued', 'contacted', 'interested', 'details_requested', 'booked',
  'not_interested', 'no_response', 'do_not_contact',
]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function hashCampaign(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

const LEAD_COUNTS: Record<string, number> = {
  cmp_q4_arch: 42,
  cmp_saas_founders: 28,
  cmp_fintech: 18,
  cmp_cre: 15,
  cmp_dental: 12,
  cmp_logistics: 10,
}

export function generateLeads(campaignId: string): Lead[] {
  const count = LEAD_COUNTS[campaignId] ?? 12
  const rand = seededRandom(hashCampaign(campaignId))
  const leads: Lead[] = []

  for (let i = 0; i < count; i++) {
    const first = pick(FIRST_NAMES, rand)
    const last = pick(LAST_NAMES, rand)
    const status = pick(STATUSES, rand)
    const score = Math.round(52 + rand() * 46)
    const hoursBack = Math.floor(rand() * 72)
    const contacted = status !== 'new' && status !== 'queued'

    leads.push({
      id: `lead_${campaignId.slice(4)}_${String(i + 1).padStart(3, '0')}`,
      campaignId,
      name: `${first} ${last}`,
      title: pick(TITLES, rand),
      company: pick(COMPANIES, rand),
      companySize: String(Math.floor(10 + rand() * 190)),
      location: pick(LOCATIONS, rand),
      industry: campaignId.includes('arch') ? 'Architecture' : 'Professional Services',
      website: `https://${pick(COMPANIES, rand).toLowerCase().replace(/\s+/g, '')}.com`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      status,
      score,
      lastContactAt: contacted ? hoursAgo(hoursBack) : undefined,
    })
  }

  // Pin spec examples for cmp_q4_arch
  if (campaignId === 'cmp_q4_arch' && leads.length >= 3) {
    Object.assign(leads[0], {
      name: 'Sarah Mitchell',
      company: 'Northline Architecture',
      title: 'Managing Partner',
      location: 'New York, NY',
      companySize: '25',
      status: 'booked' as LeadStatus,
      score: 91,
      lastContactAt: minutesAgo(2),
    })
    Object.assign(leads[1], {
      name: 'David Carter',
      company: 'Studio Axis',
      title: 'Founder',
      location: 'Chicago, IL',
      status: 'interested' as LeadStatus,
      score: 78,
      lastContactAt: minutesAgo(45),
    })
    Object.assign(leads[2], {
      name: 'David Miller',
      company: 'ArcForm',
      title: 'Principal',
      location: 'Boston, MA',
      status: 'contacted' as LeadStatus,
      score: 81,
      lastContactAt: hoursAgo(3),
    })
  }

  return leads.sort((a, b) => (b.lastContactAt ?? '').localeCompare(a.lastContactAt ?? ''))
}

function buildTranscript(_leadName: string, outcome: string) {
  return [
    { speaker: 'ai' as const, text: `Thanks for taking the call. I noticed your firm has been expanding into new markets.` },
    { speaker: 'lead' as const, text: `Yes, we're actually looking at improving our website conversion and lead flow.` },
    { speaker: 'ai' as const, text: `That's exactly what we help architecture firms with — qualified meetings with decision-makers who need design-build partners.` },
    { speaker: 'lead' as const, text: `Can you send me more information about how this works?` },
    { speaker: 'ai' as const, text: `Absolutely. Would it make sense to schedule a short strategy session to walk through a few relevant case studies?` },
    { speaker: 'lead' as const, text: outcome === 'booked' ? `Yes, Thursday works for a 30-minute session.` : `Let me review the details first and get back to you.` },
    { speaker: 'ai' as const, text: outcome === 'booked' ? `Perfect — I'll send a calendar invite for Thursday at 2:30 PM.` : `Of course. I'll follow up with a summary and case studies by email.` },
  ]
}

function buildCallDetail(call: Call, lead: Lead): CallDetail {
  const moments: CallDetail['keyMoments'] = [
    { offsetSec: 42, label: 'Prospect explains current problem' },
    { offsetSec: 91, label: 'AI presents offer' },
    { offsetSec: 168, label: 'Prospect requests details' },
    { offsetSec: call.durationSec > 200 ? 232 : call.durationSec - 20, label: call.outcome === 'booked' ? 'Meeting confirmed' : 'Next steps discussed' },
  ].filter((m) => m.offsetSec < call.durationSec)

  return {
    ...call,
    keyMoments: moments,
    signals: ['High intent', 'Decision maker', 'Budget discussion', call.outcome === 'booked' ? 'Meeting confirmed' : 'Follow-up requested'].slice(0, 3 + (call.outcome === 'booked' ? 1 : 0)),
    confidence: 85 + (lead.score % 10),
    transcript: buildTranscript(lead.name, call.outcome),
  }
}

export function generateCalls(campaignId: string, leads: Lead[]): Call[] {
  const rand = seededRandom(hashCampaign(campaignId) + 7)
  const contacted = leads.filter((l) => l.lastContactAt && l.status !== 'new' && l.status !== 'queued')
  const agentId = campaignId === 'cmp_q4_arch' ? 'agt_nova' : campaignId === 'cmp_saas_founders' ? 'agt_atlas' : 'agt_sol'
  const calls: Call[] = []

  contacted.slice(0, Math.min(contacted.length, campaignId === 'cmp_q4_arch' ? 28 : 15)).forEach((lead, i) => {
    const outcomeMap: Record<string, Call['outcome']> = {
      booked: 'booked',
      interested: 'interested',
      details_requested: 'details_requested',
      contacted: rand() > 0.5 ? 'interested' : 'details_requested',
      not_interested: 'not_interested',
      no_response: 'no_answer',
      do_not_contact: 'not_interested',
      unreachable: 'voicemail',
      new: 'no_answer',
      queued: 'no_answer',
    }
    const duration = lead.status === 'no_response' ? 0 : Math.floor(90 + rand() * 300)
    calls.push({
      id: `call_${campaignId.slice(4)}_${String(i + 1).padStart(3, '0')}`,
      campaignId,
      leadId: lead.id,
      agentId,
      startedAt: lead.lastContactAt ?? hoursAgo(i + 1),
      durationSec: duration,
      outcome: outcomeMap[lead.status] ?? 'interested',
      sentiment: lead.score > 85 ? 'high_intent' : lead.score > 70 ? 'positive' : 'neutral',
      recordingUrl: duration > 0 ? '#' : undefined,
      summary:
        lead.status === 'booked'
          ? `${lead.name.split(' ')[0]} confirmed interest and agreed to a strategy session next week.`
          : `${lead.name.split(' ')[0]} engaged with the offer and requested additional information before committing.`,
    })
  })

  return calls.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

export function generateBookings(campaignId: string, leads: Lead[]): Booking[] {
  return leads
    .filter((l) => l.status === 'booked')
    .map((lead, i) => ({
      id: `bk_${campaignId.slice(4)}_${i + 1}`,
      campaignId,
      leadId: lead.id,
      scheduledFor: daysFromNow(3 + i),
      durationMin: 30,
      title: '30 minute strategy session',
      channel: 'zoom' as const,
      meetingProvider: 'zoom' as const,
      status: 'confirmed' as const,
      createdAt: lead.lastContactAt ?? hoursAgo(2),
    }))
}

export function buildLeadDetail(lead: Lead, calls: Call[], bookings: Booking[]): LeadDetail {
  const call = calls.find((c) => c.leadId === lead.id)
  const booking = bookings.find((b) => b.leadId === lead.id)

  const timeline = [
    call && { id: 'tl_1', timestamp: call.startedAt, title: 'AI call completed', description: `${Math.floor(call.durationSec / 60)}m ${call.durationSec % 60}s conversation` },
    lead.status === 'interested' || lead.status === 'booked' ? { id: 'tl_2', timestamp: minutesAgo(30), title: 'Lead expressed interest', description: 'Positive engagement during call' } : null,
    lead.status === 'details_requested' || lead.status === 'booked' ? { id: 'tl_3', timestamp: minutesAgo(28), title: 'Details requested', description: 'Case studies and pricing information sent' } : null,
    booking ? { id: 'tl_4', timestamp: minutesAgo(26), title: 'Meeting booked', description: booking.title } : null,
  ].filter(Boolean) as LeadDetail['timeline']

  return {
    ...lead,
    timeline,
    analysis: {
      summary: `Strong ICP match based on ${lead.industry ?? 'target'} industry profile, decision-maker title, and geographic fit.`,
      signals: [
        `${lead.industry ?? 'Architecture'} industry`,
        `${lead.companySize} employees`,
        'Decision maker',
        'US location',
        'Active website',
        lead.score > 85 ? 'High purchase intent signals' : 'Moderate intent signals',
      ],
      confidence: lead.score,
    },
    latestCall: call ? buildCallDetail(call, lead) : undefined,
    booking,
  }
}

export function buildRecordings(calls: Call[], leads: Lead[]): Recording[] {
  const leadMap = new Map(leads.map((l) => [l.id, l]))
  return calls
    .filter((c) => c.recordingUrl && c.durationSec > 0)
    .map((call) => {
      const lead = leadMap.get(call.leadId)!
      const detail = buildCallDetail(call, lead)
      return { ...detail, leadName: lead.name, leadCompany: lead.company }
    })
}

export function getCampaignFunnel(_campaignId: string, metrics?: { leadsFound: number }): CampaignFunnelStage[] {
  const total = metrics?.leadsFound ?? 1284
  const qualified = Math.round(total * 0.726)
  const contacted = Math.round(total * 0.578)
  const conversations = Math.round(total * 0.403)
  const interested = Math.round(total * 0.143)
  const details = Math.round(total * 0.111)
  const bookings = Math.round(total * 0.05)

  return [
    { id: 'found', label: 'Leads found', count: total, conversionFromTotal: 100 },
    { id: 'qualified', label: 'Qualified', count: qualified, conversionFromPrev: (qualified / total) * 100, conversionFromTotal: (qualified / total) * 100 },
    { id: 'contacted', label: 'Contacted', count: contacted, conversionFromPrev: (contacted / qualified) * 100, conversionFromTotal: (contacted / total) * 100 },
    { id: 'conversations', label: 'Conversations', count: conversations, conversionFromPrev: (conversations / contacted) * 100, conversionFromTotal: (conversations / total) * 100 },
    { id: 'interested', label: 'Interested', count: interested, conversionFromPrev: (interested / conversations) * 100, conversionFromTotal: (interested / total) * 100 },
    { id: 'details', label: 'Details requested', count: details, conversionFromPrev: (details / interested) * 100, conversionFromTotal: (details / total) * 100 },
    { id: 'bookings', label: 'Bookings', count: bookings, conversionFromPrev: (bookings / details) * 100, conversionFromTotal: (bookings / total) * 100 },
  ]
}

export function getCampaignHealth(campaignId: string): CampaignHealthSnapshot {
  if (campaignId === 'cmp_q4_arch') {
    return {
      overall: 'excellent',
      aiPerformance: 'excellent',
      leadQuality: 'strong',
      bookingRate: 'above_target',
      budgetEfficiency: 'healthy',
      message: 'AI is operating normally.',
    }
  }
  return {
    overall: 'good',
    aiPerformance: 'good',
    leadQuality: 'moderate',
    bookingRate: 'on_target',
    budgetEfficiency: 'healthy',
    message: 'Campaign is progressing as expected.',
  }
}

export function getCampaignInsights(campaignId: string): CampaignInsight[] {
  if (campaignId !== 'cmp_q4_arch') return []
  return [
    { id: 'ins_1', category: 'targeting', text: 'Architecture firms with 50–100 employees are converting 2.3× better than smaller firms.' },
    { id: 'ins_2', category: 'timing', text: 'Calls made between 10 AM and 1 PM have the highest booking rate.' },
    { id: 'ins_3', category: 'messaging', text: 'Principals respond better to the shorter opening pitch.' },
  ]
}

export function getCampaignAlerts(campaignId: string): CampaignAttentionAlert[] {
  if (campaignId !== 'cmp_q4_arch') return []
  return [
    { id: 'alt_1', title: '3 leads requested additional details', description: 'Follow-up emails are queued for delivery.', tone: 'info', href: 'leads', actionLabel: 'View leads' },
    { id: 'alt_2', title: '2 conversations need review', description: 'AI flagged edge cases for your review.', tone: 'warning', href: 'calls', actionLabel: 'Review calls' },
    { id: 'alt_3', title: '1 integration needs reconnecting', description: 'Calendly sync paused — reconnect to resume auto-booking.', tone: 'warning', href: 'integrations', actionLabel: 'Reconnect' },
    { id: 'alt_4', title: 'Budget usage is above expected pace', description: 'At current spend, budget may be exhausted 4 days early.', tone: 'warning', actionLabel: 'View budget' },
  ]
}

export function getPerformanceSeries(campaignId: string, days: 7 | 14 | 30): CampaignPerformancePoint[] {
  const rand = seededRandom(hashCampaign(campaignId) + days)
  const points: CampaignPerformancePoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const base = campaignId === 'cmp_q4_arch' ? 40 : 15
    points.push({
      date: d.toISOString().slice(0, 10),
      leads: Math.round(base + rand() * 30),
      calls: Math.round(base * 0.6 + rand() * 20),
      bookings: Math.round(2 + rand() * 8),
    })
  }
  return points
}

// Module-level cache
const leadCache = new Map<string, Lead[]>()
const callCache = new Map<string, Call[]>()
const bookingCache = new Map<string, Booking[]>()

export function getLeadsForCampaign(campaignId: string): Lead[] {
  if (!leadCache.has(campaignId)) leadCache.set(campaignId, generateLeads(campaignId))
  return leadCache.get(campaignId)!
}

export function getCallsForCampaign(campaignId: string): Call[] {
  if (!callCache.has(campaignId)) {
    const leads = getLeadsForCampaign(campaignId)
    callCache.set(campaignId, generateCalls(campaignId, leads))
  }
  return callCache.get(campaignId)!
}

export function getBookingsForCampaign(campaignId: string): Booking[] {
  if (!bookingCache.has(campaignId)) {
    const leads = getLeadsForCampaign(campaignId)
    bookingCache.set(campaignId, generateBookings(campaignId, leads))
  }
  return bookingCache.get(campaignId)!
}

export function getLeadDetail(campaignId: string, leadId: string): LeadDetail | undefined {
  const leads = getLeadsForCampaign(campaignId)
  const lead = leads.find((l) => l.id === leadId)
  if (!lead) return undefined
  return buildLeadDetail(lead, getCallsForCampaign(campaignId), getBookingsForCampaign(campaignId))
}

export function getCallDetail(campaignId: string, callId: string): CallDetail | undefined {
  const calls = getCallsForCampaign(campaignId)
  const call = calls.find((c) => c.id === callId)
  if (!call) return undefined
  const lead = getLeadsForCampaign(campaignId).find((l) => l.id === call.leadId)
  if (!lead) return undefined
  return buildCallDetail(call, lead)
}

export function getRecordingsForCampaign(campaignId: string): Recording[] {
  return buildRecordings(getCallsForCampaign(campaignId), getLeadsForCampaign(campaignId))
}
