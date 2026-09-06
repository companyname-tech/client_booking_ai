import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean
  /** Remove internal padding — for tables / lists. */
  flush?: boolean
}

export function Card({ raised, flush, className, ...props }: CardProps) {
  return <div className={cn(raised ? 'surface-raised' : 'surface', !flush && 'p-5', className)} {...props} />
}

export interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  eyebrow?: ReactNode
  className?: string
}

/** Compact section header used above cards, tables and lists. */
export function SectionHeader({ title, description, action, eyebrow, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="label-caps mb-1">{eyebrow}</div>}
        <h2 className="text-md font-semibold text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
