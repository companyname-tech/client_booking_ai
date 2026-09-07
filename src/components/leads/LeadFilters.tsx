import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Lead, LeadStatus } from '@/types'
import { leadStatusMeta } from '@/lib/status'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export interface LeadFiltersState {
  search: string
  statuses: LeadStatus[]
  minScore: number | null
}

export function LeadFilters({
  value,
  onChange,
  total,
}: {
  value: LeadFiltersState
  onChange: (v: LeadFiltersState) => void
  total: number
}) {
  const statusOptions = Object.keys(leadStatusMeta) as LeadStatus[]

  const chips = [
    ...value.statuses.map((s) => ({ key: `status-${s}`, label: `Status: ${leadStatusMeta[s].label}`, clear: () => onChange({ ...value, statuses: value.statuses.filter((x) => x !== s) }) })),
    ...(value.minScore ? [{ key: 'score', label: `Score: ${value.minScore}+`, clear: () => onChange({ ...value, minScore: null }) }] : []),
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
          <Input
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder="Search leads…"
            className="pl-9"
            aria-label="Search leads"
          />
        </div>
        <Select
          value={value.statuses[0] ?? ''}
          onChange={(v) => onChange({ ...value, statuses: v ? ([v] as LeadStatus[]) : [] })}
          ariaLabel="Filter by status"
          options={[
            { value: '', label: 'All statuses' },
            ...statusOptions.map((s) => ({ value: s, label: leadStatusMeta[s].label })),
          ]}
          className="w-full sm:w-44"
        />
        <Select
          value={value.minScore ? String(value.minScore) : ''}
          onChange={(v) => onChange({ ...value, minScore: v ? Number(v) : null })}
          ariaLabel="Filter by score"
          options={[
            { value: '', label: 'Any score' },
            { value: '80', label: '80+' },
            { value: '70', label: '70+' },
            { value: '60', label: '60+' },
          ]}
          className="w-full sm:w-36"
        />
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-fg-secondary">
              {c.label}
              <button type="button" onClick={c.clear} aria-label={`Remove ${c.label}`}><X className="size-3" /></button>
            </span>
          ))}
          <button type="button" onClick={() => onChange({ search: '', statuses: [], minScore: null })} className="text-xs text-accent hover:text-fg">
            Clear all
          </button>
        </div>
      )}
      <p className="text-xs text-fg-muted">{total} prospects discovered for this campaign.</p>
    </div>
  )
}

export function useLeadFilters(leads: Lead[]) {
  const [filters, setFilters] = useState<LeadFiltersState>({ search: '', statuses: [], minScore: null })

  const filtered = useMemo(() => {
    let list = leads
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

  return { filters, setFilters, filtered }
}
