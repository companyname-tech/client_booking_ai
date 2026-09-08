import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Lead, LeadStatus } from '@/types'
import { leadStatusMeta } from '@/lib/status'
import {
  LEAD_VERIFICATION_SECTIONS,
  leadVerificationGroup,
  type LeadVerificationGroup,
} from '@/lib/leadVerification'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export interface LeadFiltersState {
  search: string
  verificationGroup: LeadVerificationGroup
  statuses: LeadStatus[]
  minScore: number | null
}

export function LeadFilters({
  value,
  onChange,
  total,
  counts,
}: {
  value: LeadFiltersState
  onChange: (v: LeadFiltersState) => void
  total: number
  counts?: Record<LeadVerificationGroup, number>
}) {
  const statusOptions = Object.keys(leadStatusMeta) as LeadStatus[]

  const toggleStatus = (status: LeadStatus) => {
    const next = value.statuses.includes(status)
      ? value.statuses.filter((s) => s !== status)
      : [...value.statuses, status]
    onChange({ ...value, statuses: next })
  }

  const chips = [
    ...(value.minScore
      ? [{ key: 'score', label: `Score: ${value.minScore}+`, clear: () => onChange({ ...value, minScore: null }) }]
      : []),
    ...value.statuses.map((s) => ({
      key: `status-${s}`,
      label: leadStatusMeta[s].label,
      clear: () => onChange({ ...value, statuses: value.statuses.filter((x) => x !== s) }),
    })),
  ]

  return (
    <div className="space-y-4">
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
        <Input
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder="Search leads…"
          className="pl-9"
          aria-label="Search leads"
        />
      </div>

      <section aria-label="Verification">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Verification</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEAD_VERIFICATION_SECTIONS.map((section) => {
            const active = value.verificationGroup === section.id
            const count = counts?.[section.id]
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onChange({ ...value, verificationGroup: section.id })}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-surface-2 text-fg-secondary hover:border-line-strong hover:text-fg',
                )}
              >
                {section.label}
                {count !== undefined && <span className="ml-1.5 tabular text-fg-muted">{count}</span>}
              </button>
            )
          })}
        </div>
      </section>

      <section aria-label="Lead status">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Status</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {statusOptions.map((status) => {
            const active = value.statuses.includes(status)
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-2xs font-medium transition-colors',
                  active
                    ? 'border-accent/50 bg-accent-soft/40 text-accent'
                    : 'border-line bg-surface-1 text-fg-muted hover:text-fg-secondary',
                )}
              >
                {leadStatusMeta[status].label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-fg-muted">Min score:</span>
        {[80, 70, 60].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange({ ...value, minScore: value.minScore === score ? null : score })}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-2xs font-medium',
              value.minScore === score
                ? 'border-warning/50 bg-warning-soft/20 text-warning'
                : 'border-line text-fg-muted hover:text-fg-secondary',
            )}
          >
            {score}+
          </button>
        ))}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-fg-secondary">
              {c.label}
              <button type="button" onClick={c.clear} aria-label={`Remove ${c.label}`}><X className="size-3" /></button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange({ search: '', verificationGroup: 'all', statuses: [], minScore: null })}
            className="text-xs text-accent hover:text-fg"
          >
            Clear all
          </button>
        </div>
      )}

      <p className="text-xs text-fg-muted">{total} prospects discovered for this campaign.</p>
    </div>
  )
}

export function useLeadFilters(leads: Lead[]) {
  const [filters, setFilters] = useState<LeadFiltersState>({
    search: '',
    verificationGroup: 'all',
    statuses: [],
    minScore: null,
  })

  const counts = useMemo(() => {
    const base: Record<LeadVerificationGroup, number> = { all: leads.length, new: 0, approved: 0, rejected: 0 }
    for (const lead of leads) {
      const group = leadVerificationGroup(lead.verificationStatus)
      base[group] += 1
    }
    return base
  }, [leads])

  const filtered = useMemo(() => {
    let list = leads
    if (filters.verificationGroup !== 'all') {
      list = list.filter((l) => leadVerificationGroup(l.verificationStatus) === filters.verificationGroup)
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      list = list.filter((l) =>
        [l.name, l.company, l.title, l.location, l.industry].some((f) => f?.toLowerCase().includes(q)),
      )
    }
    if (filters.statuses.length) list = list.filter((l) => filters.statuses.includes(l.status))
    if (filters.minScore) list = list.filter((l) => l.score >= filters.minScore!)
    return list
  }, [leads, filters])

  return { filters, setFilters, filtered, counts }
}
