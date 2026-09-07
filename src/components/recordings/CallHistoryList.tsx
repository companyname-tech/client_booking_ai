import { useMemo, useState } from 'react'
import type { CallHistoryEntry } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { RecordingAudio } from '@/components/recordings/RecordingAudio'
import { callOutcomeLabel, fmtDuration, fmtWhen } from '@/lib/callHistory'

function newestFirst(recordings: CallHistoryEntry[]): CallHistoryEntry[] {
  return [...recordings].sort((a, b) =>
    (b.startedAt || b.id || '').localeCompare(a.startedAt || a.id || ''),
  )
}

export function CallHistoryList({ recordings }: { recordings: CallHistoryEntry[] }) {
  const [search, setSearch] = useState('')
  const [outcome, setOutcome] = useState('all')

  const distinctOutcomes = useMemo(
    () => Array.from(new Set(recordings.map((r) => r.outcome))).filter(Boolean).sort(),
    [recordings],
  )

  const filtered = useMemo(() => {
    let list = newestFirst(recordings)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) => r.leadName.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q),
      )
    }
    if (outcome !== 'all') list = list.filter((r) => r.outcome === outcome)
    return list
  }, [recordings, search, outcome])

  if (recordings.length === 0) {
    return (
      <EmptyState
        title="No recorded calls yet"
        description="A recording appears here after each completed call."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by lead or phone…"
          className="sm:max-w-xs"
        />
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          aria-label="Filter by outcome"
        >
          <option value="all">All outcomes</option>
          {distinctOutcomes.map((o) => (
            <option key={o} value={o}>
              {callOutcomeLabel(o)}
            </option>
          ))}
        </select>
        <span className="self-center text-xs text-fg-muted">
          {filtered.length} of {recordings.length} recordings
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matching recordings" description="Try a different search or filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-1">
                {['When', 'Lead', 'Phone', 'Outcome', 'Duration', 'Recording'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => (
                <tr key={rec.id} className="border-b border-line/50 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{fmtWhen(rec.startedAt)}</td>
                  <td className="px-3 py-2 font-medium text-fg">{rec.leadName || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{rec.phone || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{callOutcomeLabel(rec.outcome)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{fmtDuration(rec.durationSec)}</td>
                  <td className="px-3 py-2">
                    {rec.audioUrl ? (
                      <RecordingAudio src={rec.audioUrl} rowKey={rec.id} className="max-w-[280px]" />
                    ) : (
                      <span className="text-fg-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
