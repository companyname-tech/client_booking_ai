import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/motion/Reveal'

export interface PageHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Render tabs or filters beneath the header. */
  children?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, children, className }: PageHeaderProps) {
  return (
    <Reveal as="div" className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2">{eyebrow}</div>}
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-fg-secondary sm:text-md">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2 *:max-sm:flex-1">{actions}</div>}
      </div>
      {children}
    </Reveal>
  )
}

/** Small "ACME GROWTH / Client Workspace" style indicator. */
export function WorkspaceEyebrow({ name, context }: { name: string; context: string }) {
  return (
    <div className="flex items-center gap-2 text-2xs">
      <span className="font-semibold uppercase tracking-[0.12em] text-accent">{name}</span>
      <span className="size-0.5 rounded-full bg-fg-faint" aria-hidden />
      <span className="font-medium uppercase tracking-[0.08em] text-fg-muted">{context}</span>
    </div>
  )
}

/** Standard page padding + max width. */
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8', className)}>{children}</div>
}
