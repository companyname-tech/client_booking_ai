import { Link } from 'react-router-dom'
import type { LeadSegment } from '@/types/leadIntelligence'
import { formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function LeadSegments({ segments, active, onSelect }: { segments: LeadSegment[]; active?: string; onSelect: (id: string) => void }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">Smart segments</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {segments.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              'interactive rounded-lg border px-4 py-3 text-left',
              active === s.id ? 'border-accent bg-accent-soft/10' : 'border-line bg-surface-1 hover:bg-surface-2',
            )}
          >
            <div className="text-sm font-medium text-fg">{s.label}</div>
            <div className="mt-1 text-lg font-semibold tabular text-fg">{formatNumber(s.count)}</div>
            <div className="text-2xs text-fg-muted">leads</div>
          </button>
        ))}
      </div>
    </section>
  )
}

export function RecommendedLeads({ leads }: { leads: import('@/types/leadIntelligence').EnrichedLead[] }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">AI recommended leads</h2>
      <p className="mt-1 text-sm text-fg-muted">Prioritized using simulated campaign fit and engagement signals.</p>
      <ol className="mt-4 space-y-2">
        {leads.map((l, i) => (
          <li key={l.id}>
            <Link to={`/client/leads/${l.id}`} className="interactive flex items-center gap-4 rounded-lg border border-line px-4 py-3 hover:bg-surface-2">
              <span className="text-sm font-semibold tabular text-fg-muted">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-fg">{l.name}</div>
                <div className="text-xs text-fg-muted">{l.company}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold tabular text-violet">{l.score}</div>
                <div className="text-2xs text-fg-muted">{l.intentLabel} · {l.status.replace('_', ' ')}</div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
