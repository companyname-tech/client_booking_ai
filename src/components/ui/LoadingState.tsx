import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-sm bg-white/[0.05]', className)} aria-hidden>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent motion-safe:animate-shimmer" />
    </div>
  )
}

export interface LoadingStateProps {
  /** Rows of skeleton lines to render. */
  rows?: number
  className?: string
  label?: string
}

export function LoadingState({ rows = 4, className, label = 'Loading' }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className={cn('space-y-3 p-5', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-7 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-[42%]" />
            <Skeleton className="h-2.5 w-[68%]" />
          </div>
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  )
}

/** Full-page fallback for lazy routes. */
export function PageLoading() {
  return (
    <div className="p-6 lg:p-8" aria-busy>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-72 max-w-full" />
      <Skeleton className="mt-2 h-3 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-surface-2 p-4">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-3 h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
