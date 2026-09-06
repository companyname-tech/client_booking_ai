import type { Campaign, CampaignStatus } from '@/types'
import type {
  AnalyticsFilters,
  CampaignAnalyticsData,
  AnalyticsDateRange,
  AnalyticsTimePoint,
} from '@/types/campaignAnalytics'
import { PRE_LAUNCH_STATUSES } from '@/types/campaignAnalytics'

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function scale(n: number, factor: number): number {
  return Math.round(n * factor)
}

function filterFactor(filters: AnalyticsFilters): number {
  const active = [filters.industry, filters.companySize, filters.location, filters.jobTitle, filters.age, filters.leadStatus, filters.segment].filter(Boolean)
  if (active.length === 0) return 1
  const seed = hash(active.join('|'))
  return 0.42 + (seed % 40) / 100
}

function availabilityFor(status: CampaignStatus): CampaignAnalyticsData['availability'] {
  if (PRE_LAUNCH_STATUSES.includes(status)) return 'pre_launch'
  if (status === 'paused') return 'paused'
  if (status === 'completed') return 'completed'
  if (status === 'active') return 'live'
  return 'unavailable'
}

function buildTimeseries(total: { leads: number; conversations: number; details: number; bookings: number }, days: AnalyticsDateRange, seed: number): AnalyticsTimePoint[] {
  const points: AnalyticsTimePoint[] = []
  const weights = Array.from({ length: days }, (_, i) => 0.6 + Math.sin((i / days) * Math.PI * 2 + seed) * 0.2 + ((seed + i * 7) % 13) / 40)
  const sum = weights.reduce((a, b) => a + b, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const w = weights[days - 1 - i] / sum
    points.push({
      date: d.toISOString().slice(0, 10),
      leads: Math.max(1, Math.round(total.leads * w)),
      conversations: Math.max(0, Math.round(total.conversations * w)),
      detailsRequested: Math.max(0, Math.round(total.details * w)),
      bookings: Math.max(0, Math.round(total.bookings * w)),
    })
  }
  return points
}

/** Canonical coherent dataset — numbers relate mathematically. */
function baseSnapshot(campaign: Campaign, factor: number) {
  const isFlagship = campaign.id === 'cmp_q4_arch'
  const bookings = scale(isFlagship ? 386 : Math.max(campaign.metrics.bookings, 12), factor)
  const details = scale(isFlagship ? 842 : Math.round(bookings / 0.458), factor)
  const interested = scale(isFlagship ? 1142 : Math.round(details / 0.737), factor)
  const connected = scale(isFlagship ? 3218 : Math.round(interested / 0.355), factor)
  const contacted = scale(isFlagship ? 7842 : Math.round(connected / 0.41), factor)
  const contactable = scale(isFlagship ? 10842 : Math.round(contacted * 1.38), factor)
  const discovered = scale(isFlagship ? 12480 : Math.max(campaign.metrics.leadsFound, contacted + 200), factor)
  const spent = scale(isFlagship ? 1842 : campaign.budget.used, factor)
  const total = campaign.budget.total

  return {
    bookings,
    details,
    interested,
    connected,
    contacted,
    contactable,
    discovered,
    spent,
    total,
    bookingRate: (bookings / contacted) * 100,
    conversionRate: (bookings / connected) * 100,
    costPerBooking: spent / Math.max(bookings, 1),
    costPerLead: spent / Math.max(discovered, 1),
    costPerConversation: spent / Math.max(connected, 1),
    projected: scale(isFlagship ? 472 : Math.round(bookings * 1.22), 1),
  }
}

