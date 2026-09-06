import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CampaignDraft, OnboardingStepId } from '@/types/campaignDraft'
import { createEmptyDraft, ONBOARDING_STEP_IDS } from '@/types/campaignDraft'
import { maxReachableStep, stepIndex, validateStep } from '@/lib/onboardingValidation'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { env } from '@/config/environment'

const STORAGE_KEY = env.storageKeys.campaignDraft

export interface UseCampaignDraftOptions {
  /** When editing an existing campaign, seed from this partial draft */
  initial?: Partial<CampaignDraft>
  /** Skip localStorage restore (e.g. when editing existing campaign) */
  skipRestore?: boolean
}

export function useCampaignDraft(options: UseCampaignDraftOptions = {}) {
  const [stored, setStored] = useLocalStorage<CampaignDraft | null>(STORAGE_KEY, null)
  const [draft, setDraftState] = useState<CampaignDraft>(() => {
    if (options.skipRestore) {
      return mergeDraft(createEmptyDraft(), options.initial)
    }
    if (stored) return stored
    return mergeDraft(createEmptyDraft(), options.initial)
  })
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    stored?.meta.lastSavedAt ? new Date(stored.meta.lastSavedAt) : null,
  )
  const [showSavedToast, setShowSavedToast] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipPersist = options.skipRestore

  const persist = useCallback(
    (next: CampaignDraft, explicit = false) => {
      const withMeta = {
        ...next,
        meta: { ...next.meta, lastSavedAt: new Date().toISOString() },
      }
      setDraftState(withMeta)
      if (!skipPersist) {
        setStored(withMeta)
        setLastSavedAt(new Date())
        if (explicit) {
          setShowSavedToast(true)
          window.setTimeout(() => setShowSavedToast(false), 3000)
        }
      }
    },
    [setStored, skipPersist],
  )

  const updateDraft = useCallback(
    (patch: Partial<CampaignDraft> | ((prev: CampaignDraft) => CampaignDraft)) => {
      setDraftState((prev) => {
        const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          if (!skipPersist) {
            const withMeta = { ...next, meta: { ...next.meta, lastSavedAt: new Date().toISOString() } }
            setStored(withMeta)
            setLastSavedAt(new Date())
          }
        }, 500)
        return next
      })
    },
    [setStored, skipPersist],
  )

  const setStep = useCallback(
    (step: OnboardingStepId) => {
      updateDraft((d) => ({ ...d, meta: { ...d.meta, currentStep: step } }))
    },
    [updateDraft],
  )

  const clearDraft = useCallback(() => {
    setStored(null)
    setDraftState(createEmptyDraft())
    setLastSavedAt(null)
  }, [setStored])

  const saveAndExit = useCallback(() => {
    persist(draft, true)
  }, [draft, persist])

  const currentIndex = stepIndex(draft.meta.currentStep)
  const reachableMax = useMemo(() => maxReachableStep(draft), [draft])

  const canGoToStep = useCallback(
    (index: number) => index <= reachableMax || index <= currentIndex,
    [reachableMax, currentIndex],
  )

  const goNext = useCallback(() => {
    const validation = validateStep(draft.meta.currentStep, draft)
    if (!validation.valid) return validation
    const nextIndex = Math.min(currentIndex + 1, ONBOARDING_STEP_IDS.length - 1)
    setStep(ONBOARDING_STEP_IDS[nextIndex])
    return validation
  }, [currentIndex, draft, setStep])

  const goBack = useCallback(() => {
    if (currentIndex > 0) setStep(ONBOARDING_STEP_IDS[currentIndex - 1])
  }, [currentIndex, setStep])

  const goToStepIndex = useCallback(
    (index: number) => {
      if (!canGoToStep(index)) return false
      setStep(ONBOARDING_STEP_IDS[index])
      return true
    },
    [canGoToStep, setStep],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return {
    draft,
    updateDraft,
    setStep,
    clearDraft,
    saveAndExit,
    lastSavedAt,
    showSavedToast,
    currentIndex,
    reachableMax,
    canGoToStep,
    goNext,
    goBack,
    goToStepIndex,
    validateCurrent: () => validateStep(draft.meta.currentStep, draft),
  }
}

function mergeDraft(base: CampaignDraft, initial?: Partial<CampaignDraft>): CampaignDraft {
  if (!initial) return base
  return {
    ...base,
    ...initial,
    meta: { ...base.meta, ...initial.meta },
    target: { ...base.target, ...initial.target },
    offer: { ...base.offer, ...initial.offer },
    budget: { ...base.budget, ...initial.budget },
    booking: { ...base.booking, ...initial.booking },
    integrations: { ...base.integrations, ...initial.integrations },
  }
}
