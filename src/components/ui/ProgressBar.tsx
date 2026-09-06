import { motion, useReducedMotion } from 'motion/react'
import type { Tone } from '@/types'
import { clamp, cn } from '@/lib/utils'

export interface ProgressBarProps {
  value: number // 0..100
  tone?: Tone
  size?: 'xs' | 'sm' | 'md'
  /** Segment count for a discrete look; omit for a continuous bar. */
  segments?: number
  label?: string
  className?: string
}

const toneBar: Record<Tone, string> = {
  neutral: 'bg-fg-secondary',
  info: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  violet: 'bg-violet',
}

const sizeH = { xs: 'h-[3px]', sm: 'h-1', md: 'h-1.5' }

export function ProgressBar({ value, tone = 'info', size = 'sm', segments, label, className }: ProgressBarProps) {
  const reduce = useReducedMotion()
  const pct = clamp(value, 0, 100)

  if (segments) {
    const filled = Math.round((pct / 100) * segments)
    return (
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn('flex gap-0.5', sizeH[size], className)}
      >
        {Array.from({ length: segments }, (_, i) => (
          <motion.span
            key={i}
            className={cn('flex-1 rounded-[1px]', i < filled ? toneBar[tone] : 'bg-white/[0.08]')}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02, duration: 0.2 }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('overflow-hidden rounded-full bg-white/[0.07]', sizeH[size], className)}
    >
      <motion.div
        className={cn('h-full rounded-full', toneBar[tone])}
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ type: 'spring', stiffness: 120, damping: 24, mass: 0.8 }}
        style={{ originX: 0, width: '100%' }}
      />
    </div>
  )
}
