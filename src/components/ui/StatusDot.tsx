import type { Tone } from '@/types'
import { cn } from '@/lib/utils'

const toneBg: Record<Tone, string> = {
  neutral: 'bg-fg-muted',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  violet: 'bg-violet',
}

export interface StatusDotProps {
  tone?: Tone
  /** Animated ambient ring for "in progress" states. */
  live?: boolean
  size?: number
  className?: string
}

export function StatusDot({ tone = 'neutral', live, size = 6, className }: StatusDotProps) {
  return (
    <span
      aria-hidden
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {live && (
        <span
          className={cn('absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping-ring', toneBg[tone])}
        />
      )}
      <span className={cn('relative block size-full rounded-full', toneBg[tone], live && 'motion-safe:animate-pulse-dot')} />
    </span>
  )
}
