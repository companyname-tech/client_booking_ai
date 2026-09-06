import { Sparkles } from 'lucide-react'
import type { LeadAnalysis } from '@/types'

export function AILeadAnalysis({ analysis }: { analysis: LeadAnalysis }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-violet" />
        <h4 className="text-sm font-semibold text-fg">Why AI selected this lead</h4>
      </div>
      <p className="mt-2 text-sm text-fg-secondary">{analysis.summary}</p>
      <ul className="mt-3 space-y-1.5">
        {analysis.signals.map((s) => (
          <li key={s} className="flex items-center gap-2 text-xs text-fg-muted">
            <span className="size-1 shrink-0 rounded-full bg-accent" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