function buildLiveAnalytics(campaign: Campaign, filters: AnalyticsFilters): CampaignAnalyticsData {
  const factor = filterFactor(filters)
  const range = filters.dateRange
  const rangeFactor = range === 7 ? 0.28 : range === 30 ? 1 : 2.6
  const s = baseSnapshot(campaign, factor * rangeFactor)
  const seed = hash(campaign.id + JSON.stringify(filters))

  const funnel = [
    { id: 'discovered', label: 'Leads discovered', count: s.discovered, percentOfTotal: 100 },
    { id: 'contactable', label: 'Contactable', count: s.contactable, percentOfTotal: (s.contactable / s.discovered) * 100, conversionFromPrev: (s.contactable / s.discovered) * 100 },
    { id: 'contacted', label: 'Contacted', count: s.contacted, percentOfTotal: (s.contacted / s.discovered) * 100, conversionFromPrev: (s.contacted / s.contactable) * 100 },
    { id: 'connected', label: 'Connected', count: s.connected, percentOfTotal: (s.connected / s.discovered) * 100, conversionFromPrev: (s.connected / s.contacted) * 100 },
    { id: 'interested', label: 'Interested', count: s.interested, percentOfTotal: (s.interested / s.discovered) * 100, conversionFromPrev: (s.interested / s.connected) * 100 },
    { id: 'details', label: 'Details requested', count: s.details, percentOfTotal: (s.details / s.discovered) * 100, conversionFromPrev: (s.details / s.interested) * 100 },
    { id: 'booked', label: 'Booked', count: s.bookings, percentOfTotal: (s.bookings / s.discovered) * 100, conversionFromPrev: (s.bookings / s.details) * 100 },
  ]

  const dropOffs = [
    { from: 'Contacted', to: 'Connected', dropOffPercent: 100 - (s.connected / s.contacted) * 100 },
    { from: 'Connected', to: 'Interested', dropOffPercent: 100 - (s.interested / s.connected) * 100 },
    { from: 'Interested', to: 'Details', dropOffPercent: 100 - (s.details / s.interested) * 100 },
    { from: 'Details', to: 'Booking', dropOffPercent: 100 - (s.bookings / s.details) * 100, isBiggestOpportunity: true, currentConversion: (s.bookings / s.details) * 100, potentialImprovement: '+8–12%' },
  ]

  const tsTotals = { leads: s.discovered, conversations: s.connected, details: s.details, bookings: s.bookings }

  return {
    campaignId: campaign.id,
    availability: availabilityFor(campaign.status),
    statusLabel: campaign.status === 'paused' ? 'Paused' : campaign.status === 'completed' ? 'Completed' : 'Live',
    conversationsAnalyzed: s.contacted,
    overview: {
      headline: 'Campaign performance',
      assessment: s.bookingRate > 4 ? 'Your campaign is performing above target.' : 'Your campaign is building momentum.',
      bookings: s.bookings,
      bookingRate: s.bookingRate,
      conversionRate: s.conversionRate,
      costPerBooking: s.costPerBooking,
      spend: s.spent,
      projectedBookings: s.projected,
      deltas: {
        bookings: { value: 18.4, format: 'percent', positiveIsGood: true },
        bookingRate: { value: 0.8, format: 'points', positiveIsGood: true },
        conversionRate: { value: 2.1, format: 'points', positiveIsGood: true },
        costPerBooking: { value: 8.2, format: 'percent', positiveIsGood: false },
        spend: { value: 12.4, format: 'percent', positiveIsGood: true },
        projectedBookings: { value: 14.2, format: 'percent', positiveIsGood: true },
      },
    },
    timeseries: {
      7: buildTimeseries({ leads: Math.round(tsTotals.leads * 0.28), conversations: Math.round(tsTotals.conversations * 0.28), details: Math.round(tsTotals.details * 0.28), bookings: Math.round(tsTotals.bookings * 0.28) }, 7, seed),
      30: buildTimeseries(tsTotals, 30, seed + 1),
      90: buildTimeseries({ leads: Math.round(tsTotals.leads * 2.6), conversations: Math.round(tsTotals.conversations * 2.6), details: Math.round(tsTotals.details * 2.6), bookings: Math.round(tsTotals.bookings * 2.6) }, 90, seed + 2),
    },
    comparison: [
      { label: 'Leads', current: s.discovered, previous: Math.round(s.discovered * 0.86), delta: 16.3, format: 'number', positiveIsGood: true },
      { label: 'Calls', current: s.contacted, previous: Math.round(s.contacted * 0.88), delta: 13.6, format: 'number', positiveIsGood: true },
      { label: 'Conversations', current: s.connected, previous: Math.round(s.connected * 0.9), delta: 11.1, format: 'number', positiveIsGood: true },
      { label: 'Details requests', current: s.details, previous: Math.round(s.details * 0.92), delta: 8.7, format: 'number', positiveIsGood: true },
      { label: 'Bookings', current: s.bookings, previous: Math.round(s.bookings * 0.82), delta: 18.4, format: 'number', positiveIsGood: true },
      { label: 'Conversion', current: s.conversionRate, previous: s.conversionRate - 2.1, delta: 2.1, format: 'percent', positiveIsGood: true },
      { label: 'Cost / booking', current: s.costPerBooking, previous: s.costPerBooking * 1.082, delta: 8.2, format: 'currency', positiveIsGood: false },
    ],
    funnel,
    dropOffs,
    insights: [
      { id: 'seg', title: 'Strongest segment', value: 'Architecture firms · 11–50 employees', comparison: '7.8% booking rate vs 4.9% avg', detail: 'This segment converts 59% above campaign average.' },
      { id: 'dm', title: 'Best decision maker', value: 'Managing Partners', comparison: '14.2% conversion', detail: 'Highest intent when reached directly.' },
      { id: 'geo', title: 'Best geography', value: 'New York', comparison: '8.1% booking rate', detail: 'Dense prospect pool with strong fit scores.' },
      { id: 'time', title: 'Best time', value: '10:00 AM – 1:00 PM', comparison: '6.9% booking rate', detail: 'Decision makers are most reachable mid-morning.' },
      { id: 'intent', title: 'Highest intent pattern', value: '"website conversion"', comparison: 'Mentioned in 34% of booked calls', detail: 'Prospects using this language close faster.' },
    ],
    recommendations: [
      { id: 'r1', type: 'expand', title: 'Increase targeting toward 11–50 employee architecture firms.', impact: 'High', reason: 'This segment is converting 59% above campaign average.' },
      { id: 'r2', type: 'optimize', title: 'Test a shorter opening pitch.', impact: 'Medium', reason: 'Shorter openings currently produce longer conversations.' },
      { id: 'r3', type: 'shift', title: 'Prioritize calls between 10 AM and 1 PM.', impact: 'High', reason: 'Booking rate is 41% higher during this period.' },
    ],
    targeting: {
      industries: [
        { label: 'Architecture', share: 42, leads: scale(4820, factor), calls: scale(3100, factor), bookings: scale(182, factor), bookingRate: 7.6, highlight: true },
        { label: 'Construction', share: 27, leads: scale(3210, factor), calls: scale(2100, factor), bookings: scale(94, factor), bookingRate: 4.2 },
        { label: 'Interior Design', share: 18, leads: scale(2120, factor), calls: scale(1400, factor), bookings: scale(71, factor), bookingRate: 4.8 },
        { label: 'Other', share: 13, leads: scale(1330, factor), calls: scale(900, factor), bookings: scale(39, factor), bookingRate: 3.1 },
      ],
      companySizes: [
        { label: '1–10 employees', share: 18, leads: scale(2240, factor), calls: scale(1400, factor), bookings: scale(28, factor), bookingRate: 2.8 },
        { label: '11–50 employees', share: 34, leads: scale(4240, factor), calls: scale(2800, factor), bookings: scale(207, factor), bookingRate: 7.4, highlight: true },
        { label: '51–100 employees', share: 22, leads: scale(2740, factor), calls: scale(1800, factor), bookings: scale(124, factor), bookingRate: 6.9 },
        { label: '101–250 employees', share: 16, leads: scale(2000, factor), calls: scale(1300, factor), bookings: scale(55, factor), bookingRate: 4.2 },
        { label: '250+ employees', share: 10, leads: scale(1260, factor), calls: scale(800, factor), bookings: scale(17, factor), bookingRate: 2.1 },
      ],
      jobTitles: [
        { label: 'Managing Partner', share: 22, leads: scale(2740, factor), calls: scale(1800, factor), bookings: scale(164, factor), bookingRate: 9.1, highlight: true },
        { label: 'Founder', share: 18, leads: scale(2240, factor), calls: scale(1500, factor), bookings: scale(126, factor), bookingRate: 8.4 },
        { label: 'Principal', share: 20, leads: scale(2500, factor), calls: scale(1650, factor), bookings: scale(117, factor), bookingRate: 7.8 },
        { label: 'Director', share: 24, leads: scale(3000, factor), calls: scale(2000, factor), bookings: scale(104, factor), bookingRate: 5.2 },
        { label: 'VP', share: 16, leads: scale(2000, factor), calls: scale(1300, factor), bookings: scale(57, factor), bookingRate: 4.4 },
      ],
      ageGroups: [
        { label: '25–34', share: 16, leads: scale(2000, factor), calls: scale(1300, factor), bookings: scale(51, factor), bookingRate: 3.9 },
        { label: '35–44', share: 28, leads: scale(3500, factor), calls: scale(2300, factor), bookings: scale(156, factor), bookingRate: 6.8 },
        { label: '45–54', share: 32, leads: scale(4000, factor), calls: scale(2600, factor), bookings: scale(187, factor), bookingRate: 7.2, highlight: true },
        { label: '55–64', share: 24, leads: scale(2980, factor), calls: scale(1900, factor), bookings: scale(89, factor), bookingRate: 4.7 },
      ],
      locations: [
        { label: 'New York', share: 24, leads: scale(3000, factor), calls: scale(1950, factor), bookings: scale(158, factor), bookingRate: 8.1, highlight: true },
        { label: 'Chicago', share: 18, leads: scale(2240, factor), calls: scale(1450, factor), bookings: scale(99, factor), bookingRate: 6.8 },
        { label: 'Boston', share: 14, leads: scale(1750, factor), calls: scale(1140, factor), bookings: scale(71, factor), bookingRate: 6.2 },
        { label: 'Los Angeles', share: 20, leads: scale(2500, factor), calls: scale(1620, factor), bookings: scale(68, factor), bookingRate: 5.4 },
        { label: 'Austin', share: 12, leads: scale(1500, factor), calls: scale(980, factor), bookings: scale(48, factor), bookingRate: 4.9 },
      ],
    },
    callPerformance: {
      attempted: s.contacted,
      connected: s.connected,
      avgDurationSec: 222,
      avgResponseSec: 14,
      positiveConversations: scale(1842, factor),
      interested: s.interested,
      booked: s.bookings,
    },
    callOutcomes: [
      { label: 'Booked', count: s.bookings },
      { label: 'Interested', count: scale(756, factor) },
      { label: 'Details requested', count: s.details },
      { label: 'Follow-up', count: scale(614, factor) },
      { label: 'Not interested', count: scale(1024, factor) },
      { label: 'No answer', count: scale(3112, factor) },
      { label: 'Other', count: scale(1108, factor) },
    ],
    conversationQuality: {
      score: 87,
      distribution: [
        { label: 'Excellent', percent: 31 },
        { label: 'Strong', percent: 42 },
        { label: 'Average', percent: 21 },
        { label: 'Needs improvement', percent: 6 },
      ],
      insight: 'Conversations are strongest when the AI reaches the decision maker within the first 90 seconds.',
    },
    aiPerformance: [
      { label: 'Qualification accuracy', value: 94, delta: 2.1 },
      { label: 'Intent detection', value: 91, delta: 1.4 },
      { label: 'Booking conversion', value: 89, delta: 3.2 },
      { label: 'Objection handling', value: 86, delta: 4.8 },
      { label: 'Conversation completion', value: 93, delta: 1.9 },
    ],
    aiLearning: [
      { day: 1, title: 'Initial configuration', change: 'Baseline scripts deployed', reason: 'Campaign launch', effect: 'First conversations initiated' },
      { day: 3, title: 'Improved opening message', change: 'Shortened opening from 28s → 18s', reason: 'High early hang-up rate', effect: 'Conversation continuation +14%' },
      { day: 6, title: 'Better objection handling', change: 'Added relevance reframes', reason: 'Relevance objections spiked', effect: 'Interested rate +8%' },
      { day: 9, title: 'Improved qualification', change: 'Tightened company size logic', reason: 'Low-fit bookings detected', effect: 'Booking quality +12%' },
      { day: 14, title: 'Optimized booking transition', change: 'Earlier calendar offer', reason: 'Long calls without booking', effect: 'Details → booking +6%' },
      { day: 21, title: 'Improved follow-up timing', change: 'Shifted follow-up to 2hr window', reason: 'A/B test winner', effect: 'Follow-up conversion +11%' },
    ],
    experiments: [
      { id: 'e1', name: 'Opening Script A vs B', variantA: { label: 'A', value: '4.2% booking rate' }, variantB: { label: 'B', value: '5.1% booking rate' }, winner: 'B', status: 'Applied' },
      { id: 'e2', name: 'Follow-up timing', variantA: { label: '30 min', value: '3.8% conversion' }, variantB: { label: '2 hr', value: '5.4% conversion' }, winner: 'B', status: 'Applied' },
    ],
    budget: {
      total: s.total,
      spent: s.spent,
      remaining: s.total - s.spent,
      spendRate: (s.spent / s.total) * 100,
      costPerLead: s.costPerLead,
      costPerConversation: s.costPerConversation,
      costPerBooking: s.costPerBooking,
    },
    forecast: {
      currentBookings: s.bookings,
      projected: s.projected,
      rangeLow: Math.round(s.projected * 0.93),
      rangeHigh: Math.round(s.projected * 1.08),
      completionDate: 'September 28, 2026',
      confidence: 'Medium',
      disclaimer: 'Illustrative forecast based on mock campaign data.',
      factors: [
        { label: 'Current booking velocity', value: '+18%', tone: 'positive' },
        { label: 'Recent conversion trend', value: '+6%', tone: 'positive' },
        { label: 'Budget remaining', value: '26%', tone: 'neutral' },
        { label: 'Historical campaign pace', value: 'Strong', tone: 'positive' },
      ],
      assessment: 'At the current pace, the campaign is likely to exceed its original booking target.',
    },
    benchmarks: [
      { label: 'Booking rate', campaign: s.bookingRate, benchmark: 3.8, format: 'percent' },
      { label: 'Conversion', campaign: s.conversionRate, benchmark: 9.7, format: 'percent' },
      { label: 'Cost per booking', campaign: s.costPerBooking, benchmark: 6.2, format: 'currency', lowerIsBetter: true },
    ],
    heatmap: buildHeatmap(seed),
    heatmapRecommendation: 'Best window: Tuesday–Thursday, 10 AM–1 PM.',
    executiveSummary: {
      headline: 'Campaign performance is trending positively.',
      working: 'Architecture firms with 11–50 employees are driving the highest booking volume.',
      changing: 'The shorter opening script has improved conversation completion.',
      next: 'Prioritize the strongest segment and shift calling toward the highest-performing time window.',
    },
    filterOptions: {
      industries: ['All', 'Architecture', 'Construction', 'Interior Design'],
      companySizes: ['All', '1–10', '11–50', '51–100', '101–250', '250+'],
      locations: ['All', 'New York', 'Chicago', 'Boston', 'Los Angeles', 'Austin'],
      jobTitles: ['All', 'Managing Partner', 'Founder', 'Principal', 'Director', 'VP'],
      ages: ['All', '25–34', '35–44', '45–54', '55–64'],
      leadStatuses: ['All', 'Contacted', 'Interested', 'Details requested', 'Booked'],
      segments: ['All', 'High intent', 'Decision makers', 'Warm follow-up'],
    },
  }
}

