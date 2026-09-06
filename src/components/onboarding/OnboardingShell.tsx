import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, ChevronRight, Loader2, Send } from 'lucide-react'
import type { CampaignDraft } from '@/types/campaignDraft'
import { ONBOARDING_STEPS } from '@/lib/onboarding'
import { tweenBase } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { repo } from '@/data/repository'
import { useCampaignDraft } from '@/hooks/useCampaignDraft'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusDot } from '@/components/ui/StatusDot'
import { OnboardingProgress } from './OnboardingProgress'
import { OnboardingActions } from './OnboardingActions'
import { TargetStep } from './steps/TargetStep'
import { OfferStep } from './steps/OfferStep'
import { BudgetStep } from './steps/BudgetStep'
import { BookingStep } from './steps/BookingStep'
import { IntegrationsStep } from './steps/IntegrationsStep'
import { ReviewStep } from './steps/ReviewStep'
import type { ValidationErrors } from '@/lib/onboardingValidation'

export interface OnboardingShellProps {
  draftHook: ReturnType<typeof useCampaignDraft>
  onSubmit: (draft: CampaignDraft) => Promise<string>
  editMode?: boolean
  backHref?: string
}

type SubmitPhase = 'idle' | 'preparing' | 'success'

export function OnboardingShell({ draftHook, onSubmit, editMode, backHref = '/client/campaigns' }: OnboardingShellProps) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const client = repo.getCurrentClient()
  const {
    draft,
    updateDraft,
    clearDraft,
    saveAndExit,
    showSavedToast,
    currentIndex,
    reachableMax,
    goNext,
    goBack,
    goToStepIndex,
    validateCurrent,
  } = draftHook

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [advancing, setAdvancing] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle')

  const step = ONBOARDING_STEPS[currentIndex]
  const isLast = currentIndex === ONBOARDING_STEPS.length - 1

  const handleContinue = useCallback(async () => {
    const validation = validateCurrent()
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    setErrors({})
    setAdvancing(true)
    await new Promise((r) => setTimeout(r, 280))
    goNext()
    setAdvancing(false)
  }, [goNext, validateCurrent])

  const handleSaveExit = () => {
    saveAndExit()
    navigate('/client/campaigns', { state: { draftSaved: true } })
  }

  const handleSubmit = async () => {
    const validation = validateCurrent()
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }
    setSubmitPhase('preparing')
    await new Promise((r) => setTimeout(r, 600))
    const id = await onSubmit(draft)
    setSubmitPhase('success')
    await new Promise((r) => setTimeout(r, 800))
    clearDraft()
    navigate(`/client/campaigns/${id}`)
  }

  const updateTarget = (patch: Partial<CampaignDraft['target']>) =>
    updateDraft((d) => ({ ...d, target: { ...d.target, ...patch } }))
  const updateOffer = (patch: Partial<CampaignDraft['offer']>) =>
    updateDraft((d) => ({ ...d, offer: { ...d.offer, ...patch } }))
  const updateBudget = (patch: Partial<CampaignDraft['budget']>) =>
    updateDraft((d) => ({ ...d, budget: { ...d.budget, ...patch } }))
  const updateBooking = (patch: Partial<CampaignDraft['booking']>) =>
    updateDraft((d) => ({ ...d, booking: { ...d.booking, ...patch } }))
  const updateIntegrations = (patch: Partial<CampaignDraft['integrations']>) =>
    updateDraft((d) => ({ ...d, integrations: { ...d.integrations, ...patch } }))

  return (
    <PageTransition>
      <PageContainer className="space-y-6 pb-24 sm:pb-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-fg-muted">
          <Link to="/client/overview" className="interactive hover:text-fg-secondary">
            Client Workspace
          </Link>
          <ChevronRight className="size-3 shrink-0" aria-hidden />
          <Link to="/client/campaigns" className="interactive hover:text-fg-secondary">
            Campaigns
          </Link>
          <ChevronRight className="size-3 shrink-0" aria-hidden />
          <span className="text-fg-secondary">{editMode ? 'Edit campaign' : 'New Campaign'}</span>
        </nav>

        <div>
          <WorkspaceEyebrow name={client.name} context={editMode ? 'Edit onboarding' : 'New campaign'} />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">Let&apos;s build your campaign.</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-fg-secondary">
            Six short steps. Your AI Booking Agent starts learning as soon as you submit.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-fg-muted">
            <span>~5 minutes</span>
            <span className="size-0.5 rounded-full bg-fg-faint" aria-hidden />
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone="success" live size={6} />
              AI setup
            </span>
          </div>
        </div>

        {showSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed right-4 top-20 z-50 rounded-md border border-line bg-surface-2 px-4 py-2 text-sm text-fg shadow-2"
            role="status"
          >
            Draft saved · just now
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
          <OnboardingProgress
            currentIndex={currentIndex}
            reachableMax={reachableMax}
            onStepClick={(i) => {
              goToStepIndex(i)
              setErrors({})
            }}
          />

          <Card raised className="min-w-0 overflow-hidden p-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: tweenBase }}
                exit={reduce ? undefined : { opacity: 0, y: -6, transition: { duration: 0.12 } }}
              >
                <div className="border-b border-line px-5 py-4 sm:px-6">
                  <div className="label-caps">
                    Step {step.number} · {step.title}
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-fg">{step.heading}</h2>
                  <p className="mt-0.5 text-sm text-fg-muted">{step.description}</p>
                </div>

                <div className="px-5 py-5 sm:px-6">
                  {step.id === 'target' && <TargetStep draft={draft} errors={errors} onChange={updateTarget} />}
                  {step.id === 'offer' && <OfferStep draft={draft} errors={errors} onChange={updateOffer} />}
                  {step.id === 'budget' && <BudgetStep draft={draft} errors={errors} onChange={updateBudget} />}
                  {step.id === 'booking' && <BookingStep draft={draft} errors={errors} onChange={updateBooking} />}
                  {step.id === 'integrations' && <IntegrationsStep draft={draft} onChange={updateIntegrations} />}
                  {step.id === 'review' && (
                    <ReviewStep draft={draft} onEditStep={(i) => { goToStepIndex(i); setErrors({}) }} />
                  )}
                </div>

                <div className="border-t border-line px-5 py-3 sm:px-6">
                  {isLast ? (
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button variant="ghost" onClick={goBack} disabled={submitPhase !== 'idle'}>
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        size="lg"
                        className="sm:min-w-[200px]"
                        disabled={submitPhase !== 'idle'}
                        leadingIcon={
                          submitPhase === 'preparing' ? (
                            <Loader2 className="animate-spin" />
                          ) : submitPhase === 'success' ? (
                            <Check />
                          ) : (
                            <Send />
                          )
                        }
                        onClick={handleSubmit}
                      >
                        {submitPhase === 'preparing'
                          ? 'Preparing your campaign…'
                          : submitPhase === 'success'
                            ? 'Campaign submitted'
                            : 'Submit for review'}
                      </Button>
                    </div>
                  ) : (
                    <OnboardingActions
                      onBack={goBack}
                      onContinue={handleContinue}
                      onSaveExit={handleSaveExit}
                      canBack={currentIndex > 0}
                      isLastStep={false}
                      loading={advancing}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </div>

        <div className="hidden sm:block">
          <Link to={backHref} className={cn('text-xs text-fg-muted hover:text-fg-secondary')}>
            ← Cancel and return
          </Link>
        </div>
      </PageContainer>
    </PageTransition>
  )
}
