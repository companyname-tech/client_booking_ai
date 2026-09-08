import type { Lead } from '@/types'
import { NOW } from '@/data/time'
import { Pencil, Phone } from 'lucide-react'
import { formatRelativeCompact, initials } from '@/lib/utils'
import { LeadScore } from './LeadScore'
import { LeadStatusBadge } from './LeadStatusBadge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CopyableName } from '@/components/ui/CopyableName'

export function LeadsTable({
  leads,
  onSelect,
  onDial,
  onEdit,
  page,
  pageSize = 15,
  onPageChange,
}: {
  leads: Lead[]
  onSelect: (lead: Lead) => void
  /** When provided, renders a Call (dial) action on each row. */
  onDial?: (lead: Lead) => void
  /** When provided, renders an Edit action on each row. */
  onEdit?: (lead: Lead) => void
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
                      <CopyableName name={lead.name} id={lead.id} compact className="font-medium text-fg" />
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
                  <div className="flex items-center justify-end gap-1">
                    {onDial && (
                      <Button variant="secondary" size="sm" leadingIcon={<Phone className="size-3.5" />} onClick={() => onDial(lead)}>
                        Call
                      </Button>
                    )}
                    {onEdit && (
                      <Button variant="ghost" size="sm" leadingIcon={<Pencil className="size-3.5" />} onClick={() => onEdit(lead)}>
                        Edit
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onSelect(lead)}>View</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 p-3 md:hidden">
        {slice.map((lead) => (
          <div key={lead.id} className="rounded-md border border-line bg-surface-1">
            <button
              type="button"
              onClick={() => onSelect(lead)}
              className="interactive w-full rounded-t-md p-3 text-left"
            >
              <div className="flex items-start justify-between">
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
            <div className="flex items-center justify-end gap-1 border-t border-line px-2 py-1.5">
              {onDial && (
                <Button variant="secondary" size="sm" leadingIcon={<Phone className="size-3.5" />} onClick={() => onDial(lead)}>
                  Call
                </Button>
              )}
              {onEdit && (
                <Button variant="ghost" size="sm" leadingIcon={<Pencil className="size-3.5" />} onClick={() => onEdit(lead)}>
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onSelect(lead)}>
                View
              </Button>
            </div>
          </div>
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