function buildHeatmap(seed: number) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const hours = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM']
  const cells = []
  for (const day of days) {
    for (const hour of hours) {
      const v = 0.2 + ((hash(day + hour + String(seed)) % 80) / 100)
      cells.push({ day, hour, intensity: Math.min(1, v) })
    }
  }
  return cells
}

function buildPreLaunch(campaign: Campaign): CampaignAnalyticsData {
  const empty = buildLiveAnalytics({ ...campaign, status: 'active', metrics: { ...campaign.metrics, bookings: 0, leadsFound: 0, leadsContacted: 0, callsCompleted: 0, detailsRequested: 0, conversionRate: 0, bookingRate: 0 } }, { dateRange: 30 })
  return {
    ...empty,
    availability: 'pre_launch',
    statusLabel: 'Preparing',
    overview: { ...empty.overview, headline: 'Campaign preparation', assessment: 'Detailed analytics will become available once your campaign launches.', bookings: 0, bookingRate: 0, conversionRate: 0, costPerBooking: 0, spend: 0, projectedBookings: 0, deltas: empty.overview.deltas },
    conversationsAnalyzed: 0,
  }
}

export function getCampaignAnalytics(campaign: Campaign, filters: AnalyticsFilters): CampaignAnalyticsData {
  if (PRE_LAUNCH_STATUSES.includes(campaign.status)) return buildPreLaunch(campaign)
  return buildLiveAnalytics(campaign, filters)
}
