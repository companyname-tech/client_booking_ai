import { Link } from 'react-router-dom'
import type { Lead } from '@/types'
import { NOW } from '@/data/time'
import { formatRelativeCompact, initials } from '@/lib/utils'
import { LeadScore } from '@/components/leads/LeadScore'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import { Button } from '@/components/ui/Button'
import { CopyableName } from '@/components/ui/CopyableName'

export function RecentLeads({
  leads,
  basePath,
  onSelect,
}: {
  leads: Lead[]
  basePath: string
  onSelect?: (lead: Lead) => void
}) {
  const recent = leads.slice(0, 8)

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h3 className="text-sm font-semibold text-fg">Recent leads</h3>
        <Link to={`${basePath}/leads`} className="text-xs font-medium text-accent hover:text-fg">
          View all →
        </Link>
      </div>
      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-2xs text-fg-muted">
              <th className="px-5 py-2 font-medium">Lead</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Activity</th>
              <th className="px-3 py-2 font-medium">Score</th>
              <th className="px-5 py-2" />
            </tr>
          </thead>
          <tbody>
            {recent.map((lead) => (
              <tr key={lead.id} className="interactive border-b border-line last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-2xs font-semibold text-fg-secondary">
                      {initials(lead.name)}
                    </span>
                    <div className="min-w-0">
                      <CopyableName name={lead.name} id={lead.id} compact className="font-medium text-fg" />
                      <div className="truncate text-xs text-fg-muted">{lead.company} · {lead.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-fg-secondary">{lead.location}</td>
                <td className="px-3 py-3"><LeadStatusBadge status={lead.status} size="sm" /></td>
                <td className="px-3 py-3 text-xs tabular text-fg-muted">
                  {lead.lastContactAt ? formatRelativeCompact(lead.lastContactAt, NOW) : '—'}
                </td>
                <td className="px-3 py-3"><LeadScore score={lead.score} compact /></td>
                <td className="px-5 py-3">
                  <Button variant="ghost" size="sm" onClick={() => onSelect?.(lead)}>View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 p-3 sm:hidden">
        {recent.map((lead) => (
          <button
            key={lead.id}
            type="button"
            onClick={() => onSelect?.(lead)}
            className="interactive w-full rounded-md border border-line bg-surface-1 p-3 text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CopyableName name={lead.name} id={lead.id} compact className="font-medium text-fg" />
                <div className="text-xs text-fg-muted">{lead.company}</div>
              </div>
              <LeadScore score={lead.score} compact />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <LeadStatusBadge status={lead.status} size="sm" />
              <span className="text-2xs text-fg-muted">{lead.location}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
