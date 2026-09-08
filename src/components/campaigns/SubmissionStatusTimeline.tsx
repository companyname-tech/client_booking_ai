import { memo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'onboarding', label: 'Onboarding', short: 'Onboard' },
  { id: 'legal_review', label: 'Legal Review', short: 'Legal' },
  { id: 'approval', label: 'Approval', short: 'Approve' },
  { id: 'launch', label: 'Campaign Launch', short: 'Launch' },
] as const

export interface SubmissionStatusTimelineProps {
  className?: string
}

/**
 * Post-submission review timeline for campaigns awaiting approval.
 * Separate from ProgressTimeline to avoid breaking active campaign views.
 */
export const SubmissionStatusTimeline = memo(function SubmissionStatusTimeline({
  className,
}: SubmissionStatusTimelineProps) {
  const reduce = useReducedMotion()
  const currentIndex = 2 // Approval pending after onboarding and legal review

  return (
    <div className={cn('relative min-w-0 max-w-full', className)} role="group" aria-label="Submission status">
      <div
        aria-hidden
        className="absolute top-[9px] h-px bg-line-strong"
        style={{ left: `${100 / STEPS.length / 2}%`, right: `${100 / STEPS.length / 2}%` }}
      >
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-accent to-violet"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: currentIndex / (STEPS.length - 1) }}
          transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 1, delay: 0.15 }}
        />
      </div>

      <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}>
        {STEPS.map((step, i) => {
          const done = i < currentIndex
          const current = i === currentIndex
          const state = done ? 'done' : current ? 'current' : 'todo'

          return (
            <li key={step.id} className="flex min-w-0 flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
              <Node state={state} delay={0.1 + i * 0.05} />
              <div className="mt-2.5 min-w-0 max-w-full px-0.5">
                <div
                  className={cn(
                    'text-2xs font-semibold uppercase tracking-[0.08em] sm:text-xs',
                    state === 'current' ? 'text-fg' : state === 'done' ? 'text-fg-secondary' : 'text-fg-faint',
                  )}
                >
                  <span className="sm:hidden">{step.short}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                <div className={cn('mt-1 text-2xs leading-snug', done ? 'text-success' : current ? 'text-warning' : 'text-fg-faint')}>
                  {done ? 'Complete' : current ? 'Pending' : 'Pending'}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
})

function Node({ state, delay = 0 }: { state: 'done' | 'current' | 'todo'; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.span
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26, delay }}
      className={cn(
        'relative z-10 flex size-[19px] shrink-0 items-center justify-center rounded-full ring-4 ring-surface-2',
        state === 'done' && 'bg-accent text-white',
        state === 'current' && 'bg-surface-2 shadow-[0_0_0_1.5px_var(--color-warning)]',
        state === 'todo' && 'bg-surface-3 shadow-[0_0_0_1px_var(--color-line-strong)]',
      )}
    >
      {state === 'done' && <Check className="size-3" strokeWidth={3} />}
      {state === 'current' && (
        <>
          <span className="absolute inset-0 rounded-full bg-warning/40 motion-safe:animate-ping-ring" />
          <span className="relative size-[7px] rounded-full bg-warning motion-safe:animate-pulse-dot" />
        </>
      )}
      {state === 'todo' && <span className="size-1 rounded-full bg-fg-faint" />}
    </motion.span>
  )
}
