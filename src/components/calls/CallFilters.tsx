import { useMemo, useState } from 'react'
import type { Call, CallOutcome } from '@/types'
import { callOutcomeMeta } from '@/lib/status'
import { cn } from '@/lib/utils'

export interface CallFiltersState {
  outcome: CallOutcome | 'all'
}

export function CallFilters({ value, onChange, summary }: { value: CallFiltersState; onChange: (v: CallFiltersState) => void; summary: { total: number; connected: number; avgDuration: string; booked: number } }) {
  const options: (CallOutcome | 'all')[] = ['all', 'booked', 'interested', 'details_requested', 'no_answer', 'not_interested', 'voicemail']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Total calls', summary.total],
          ['Connected', summary.connected],
          ['Avg duration', summary.avgDuration],
          ['Booked', summary.booked],
        ].map(([label, val]) => (
          <div key={label} className="rounded-lg border border-line bg-surface-2 px-4 py-3">
            <div className="text-lg font-semibold tabular text-fg">{val}</div>
            <div className="text-xs text-fg-muted">{label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange({ outcome: o })}
            className={cn(
              'interactive rounded-full border px-2.5 py-1 text-xs font-medium capitalize',
              value.outcome === o ? 'border-line-strong bg-surface-3 text-fg' : 'border-line text-fg-muted',
            )}
          >
            {o === 'all' ? 'All' : callOutcomeMeta[o as CallOutcome]?.label ?? o}
          </button>
        ))}
      </div>
    </div>
  )
}

export function useCallFilters(calls: Call[]) {
  const [filters, setFilters] = useState<CallFiltersState>({ outcome: 'all' })

  const filtered = useMemo(() => {
    if (filters.outcome === 'all') return calls
    return calls.filter((c) => c.outcome === filters.outcome)
  }, [calls, filters])

  const connected = calls.filter((c) => c.durationSec > 0).length
  const avgSec = connected ? Math.round(calls.filter((c) => c.durationSec > 0).reduce((s, c) => s + c.durationSec, 0) / connected) : 0
  const summary = {
    total: calls.length,
    connected,
    avgDuration: `${Math.floor(avgSec / 60)}m ${String(avgSec % 60).padStart(2, '0')}s`,
    booked: calls.filter((c) => c.outcome === 'booked').length,
  }

  return { filters, setFilters, filtered, summary }
}
