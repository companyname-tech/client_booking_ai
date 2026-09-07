import type { CampaignDraft, OnboardingStepId } from '@/types/campaignDraft'
import { ONBOARDING_STEP_IDS } from '@/types/campaignDraft'

export type ValidationErrors = Partial<Record<string, string>>

export interface StepValidation {
  valid: boolean
  errors: ValidationErrors
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateTarget(draft: CampaignDraft): StepValidation {
  const errors: ValidationErrors = {}
  const { target } = draft
  if (!target.campaignName.trim()) errors.campaignName = 'OfferCampaign name is required'
  if (target.industries.length === 0) errors.industries = 'Select at least one industry'
  if (!target.companySize) errors.companySize = 'Select company size'
  if (target.geographies.length === 0) errors.geographies = 'Select at least one location'
  if (target.decisionMakers.length === 0) errors.decisionMakers = 'Select at least one decision-maker'
  if (target.ageMin >= target.ageMax) errors.ageRange = 'Minimum age must be less than maximum'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateOffer(draft: CampaignDraft): StepValidation {
  const errors: ValidationErrors = {}
  const { offer } = draft
  if (!offer.offerName.trim()) errors.offerName = 'Offer name is required'
  if (!offer.description.trim()) errors.description = 'Offer description is required'
  if (!offer.pitch.trim()) errors.pitch = 'Pitch is required so the AI knows how to explain your offer'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateBudget(draft: CampaignDraft): StepValidation {
  const errors: ValidationErrors = {}
  const { budget } = draft
  if (budget.total <= 0) errors.total = 'Enter a campaign budget greater than zero'
  if (budget.daily <= 0) errors.daily = 'Enter a daily budget greater than zero'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateBooking(draft: CampaignDraft): StepValidation {
  const errors: ValidationErrors = {}
  const { booking } = draft
  if (!booking.email.trim()) errors.email = 'Booking email is required'
  else if (!EMAIL_RE.test(booking.email)) errors.email = 'Enter a valid email address'
  if (!booking.titleTemplate.trim()) errors.titleTemplate = 'Booking title is required'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateIntegrations(_draft: CampaignDraft): StepValidation {
  return { valid: true, errors: {} }
}

export function validateReview(draft: CampaignDraft): StepValidation {
  const steps = ONBOARDING_STEP_IDS.slice(0, -1)
  const allErrors: ValidationErrors = {}
  for (const step of steps) {
    const result = validateStep(step, draft)
    if (!result.valid) Object.assign(allErrors, result.errors)
  }
  return { valid: Object.keys(allErrors).length === 0, errors: allErrors }
}

export function validateStep(step: OnboardingStepId, draft: CampaignDraft): StepValidation {
  switch (step) {
    case 'target':
      return validateTarget(draft)
    case 'offer':
      return validateOffer(draft)
    case 'budget':
      return validateBudget(draft)
    case 'booking':
      return validateBooking(draft)
    case 'integrations':
      return validateIntegrations(draft)
    case 'review':
      return validateReview(draft)
  }
}

export function stepIndex(step: OnboardingStepId): number {
  return ONBOARDING_STEP_IDS.indexOf(step)
}

export function isStepComplete(step: OnboardingStepId, draft: CampaignDraft): boolean {
  return validateStep(step, draft).valid
}

export function maxReachableStep(draft: CampaignDraft): number {
  let max = 0
  for (let i = 0; i < ONBOARDING_STEP_IDS.length - 1; i++) {
    if (!isStepComplete(ONBOARDING_STEP_IDS[i], draft)) break
    max = i + 1
  }
  return max
}

/** Readiness score 0–100 for review step. */
export function computeReadiness(draft: CampaignDraft): { score: number; items: ReadinessItem[] } {
  const items: ReadinessItem[] = [
    { id: 'target', label: 'Target audience configured', done: validateTarget(draft).valid, optional: false },
    { id: 'offer', label: 'Offer configured', done: validateOffer(draft).valid, optional: false },
    { id: 'video', label: 'OfferCampaign video uploaded', done: !!draft.offer.video, optional: false },
    { id: 'budget', label: 'Budget configured', done: validateBudget(draft).valid, optional: false },
    { id: 'booking', label: 'Booking destination configured', done: validateBooking(draft).valid, optional: false },
    { id: 'calendly', label: 'Calendly connected', done: draft.integrations.calendly === 'connected', optional: false },
    { id: 'gmail', label: 'Gmail connected', done: draft.integrations.gmail === 'connected', optional: false },
    { id: 'zoom', label: 'Zoom connected', done: draft.integrations.zoom === 'connected', optional: true },
  ]
  const required = items.filter((i) => !i.optional)
  const doneRequired = required.filter((i) => i.done).length
  const score = Math.round((doneRequired / required.length) * 100)
  return { score, items }
}

export interface ReadinessItem {
  id: string
  label: string
  done: boolean
  optional: boolean
}

/** Cosmetic targeting confidence 75–95 based on filled fields. */
export function targetingConfidence(draft: CampaignDraft): number {
  const t = draft.target
  let filled = 0
  let total = 6
  if (t.campaignName.trim()) filled++
  if (t.industries.length) filled++
  if (t.companySize) filled++
  if (t.geographies.length) filled++
  if (t.decisionMakers.length) filled++
  if (t.additionalCriteria.trim()) filled++
  return Math.round(75 + (filled / total) * 20)
}
