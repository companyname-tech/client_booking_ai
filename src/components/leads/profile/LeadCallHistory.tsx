import type { LeadCallRef, LeadRecordingRef } from '@/types/leadIntelligence'
import { formatDurationShort } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function LeadCallHistory({
  calls,
  onSelect,
}: {
  calls: LeadCallRef[]
  onSelect: (callId: string) => void
}) {
  if (calls.length === 0) {
    return <EmptyState title="No calls yet" description="Call history will appear once the AI contacts this lead." />
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-2xs text-fg-muted">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Duration</th>
              <th className="px-3 py-2 font-medium">Outcome</th>
              <th className="px-3 py-2 font-medium">AI confidence</th>
              <th className="px-3 py-2 font-medium">Intent</th>
              <th className="px-3 py-2 font-medium">Recording</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {calls.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                <td className="px-3 py-3">{c.date}</td>
                <td className="px-3 py-3 tabular">{formatDurationShort(c.durationSec)}</td>
                <td className="px-3 py-3"><StatusBadge tone={c.outcome === 'Booked' ? 'success' : 'neutral'} size="sm">{c.outcome}</StatusBadge></td>
                <td className="px-3 py-3 tabular">{c.confidence}%</td>
                <td className="px-3 py-3 capitalize">{c.intent.replace('_', ' ')}</td>
                <td className="px-3 py-3">{c.hasRecording ? 'Available' : '—'}</td>
                <td className="px-3 py-3"><Button variant="ghost" size="sm" onClick={() => onSelect(c.id)}>Open</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 lg:hidden">
        {calls.map((c) => (
          <button key={c.id} type="button" onClick={() => onSelect(c.id)} className="interactive w-full rounded-lg border border-line bg-surface-1 p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="font-medium">{c.date}</span>
              <span className="text-xs tabular text-fg-muted">{formatDurationShort(c.durationSec)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge tone="neutral" size="sm">{c.outcome}</StatusBadge>
              <span className="text-2xs text-fg-muted">{c.confidence}% confidence</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

export function LeadRecordingsList({
  recordings,
  onSelect,
}: {
  recordings: LeadRecordingRef[]
  onSelect: (id: string) => void
}) {
  if (recordings.length === 0) {
    return <EmptyState title="No recordings" description="Recordings will appear after completed calls." />
  }

  return (
    <ul className="space-y-2">
      {recordings.map((r) => (
        <li key={r.id}>
          <button type="button" onClick={() => onSelect(r.id)} className="interactive w-full rounded-lg border border-line bg-surface-1 p-4 text-left hover:bg-surface-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-fg">{r.date}</span>
              <span className="text-xs tabular text-fg-muted">{formatDurationShort(r.durationSec)}</span>
            </div>
            <StatusBadge tone={r.outcome === 'Booked' ? 'success' : 'neutral'} size="sm" className="mt-2">{r.outcome}</StatusBadge>
            <p className="mt-2 text-sm text-fg-secondary">{r.summary}</p>
          </button>
        </li>
      ))}
    </ul>
  )
}
