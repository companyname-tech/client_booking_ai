import type { HTMLAttributes } from 'react'
import type { Tone } from '@/types'
import { cn } from '@/lib/utils'
import { StatusDot } from './StatusDot'

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  live?: boolean
  size?: 'sm' | 'md'
  /** Render as a plain text + dot without the pill background. */
  subtle?: boolean
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-white/[0.05] text-fg-secondary border-white/[0.08]',
  info: 'bg-info-soft text-info border-info/20',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  violet: 'bg-violet-soft text-violet border-violet/20',
}

export function StatusBadge({ tone = 'neutral', live, size = 'sm', subtle, className, children, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap font-medium tabular',
        subtle
          ? cn('text-fg-secondary', size === 'sm' ? 'text-xs' : 'text-sm')
          : cn(
              'rounded-full border',
              size === 'sm' ? 'h-5 px-2 text-2xs' : 'h-6 px-2.5 text-xs',
              toneClasses[tone],
            ),
        className,
      )}
      {...props}
    >
      <StatusDot tone={tone} live={live} size={size === 'sm' ? 6 : 7} />
      {children}
    </span>
  )
}
