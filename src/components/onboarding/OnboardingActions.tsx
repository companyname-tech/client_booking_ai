import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface OnboardingActionsProps {
  onBack: () => void
  onContinue: () => void
  onSaveExit: () => void
  canBack: boolean
  isLastStep: boolean
  continueLabel?: string
  loading?: boolean
  continueDisabled?: boolean
}

export function OnboardingActions({
  onBack,
  onContinue,
  onSaveExit,
  canBack,
  isLastStep,
  continueLabel,
  loading,
  continueDisabled,
}: OnboardingActionsProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-bg/80',
        'sm:static sm:mx-0 sm:mt-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" leadingIcon={<ArrowLeft />} onClick={onBack} disabled={!canBack || loading}>
          Back
        </Button>
        <Button variant="ghost" onClick={onSaveExit} disabled={loading} className="hidden sm:inline-flex">
          Save & exit
        </Button>
        {!isLastStep ? (
          <Button
            variant="primary"
            trailingIcon={loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight />}
            onClick={onContinue}
            disabled={continueDisabled || loading}
          >
            {loading ? 'Saving…' : continueLabel ?? 'Continue'}
          </Button>
        ) : null}
      </div>
      <Button variant="ghost" onClick={onSaveExit} disabled={loading} className="mt-2 w-full sm:hidden">
        Save & exit
      </Button>
    </div>
  )
}
