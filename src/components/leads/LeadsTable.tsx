import type { Lead } from '@/types'
import { NOW } from '@/data/time'
import { formatRelativeCompact, initials } from '@/lib/utils'
import { LeadScore } from './LeadScore'
import { LeadStatusBadge } from './LeadStatusBadge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function LeadsTable({
  leads,
  onSelect,
  page,
  pageSize = 15,
  onPageChange,
}: {
  leads: Lead[]
  onSelect: (lead: Lead) => void
  page: number
  pageSize?: number
  onPageChange: (p: number) => void
}) {
  const totalPages = Math.ceil(leads.length / pageSize)
  const slice = leads.slice((page - 1) * pageSize, page * pageSize)

  if (leads.length === 0) {
    return <EmptyState title="No leads match your filters" description="Try adjusting your search or filters." />
  }

  return (
    <div className="surface overflow-hidden">
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-2xs text-fg-muted">
              <th className="px-5 py-2.5 font-medium">Lead</th>
              <th className="px-3 py-2.5 font-medium">Location</th>
              <th className="px-3 py-2.5 font-medium">Score</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Last activity</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {slice.map((lead) => (
              <tr
                key={lead.id}
                className="interactive border-b border-line last:border-0 hover:bg-white/[0.02] focus-within:bg-white/[0.02]"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-2xs font-semibold text-fg-secondary">
                      {initials(lead.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-fg">{lead.name}</div>
                      <div className="truncate text-xs text-fg-muted">{lead.company} · {lead.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-fg-secondary">{lead.location}</td>
                <td className="px-3 py-3"><LeadScore score={lead.score} compact /></td>
                <td className="px-3 py-3"><LeadStatusBadge status={lead.status} size="sm" /></td>
                <td className="px-3 py-3 text-xs tabular text-fg-muted">
                  {lead.lastContactAt ? formatRelativeCompact(lead.lastContactAt, NOW) : '—'}
                </td>
                <td className="px-5 py-3">
                  <Button variant="ghost" size="sm" onClick={() => onSelect(lead)}>View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 p-3 md:hidden">
        {slice.map((lead) => (
          <button
            key={lead.id}
            type="button"
            onClick={() => onSelect(lead)}
            className="interactive w-full rounded-md border border-line bg-surface-1 p-3 text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-fg">{lead.name}</div>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
          <span className="text-xs tabular text-fg-muted">Page {page} of {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
