import { cn } from '@/lib/utils'

const SCORE_LABELS: [number, string][] = [
  [90, 'Excellent match'],
  [80, 'Strong match'],
  [70, 'Good match'],
  [60, 'Moderate match'],
  [0, 'Low match'],
]

function scoreLabel(score: number) {
  return SCORE_LABELS.find(([min]) => score >= min)?.[1] ?? 'Low match'
}

export function LeadScore({ score, compact }: { score: number; compact?: boolean }) {
  const label = scoreLabel(score)
  const tone = score >= 90 ? 'text-success' : score >= 80 ? 'text-violet' : score >= 70 ? 'text-accent' : 'text-fg-muted'

  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1 tabular', tone)}>
        <span className="text-sm font-semibold">{score}</span>
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-2xl font-semibold tabular', tone)}>{score}</span>
      <span className="text-xs text-fg-muted">{label}</span>
    </div>
  )
}
