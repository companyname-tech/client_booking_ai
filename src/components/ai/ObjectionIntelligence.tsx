import type { AIObjection, AILearningPattern, AIImprovement } from '@/types/aiCommand'
import { formatPercent } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ObjectionIntelligence({ objections }: { objections: AIObjection[] }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">Top Objections</h2>
      <p className="mt-1 text-sm text-fg-muted">AI analysis</p>
      <div className="mt-4 space-y-3">
        {objections.map((o) => (
          <div key={o.id} className="rounded-lg border border-line bg-surface-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-fg">{o.label}</div>
                <div className="text-2xs text-fg-muted">{o.occurrences.toLocaleString()} occurrences</div>
              </div>
              <span className={cn('inline-flex items-center gap-0.5 text-2xs font-medium', o.trend < 0 ? 'text-success' : 'text-warning')}>
                {o.trend < 0 ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
                {Math.abs(o.trend)}%
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-fg-muted">Resolution</span><div className="font-semibold tabular">{formatPercent(o.resolutionRate)}</div></div>
              <div><span className="text-fg-muted">Booking after objection</span><div className="font-semibold tabular">{formatPercent(o.bookingRate)}</div></div>
            </div>
            {o.strategy && <p className="mt-2 text-2xs text-fg-muted">Strategy: {o.strategy}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

export function AIResponsePerformance({ objections }: { objections: AIObjection[] }) {
  const best = [...objections].sort((a, b) => b.bookingRate - a.bookingRate)[0]
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">How the AI handles objections</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {objections.slice(0, 4).map((o) => (
          <div key={o.id} className="rounded-lg border border-line p-4">
            <div className="text-sm font-medium text-fg">&ldquo;{o.label}&rdquo;</div>
            <div className="mt-2 text-xs text-fg-muted">Strategy: {o.strategy}</div>
            <div className="mt-2 flex gap-4 text-xs">
              <span>Resolution: <strong>{formatPercent(o.resolutionRate)}</strong></span>
              <span>Booking: <strong>{formatPercent(o.bookingRate)}</strong></span>
            </div>
          </div>
        ))}
      </div>
      {best && <p className="mt-3 text-sm text-accent">Best performing strategy: {best.strategy} ({formatPercent(best.bookingRate)} booking rate)</p>}
    </section>
  )
}

export function LearnedPatterns({ patterns }: { patterns: AILearningPattern[] }) {
  return (
    <div className="space-y-3">
      {patterns.map((p) => (
        <div key={p.id} className="rounded-lg border border-line bg-surface-1 p-4">
          <p className="text-sm text-fg-secondary">{p.pattern}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-2xs text-fg-muted">
            <span>Confidence: {p.confidence}%</span>
            <span>Observed: {p.observed} conversations</span>
            <span>Impact: {p.impact}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AIImprovementTimeline({ items }: { items: AIImprovement[] }) {
  return (
    <ol className="space-y-3">
      {items.map((i) => (
        <li key={i.id} className="rounded-lg border border-line bg-surface-1 p-4">
          <div className="text-2xs text-violet">{i.date}</div>
          <div className="font-medium text-fg">{i.title}</div>
          <div className="mt-1 text-sm text-success">{i.impact}</div>
        </li>
      ))}
    </ol>
  )
}
