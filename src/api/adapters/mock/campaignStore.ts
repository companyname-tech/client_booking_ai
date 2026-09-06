import type { Campaign } from '@/types'
import type { CampaignDraft } from '@/types/campaignDraft'
import { mockCampaigns } from './mockCampaigns'
import { additionalAdminCampaigns } from './mockAdminReview'
import { initAdminStore } from './adminStore'

/** In-memory campaign store — seeded from mock data, extended on submit. */
let campaigns: Campaign[] = [...mockCampaigns, ...additionalAdminCampaigns]
let initialized = false

function ensureInit() {
  if (!initialized) {
    initAdminStore(campaigns)
    initialized = true
  }
}

export function getCampaignStore(): Campaign[] {
  ensureInit()
  return campaigns
}

export function addCampaign(campaign: Campaign): Campaign {
  campaigns = [campaign, ...campaigns]
  return campaign
}

export function updateCampaign(id: string, patch: Partial<Campaign>): Campaign | undefined {
  const idx = campaigns.findIndex((c) => c.id === id)
  if (idx < 0) return undefined
  campaigns = campaigns.map((c) => (c.id === id ? { ...c, ...patch, lastActivityAt: new Date().toISOString() } : c))
  return campaigns.find((c) => c.id === id)
}

export function getCampaignById(id: string): Campaign | undefined {
  return campaigns.find((c) => c.id === id)
}

export function draftToCampaign(draft: CampaignDraft, clientId: string): Campaign {
  const id = `cmp_${Date.now()}`
  const industry = draft.target.industries.join(', ') || 'General'
  const now = new Date().toISOString()

  return {
    id,
    clientId,
    name: draft.target.campaignName,
    offerName: draft.offer.offerName,
    status: 'awaiting_approval',
    stage: 'ai_training',
    targetAudience: draft.target.industries[0]
      ? `${draft.target.industries[0]} firms`
      : draft.target.campaignName,
    geography: draft.target.geographies.join(', ') || 'United States',
    criteria: {
      industry,
      companySize: draft.target.companySize,
      decisionMakers: draft.target.decisionMakers,
      ageRange: `${draft.target.ageMin}–${draft.target.ageMax}`,
      location: draft.target.geographies.join(', '),
      other: draft.target.additionalCriteria || undefined,
    },
    budget: {
      total: draft.budget.total,
      used: 0,
      daily: draft.budget.daily,
      currency: 'USD',
      expectedDurationDays: draft.budget.durationDays,
    },
    metrics: {
      leadsFound: 0,
      leadsContacted: 0,
      callsCompleted: 0,
      bookings: 0,
      conversionRate: 0,
      bookingRate: 0,
      detailsRequested: 0,
    },
    progress: 15,
    createdAt: now,
    lastActivityAt: now,
    history: Array(14).fill(0),
  }
}
