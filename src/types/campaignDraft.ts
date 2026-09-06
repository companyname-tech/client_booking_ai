import type { IntegrationState } from '@/types'

export type OnboardingStepId = 'target' | 'offer' | 'budget' | 'booking' | 'integrations' | 'review'

export const ONBOARDING_STEP_IDS: OnboardingStepId[] = [
  'target',
  'offer',
  'budget',
  'booking',
  'integrations',
  'review',
]

export interface VideoAsset {
  name: string
  size: number
  durationSec: number
  resolution: string
  mimeType: string
  previewUrl?: string
}

export interface DraftTarget {
  campaignName: string
  industries: string[]
  companySize: string
  geographies: string[]
  decisionMakers: string[]
  ageMin: number
  ageMax: number
  additionalCriteria: string
}

export interface DraftOffer {
  offerName: string
  description: string
  benefits: string[]
  pitch: string
  video?: VideoAsset
}

export interface DraftBudget {
  total: number
  daily: number
  durationDays: number
}

export type MeetingType = 'discovery' | 'demo' | 'consultation' | 'strategy'
export type NotificationChannel = 'email' | 'calendar' | 'both'

export interface DraftBooking {
  email: string
  titleTemplate: string
  meetingType: MeetingType
  durationMin: 15 | 30 | 45 | 60
  notificationChannel: NotificationChannel
}

export interface DraftIntegrations {
  gmail: IntegrationState
  calendly: IntegrationState
  zoom: IntegrationState
}

export interface CampaignDraftMeta {
  currentStep: OnboardingStepId
  startedAt: string
  lastSavedAt?: string
}

export interface CampaignDraft {
  meta: CampaignDraftMeta
  target: DraftTarget
  offer: DraftOffer
  budget: DraftBudget
  booking: DraftBooking
  integrations: DraftIntegrations
}

export function createEmptyDraft(): CampaignDraft {
  return {
    meta: {
      currentStep: 'target',
      startedAt: new Date().toISOString(),
    },
    target: {
      campaignName: '',
      industries: [],
      companySize: '',
      geographies: [],
      decisionMakers: [],
      ageMin: 30,
      ageMax: 60,
      additionalCriteria: '',
    },
    offer: {
      offerName: '',
      description: '',
      benefits: [],
      pitch: '',
    },
    budget: {
      total: 2500,
      daily: 100,
      durationDays: 25,
    },
    booking: {
      email: '',
      titleTemplate: '{company} × {client} — {product}',
      meetingType: 'discovery',
      durationMin: 30,
      notificationChannel: 'both',
    },
    integrations: {
      gmail: 'disconnected',
      calendly: 'connected',
      zoom: 'disconnected',
    },
  }
}
