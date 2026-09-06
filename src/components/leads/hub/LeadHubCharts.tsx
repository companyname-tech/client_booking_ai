import { Link } from 'react-router-dom'
import type { LeadHubStats } from '@/types/leadIntelligence'
import { formatNumber } from '@/lib/utils'

export function LeadHubCharts({ stats }: { stats: LeadHubStats }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-fg">Lead status distribution</h2>
        <ul className="mt-4 space-y-2">
          {stats.statusDistribution.map((s) => (
            <li key={s.status} className="flex items-center justify-between text-sm">
              <span className="capitalize text-fg-secondary">{s.status}</span>
              <span className="font-medium tabular">{formatNumber(s.count)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-fg">Lead quality</h2>
        <ul className="mt-4 space-y-3">
          {stats.qualityDistribution.map((q) => (
            <li key={q.range}>
              <div className="flex justify-between text-xs">
                <span className="text-fg-muted">{q.range}</span>
                <span className="tabular">{q.percent}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-violet/70" style={{ width: `${q.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-fg">Lead discovery</h2>
        <ul className="mt-4 space-y-3">
          {stats.sources.map((s) => (
            <li key={s.campaignName}>
              <div className="flex justify-between text-xs">
                <span className="truncate text-fg-secondary">{s.campaignName}</span>
                <span className="tabular">{s.percent}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-accent/70" style={{ width: `${s.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export function PriorityLeads({ items }: { items: { lead: import('@/types/leadIntelligence').EnrichedLead; reason: string }[] }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">Priority leads</h2>
      <ul className="mt-4 space-y-2">
        {items.map(({ lead, reason }) => (
          <li key={lead.id}>
            <Link to={`/client/leads/${lead.id}`} className="interactive flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 hover:bg-surface-2">
              <div className="min-w-0">
                <div className="font-medium text-fg">{lead.name}</div>
                <div className="truncate text-xs text-fg-muted">{reason}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold tabular text-violet">{lead.score}</div>
                <div className="text-2xs capitalize text-fg-muted">{lead.status.replace('_', ' ')}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
