import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { ONBOARDING_STEPS } from '@/lib/onboarding'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

export interface OnboardingProgressProps {
  currentIndex: number
  reachableMax: number
  onStepClick: (index: number) => void
}

export function OnboardingProgress({ currentIndex, reachableMax, onStepClick }: OnboardingProgressProps) {
  return (
    <nav aria-label="Onboarding progress" className="min-w-0">
      <ol className="flex gap-0 overflow-x-auto pb-1 scrollbar-none lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {ONBOARDING_STEPS.map((step, i) => {
          const done = i < currentIndex
          const current = i === currentIndex
          const clickable = i <= reachableMax || i < currentIndex
          const future = i > currentIndex && !done

          return (
            <li key={step.id} className="flex shrink-0 items-center lg:shrink lg:flex-col lg:items-stretch">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    'mx-1 hidden h-px w-6 bg-line-strong lg:mx-0 lg:my-0 lg:block lg:h-4 lg:w-px lg:self-center',
                    done && 'bg-accent/40',
                  )}
                />
              )}
              <button
                type="button"
                disabled={!clickable}
                aria-current={current ? 'step' : undefined}
                onClick={() => clickable && onStepClick(i)}
                className={cn(
                  'interactive ring-focus group flex items-center gap-2 rounded-md px-2 py-2 text-left outline-none lg:w-full lg:px-2.5',
                  current && 'bg-white/[0.06]',
                  clickable && !current && 'hover:bg-white/[0.03]',
                  !clickable && 'cursor-not-allowed opacity-40',
                )}
              >
                <span
                  className={cn(
                    'relative flex size-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold tabular',
                    done && 'bg-accent text-white',
                    current && 'bg-violet text-white shadow-[0_0_0_3px_rgb(155_140_249/0.2)]',
                    future && 'bg-surface-3 text-fg-muted ring-1 ring-line-strong',
                  )}
                >
                  {done ? <Check className="size-3" strokeWidth={3} /> : step.number.replace('0', '')}
                  {current && (
                    <motion.span
                      layoutId="onboarding-step-ring"
                      transition={spring}
                      className="absolute inset-0 rounded-full ring-1 ring-violet/50"
                      aria-hidden
                    />
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className={cn('text-2xs tabular text-fg-muted', current && 'text-violet')}>{step.number}</span>
                  <span className={cn('whitespace-nowrap text-sm font-medium', current ? 'text-fg' : 'text-fg-secondary')}>
                    {step.title}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
