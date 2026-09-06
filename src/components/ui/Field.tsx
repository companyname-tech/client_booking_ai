import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function FieldLabel({
  htmlFor,
  children,
  required,
  hint,
  className,
}: {
  htmlFor?: string
  children: ReactNode
  required?: boolean
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('mb-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-fg">
        {children}
        {required && <span className="ml-1 text-fg-muted" aria-hidden>·</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-danger">
      {children}
    </p>
  )
}

export function FieldGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-1', className)}>{children}</div>
}
