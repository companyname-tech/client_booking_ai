import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AISummary({
  summary,
  signals,
  confidence,
  className,
}: {
  summary: string
  signals?: string[]
  confidence?: number
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border border-line bg-surface-2 p-4', className)}>
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-sm bg-violet-soft text-violet">
          <Sparkles className="size-3" />
        </span>
        <span className="label-caps">AI summary</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-fg-secondary">{summary}</p>
      {signals && signals.length > 0 && (
        <ul className="mt-3 space-y-1">
          {signals.map((s) => (
            <li key={s} className="flex items-center gap-2 text-xs text-fg-muted">
              <span className="text-success">✓</span> {s}
            </li>
          ))}
        </ul>
      )}
      {confidence !== undefined && (
        <p className="mt-3 text-2xs text-fg-faint">Confidence: {confidence}%</p>
      )}
    </div>
  )
}
