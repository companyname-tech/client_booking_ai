import { memo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import type { CampaignStage } from '@/types'
import { CAMPAIGN_STAGES } from '@/types'
import { campaignStageMeta } from '@/lib/status'
import { cn } from '@/lib/utils'

export interface ProgressTimelineProps {
  current: CampaignStage
  /** 0..100 completion of the current stage; drives the partial fill. */
  stageProgress?: number
  orientation?: 'horizontal' | 'vertical'
  /** Compact removes descriptions — use inside tables/cards. */
  compact?: boolean
  className?: string
}

/**
 * Campaign lifecycle: ONBOARDING → AI TRAINING → LEGAL REVIEW → APPROVED →
 * CALLING → OPTIMIZATION. Shared between the Client Zone and Super Admin.
 */
export const ProgressTimeline = memo(function ProgressTimeline({
  current,
  stageProgress = 0,
  orientation = 'horizontal',
  compact,
  className,
}: ProgressTimelineProps) {
  const reduce = useReducedMotion()
  const currentIndex = CAMPAIGN_STAGES.indexOf(current)
  const steps = CAMPAIGN_STAGES.length
  // Track runs from the centre of the first node to the centre of the last.
  const fill = (currentIndex + Math.min(Math.max(stageProgress, 0), 100) / 100) / (steps - 1)

  if (orientation === 'vertical') {
    return (
      <ol className={cn('relative', className)} aria-label="Campaign lifecycle">
        {CAMPAIGN_STAGES.map((stage, i) => {
          const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'todo'
          const meta = campaignStageMeta[stage]
          return (
            <li key={stage} className="relative flex gap-3 pb-5 last:pb-0" aria-current={state === 'current' ? 'step' : undefined}>
              {i < steps - 1 && (
                <span
                  aria-hidden
                  className={cn('absolute left-[9px] top-5 h-[calc(100%-4px)] w-px', i < currentIndex ? 'bg-accent' : 'bg-line-strong')}
                />
              )}
              <Node state={state} />
              <div className="-mt-0.5 min-w-0">
                <div className={cn('text-sm font-medium', state === 'todo' ? 'text-fg-muted' : 'text-fg')}>{meta.label}</div>
                {!compact && <div className="text-xs text-fg-muted">{meta.description}</div>}
              </div>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <div className={cn('relative min-w-0 max-w-full', className)} role="group" aria-label="Campaign lifecycle">
      {/* Track */}
      <div
        aria-hidden
        className="absolute top-[9px] h-px bg-line-strong"
        style={{ left: `${100 / steps / 2}%`, right: `${100 / steps / 2}%` }}
      >
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-accent to-violet"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: fill }}
          transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 1, delay: 0.15 }}
        />
      </div>

      <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${steps}, minmax(0, 1fr))` }}>
        {CAMPAIGN_STAGES.map((stage, i) => {
          const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'todo'
          const meta = campaignStageMeta[stage]
          return (
            <li key={stage} className="flex min-w-0 flex-col items-center text-center" aria-current={state === 'current' ? 'step' : undefined}>
              <Node state={state} delay={0.1 + i * 0.05} />
              <div className="mt-2.5 min-w-0 max-w-full px-0.5">
                <div
                  className={cn(
                    'text-2xs font-semibold uppercase tracking-[0.08em] sm:text-xs sm:tracking-[0.06em]',
                    state === 'current' ? 'text-fg' : state === 'done' ? 'text-fg-secondary' : 'text-fg-faint',
                  )}
                >
                  <span className="sm:hidden">{meta.short}</span>
                  <span className="hidden sm:inline">{meta.label}</span>
                </div>
                {!compact && (
                  <div className={cn('mt-1 hidden text-2xs leading-snug text-fg-muted md:block', state === 'todo' && 'text-fg-faint')}>
                    {meta.description}
                  </div>
                )}
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
        state === 'current' && 'bg-surface-2 shadow-[0_0_0_1.5px_var(--color-violet)]',
        state === 'todo' && 'bg-surface-3 shadow-[0_0_0_1px_var(--color-line-strong)]',
      )}
    >
      {state === 'done' && <Check className="size-3" strokeWidth={3} />}
      {state === 'current' && (
        <>
          <span className="absolute inset-0 rounded-full bg-violet/40 motion-safe:animate-ping-ring" />
          <span className="relative size-[7px] rounded-full bg-violet motion-safe:animate-pulse-dot" />
        </>
      )}
      {state === 'todo' && <span className="size-1 rounded-full bg-fg-faint" />}
    </motion.span>
  )
}
