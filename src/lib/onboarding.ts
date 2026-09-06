import type { OnboardingStepId } from '@/types/campaignDraft'

export interface OnboardingStepMeta {
  id: OnboardingStepId
  number: string
  title: string
  short: string
  heading: string
  description: string
}

export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  {
    id: 'target',
    number: '01',
    title: 'Target',
    short: 'Target',
    heading: 'Who do you want to reach?',
    description: 'Define the people and companies your AI Booking Agent should focus on.',
  },
  {
    id: 'offer',
    number: '02',
    title: 'Offer',
    short: 'Offer',
    heading: 'What are you offering?',
    description: 'Give your AI agent the context it needs to explain your offer naturally.',
  },
  {
    id: 'budget',
    number: '03',
    title: 'Budget',
    short: 'Budget',
    heading: 'Set your campaign budget.',
    description: 'Control how much you\'d like to invest in this campaign.',
  },
  {
    id: 'booking',
    number: '04',
    title: 'Booking',
    short: 'Booking',
    heading: 'Where should your bookings go?',
    description: 'Tell us how you\'d like qualified meetings to be delivered.',
  },
  {
    id: 'integrations',
    number: '05',
    title: 'Integrations',
    short: 'Connect',
    heading: 'Connect your workflow.',
    description: 'Connect the tools your AI Booking Agent needs to manage meetings and communication.',
  },
  {
    id: 'review',
    number: '06',
    title: 'Review',
    short: 'Review',
    heading: 'Your campaign is ready for review.',
    description: 'Take a final look before sending your campaign to our team.',
  },
]

export const INDUSTRY_OPTIONS = [
  'Architecture',
  'Construction',
  'Real Estate',
  'SaaS',
  'Marketing',
  'Healthcare',
  'Finance',
  'Legal',
  'Manufacturing',
  'Consulting',
]

export const COMPANY_SIZE_OPTIONS = ['1–10', '11–50', '51–100', '101–250', '251–500', '500+']

export const GEOGRAPHY_OPTIONS = ['United States', 'Canada', 'United Kingdom', 'Australia']

export const DECISION_MAKER_OPTIONS = [
  'Founder',
  'CEO',
  'Co-Founder',
  'Partner',
  'Principal',
  'Director',
  'VP',
]

export const BENEFIT_SUGGESTIONS = [
  'Increase conversions',
  'Automate follow-up',
  'Reduce missed leads',
  'Improve booking rates',
]
