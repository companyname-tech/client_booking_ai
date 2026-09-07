import { cn } from '@/lib/utils'

/** Hatched overlay for blocked (unavailable) day cells. */
export function BlockedOverlay({ className, title }: { className?: string; title?: string }) {
  return (
    <div
      aria-hidden
      title={title}
      className={cn(
        'pointer-events-none absolute inset-0',
        // diagonal hatch via repeating-linear-gradient
        'bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(255,255,255,0.06)_6px_7px)]',
        className,
      )}
    />
  )
}
