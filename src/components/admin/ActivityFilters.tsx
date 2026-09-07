import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { ActivityLogEntry, ActivitySource } from '@/types/admin'
import { ACTIVITY_SOURCE_META } from '@/lib/activity'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

export interface ActivityFiltersState {
  search: string
  source: ActivitySource | 'all'
}

export function ActivityFilters({
  value,
  onChange,
  total,
}: {
  value: ActivityFiltersState
  onChange: (v: ActivityFiltersState) => void
  total: number
}) {
  const hasFilters = value.search.trim() !== '' || value.source !== 'all'

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
          <Input
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder="Search actions, actors, targets…"
            className="pl-9"
            aria-label="Search activity log"
          />
        </div>
        <SegmentedControl<ActivitySource | 'all'>
          value={value.source}
          onChange={(source) => onChange({ ...value, source })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'audit', label: 'Audit' },
            { value: 'cost', label: 'AI' },
            { value: 'call', label: 'Calls' },
          ]}
          className="lg:w-[320px]"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-fg-muted">
          {total} {total === 1 ? 'event' : 'events'}
          {value.source !== 'all' && ` · ${ACTIVITY_SOURCE_META[value.source].label}`}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => onChange({ search: '', source: 'all' })}
            className="inline-flex items-center gap-1 text-xs text-accent hover:text-fg"
          >
            <X className="size-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

export function useActivityFilters(entries: ActivityLogEntry[]) {
  const [filters, setFilters] = useState<ActivityFiltersState>({ search: '', source: 'all' })

  const filtered = useMemo(() => {
    let list = entries
    if (filters.source !== 'all') list = list.filter((e) => e.source === filters.source)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      list = list.filter((e) =>
        [e.action, e.actor, e.target, e.description, e.kind].some((f) => f?.toLowerCase().includes(q)),
      )
    }
    return list
  }, [entries, filters])

  return { filters, setFilters, filtered }
}
