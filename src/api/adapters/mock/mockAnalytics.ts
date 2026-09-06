import type { Analytics, CampaignHealth, MetricPoint, MetricSeries } from '@/types'
import { daysAgo } from './time'

/** Build a 14-day series that lands exactly on `end`, with a plausible shape. */
function series(end: number, shape: number[]): MetricPoint[] {
  const max = Math.max(...shape)
  return shape.map((s, i) => ({
    date: daysAgo(shape.length - 1 - i),
    value: Math.round((s / max) * end),
  }))
}

const growth = [52, 55, 54, 58, 61, 60, 66, 69, 68, 74, 78, 80, 86, 100]
const steady = [88, 91, 86, 93, 95, 90, 97, 94, 99, 96, 98, 97, 99, 100]
const wave = [70, 78, 74, 84, 80, 90, 86, 95, 91, 98, 93, 99, 96, 100]
const dip = [100, 96, 98, 92, 94, 90, 91, 88, 90, 86, 89, 87, 90, 92]

const metric = (
  key: string,
  label: string,
  value: number,
  delta: number,
  format: MetricSeries['format'],
  shape: number[],
): MetricSeries => ({ key, label, value, delta, format, history: series(value, shape) })

export const mockAnalytics: Analytics = {
  period: '7d',
  metrics: [
    metric('leadsFound', 'Leads found', 12842, 18.4, 'number', growth),
    metric('leadsContacted', 'Leads contacted', 8421, 12.1, 'number', growth),
    metric('callsCompleted', 'Calls completed', 6304, 9.6, 'number', wave),
    metric('bookings', 'Bookings', 782, 22.8, 'number', growth),
    metric('conversionRate', 'Conversion rate', 12.4, 1.2, 'percent', steady),
    metric('bookingRate', 'Booking rate', 9.3, 0.8, 'percent', steady),
    metric('detailsRequested', 'Details requested', 1128, -3.4, 'number', dip),
  ],
  budget: { used: 1842, total: 2500 },
}

export const mockCampaignHealth: CampaignHealth = {
  active: 3,
  inSetup: 1,
  awaitingApproval: 1,
  paused: 1,
  completed: 2,
}

/** Admin-level rollups across all clients. */
export const mockAdminOverview = {
  newCampaigns: 4,
  pendingApprovals: 3,
  requiringTraining: 2,
  legalReview: 1,
  activeCampaigns: 11,
  failedCampaigns: 1,
  totalClients: 27,
  totalLeads: 84210,
  totalCalls: 41880,
  bookings: 4930,
  conversionRate: 11.8,
}
