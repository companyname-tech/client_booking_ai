import type { CampaignStatus } from '@/types'

export type AnalyticsDateRange = 7 | 30 | 90

export type AnalyticsAvailability = 'pre_launch' | 'live' | 'paused' | 'completed' | 'unavailable'

export interface AnalyticsFilters {
  dateRange: AnalyticsDateRange
  industry?: string
  companySize?: string
  location?: string
  jobTitle?: string
  age?: string
  leadStatus?: string
  segment?: string
}

export interface AnalyticsDelta {
  value: number
  format: 'percent' | 'points'
  positiveIsGood: boolean
}

export interface AnalyticsOverview {
  headline: string
  assessment: string
  bookings: number
  bookingRate: number
  conversionRate: number
  costPerBooking: number
  spend: number
  projectedBookings: number
  deltas: {
    bookings: AnalyticsDelta
    bookingRate: AnalyticsDelta
    conversionRate: AnalyticsDelta
    costPerBooking: AnalyticsDelta
    spend: AnalyticsDelta
    projectedBookings: AnalyticsDelta
  }
}

export interface AnalyticsTimePoint {
  date: string
  leads: number
  conversations: number
  detailsRequested: number
  bookings: number
}

export interface AnalyticsComparisonRow {
  label: string
  current: number
  previous: number
  delta: number
  format: 'number' | 'percent' | 'currency'
  positiveIsGood: boolean
}

export interface AnalyticsFunnelStage {
  id: string
  label: string
  count: number
  percentOfTotal: number
  conversionFromPrev?: number
}

export interface AnalyticsDropOff {
  from: string
  to: string
  dropOffPercent: number
  isBiggestOpportunity?: boolean
  currentConversion?: number
  potentialImprovement?: string
}

export interface AnalyticsInsight {
  id: string
  title: string
  value: string
  comparison?: string
  detail: string
}

export interface AnalyticsRecommendation {
  id: string
  type: 'expand' | 'optimize' | 'shift'
  title: string
  impact: 'High' | 'Medium' | 'Low'
  reason: string
}

export interface TargetingRow {
  label: string
  share: number
  leads: number
  calls: number
  bookings: number
  bookingRate: number
  highlight?: boolean
}

export interface CallPerformance {
  attempted: number
  connected: number
  avgDurationSec: number
  avgResponseSec: number
  positiveConversations: number
  interested: number
  booked: number
}

export interface CallOutcomeRow {
  label: string
  count: number
}

export interface ConversationQuality {
  score: number
  distribution: { label: string; percent: number }[]
  insight: string
}

export interface AIPerformanceMetric {
  label: string
  value: number
  delta: number
}

export interface AILearningEvent {
  day: number
  title: string
  change: string
  reason: string
  effect: string
}

export interface AIExperiment {
  id: string
  name: string
  variantA: { label: string; value: string }
  variantB: { label: string; value: string }
  winner: 'A' | 'B'
  status: 'Applied' | 'Running' | 'Completed'
}

export interface BudgetAnalytics {
  total: number
  spent: number
  remaining: number
  spendRate: number
  costPerLead: number
  costPerConversation: number
  costPerBooking: number
}

export interface CampaignForecast {
  currentBookings: number
  projected: number
  rangeLow: number
  rangeHigh: number
  completionDate: string
  confidence: 'Low' | 'Medium' | 'High'
  disclaimer: string
  factors: { label: string; value: string; tone: 'positive' | 'neutral' | 'negative' }[]
  assessment: string
}

export interface BenchmarkRow {
  label: string
  campaign: number
  benchmark: number
  format: 'percent' | 'currency'
  lowerIsBetter?: boolean
}

export interface HeatmapCell {
  day: string
  hour: string
  intensity: number // 0..1
}

export interface AIExecutiveSummary {
  headline: string
  working: string
  changing: string
  next: string
}

export interface CampaignAnalyticsData {
  campaignId: string
  availability: AnalyticsAvailability
  statusLabel: string
  conversationsAnalyzed: number
  overview: AnalyticsOverview
  timeseries: Record<AnalyticsDateRange, AnalyticsTimePoint[]>
  comparison: AnalyticsComparisonRow[]
  funnel: AnalyticsFunnelStage[]
  dropOffs: AnalyticsDropOff[]
  insights: AnalyticsInsight[]
  recommendations: AnalyticsRecommendation[]
  targeting: {
    industries: TargetingRow[]
    companySizes: TargetingRow[]
    jobTitles: TargetingRow[]
    ageGroups: TargetingRow[]
    locations: TargetingRow[]
  }
  callPerformance: CallPerformance
  callOutcomes: CallOutcomeRow[]
  conversationQuality: ConversationQuality
  aiPerformance: AIPerformanceMetric[]
  aiLearning: AILearningEvent[]
  experiments: AIExperiment[]
  budget: BudgetAnalytics
  forecast: CampaignForecast
  benchmarks: BenchmarkRow[]
  heatmap: HeatmapCell[]
  heatmapRecommendation: string
  executiveSummary: AIExecutiveSummary
  filterOptions: {
    industries: string[]
    companySizes: string[]
    locations: string[]
    jobTitles: string[]
    ages: string[]
    leadStatuses: string[]
    segments: string[]
  }
}

export const PRE_LAUNCH_STATUSES: CampaignStatus[] = [
  'draft',
  'preparing',
  'awaiting_ai_training',
  'ai_training',
  'legal_review',
  'awaiting_approval',
]
