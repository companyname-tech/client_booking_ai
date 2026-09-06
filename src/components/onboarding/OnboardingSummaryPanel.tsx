import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function OnboardingSummaryPanel({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <aside className={cn('surface min-w-0 p-5 lg:sticky lg:top-24 lg:self-start', className)} aria-label={title}>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <div className="mt-4">{children}</div>
    </aside>
  )
}
