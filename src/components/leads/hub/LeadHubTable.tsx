import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { EnrichedLead, LeadHubFilters } from '@/types/leadIntelligence'
import type { LeadStatus } from '@/types'
import { leadStatusMeta } from '@/lib/status'
import { NOW } from '@/data/time'
import { formatRelativeCompact, initials } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { LeadScore } from '../LeadScore'
import { LeadStatusBadge } from '../LeadStatusBadge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'

const INTENT_OPTIONS = [
  { value: 'all', label: 'All intent' },
  { value: 'very_high', label: 'Very High' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export function LeadHubFiltersBar({
  filters,
  onChange,
  campaigns,
  total,
}: {
  filters: LeadHubFilters
  onChange: (f: LeadHubFilters) => void
  campaigns: { id: string; name: string }[]
  total: number
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
        <Input value={filters.search} onChange={(e) => onChange({ ...filters, search: e.target.value })} placeholder="Search lead, company, campaign, location…" className="pl-9" />
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={filters.offerCampaignId ?? ''} onChange={(e) => onChange({ ...filters, offerCampaignId: e.target.value || undefined })} className="rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm">
          <option value="">All campaigns</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.status ?? 'all'} onChange={(e) => onChange({ ...filters, status: (e.target.value || 'all') as LeadStatus | 'all' })} className="rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          {Object.keys(leadStatusMeta).map((s) => <option key={s} value={s}>{leadStatusMeta[s as LeadStatus].label}</option>)}
        </select>
        <select value={filters.intent ?? 'all'} onChange={(e) => onChange({ ...filters, intent: e.target.value as LeadHubFilters['intent'] })} className="rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm">
          {INTENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filters.minScore ?? ''} onChange={(e) => onChange({ ...filters, minScore: e.target.value ? Number(e.target.value) : undefined })} className="rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm">
          <option value="">Any score</option>
          <option value="90">90+</option>
          <option value="80">80+</option>
          <option value="70">70+</option>
        </select>
      </div>
      <p className="text-xs text-fg-muted">{total} leads match · Simulated lead intelligence data</p>
    </div>
  )
}

export function LeadHubTable({
  leads,
  selected,
  onToggle,
  onSelect,
  page,
  pageSize = 20,
  onPageChange,
}: {
  leads: EnrichedLead[]
  selected: Set<string>
  onToggle: (id: string) => void
  onSelect: (lead: EnrichedLead) => void
  page: number
  pageSize?: number
  onPageChange: (p: number) => void
}) {
  const totalPages = Math.ceil(leads.length / pageSize)
  const slice = leads.slice((page - 1) * pageSize, page * pageSize)

  if (leads.length === 0) return <EmptyState title="No leads match these filters" description="Try adjusting your search or filters." />

  return (
    <div className="surface overflow-hidden">
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-2xs text-fg-muted">
              <th className="w-10 px-4 py-2.5" />
              <th className="px-3 py-2.5 font-medium">Lead</th>
              <th className="px-3 py-2.5 font-medium">Company</th>
              <th className="px-3 py-2.5 font-medium">Role</th>
              <th className="px-3 py-2.5 font-medium">OfferCampaign</th>
              <th className="px-3 py-2.5 font-medium">Score</th>
              <th className="px-3 py-2.5 font-medium">Intent</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Last activity</th>
              <th className="px-3 py-2.5 font-medium">Booking</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {slice.map((lead) => (
              <tr key={lead.id} className="interactive border-b border-line last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(lead.id)} onChange={() => onToggle(lead.id)} aria-label={`Select ${lead.name}`} /></td>
                <td className="px-3 py-3">
                  <Link to={`/client/leads/${lead.id}`} className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-surface-3 text-2xs font-semibold">{initials(lead.name)}</span>
                    <span className="font-medium text-fg hover:text-accent">{lead.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-fg-secondary">{lead.company}</td>
                <td className="px-3 py-3 text-fg-muted">{lead.title}</td>
                <td className="max-w-[140px] truncate px-3 py-3 text-fg-muted">{lead.campaignName}</td>
                <td className="px-3 py-3"><LeadScore score={lead.score} compact /></td>
                <td className="px-3 py-3"><StatusBadge tone={lead.intent === 'very_high' || lead.intent === 'high' ? 'success' : 'neutral'} size="sm">{lead.intentLabel}</StatusBadge></td>
                <td className="px-3 py-3"><LeadStatusBadge status={lead.status} size="sm" /></td>
                <td className="px-3 py-3 text-xs tabular text-fg-muted">{lead.lastContactAt ? formatRelativeCompact(lead.lastContactAt, NOW) : '—'}</td>
                <td className="px-3 py-3 text-xs">{lead.bookingStatus ?? '—'}</td>
                <td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={() => onSelect(lead)}>Preview</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 p-3 lg:hidden">
        {slice.map((lead) => (
          <Link key={lead.id} to={`/client/leads/${lead.id}`} className="interactive block rounded-lg border border-line bg-surface-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-fg">{lead.name}</div>
                <div className="text-sm text-fg-muted">{lead.company}</div>
                <div className="text-xs text-fg-muted">{lead.title}</div>
              </div>
              <LeadScore score={lead.score} compact />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <LeadStatusBadge status={lead.status} size="sm" />
              <StatusBadge tone="neutral" size="sm">{lead.intentLabel}</StatusBadge>
              {lead.bookingStatus && <span className="text-2xs text-success">{lead.bookingStatus}</span>}
            </div>
            <div className="mt-2 text-2xs text-fg-muted">{lead.lastContactAt ? formatRelativeCompact(lead.lastContactAt, NOW) : 'No activity'}</div>
          </Link>
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
