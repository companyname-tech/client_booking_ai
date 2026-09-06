import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && (
        <div className="relative mb-4 flex size-11 items-center justify-center rounded-lg border border-line-strong bg-surface-3 text-fg-secondary shadow-1 [&>svg]:size-5">
          <span className="bg-grid absolute inset-0 rounded-lg opacity-60" aria-hidden />
          <span className="relative">{icon}</span>
        </div>
      )}
      <h3 className="text-md font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
