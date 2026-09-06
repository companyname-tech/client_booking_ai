import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line-strong bg-surface-3 px-1 font-sans text-[10px] font-medium text-fg-muted shadow-[0_1px_0_rgb(255_255_255/0.05)_inset]',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
