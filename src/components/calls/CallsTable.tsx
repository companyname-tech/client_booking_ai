import type { Call } from '@/types'
import type { Lead } from '@/types'
import { NOW } from '@/data/time'
import { formatRelativeCompact, formatDuration } from '@/lib/utils'
import { CallOutcomeBadge, CallSentimentBadge } from './CallBadges'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Play } from 'lucide-react'

export function CallsTable({
  calls,
  leads,
  onSelect,
}: {
  calls: Call[]
  leads: Lead[]
  onSelect: (call: Call) => void
}) {
  const leadMap = new Map(leads.map((l) => [l.id, l]))

  if (calls.length === 0) {
    return <EmptyState title="No calls yet" description="Calls will appear here as the AI reaches out to leads." />
  }

  return (
    <div className="surface overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-2xs text-fg-muted">
              <th className="px-5 py-2.5 font-medium">Lead</th>
              <th className="px-3 py-2.5 font-medium">Duration</th>
              <th className="px-3 py-2.5 font-medium">Outcome</th>
              <th className="px-3 py-2.5 font-medium">Sentiment</th>
              <th className="px-3 py-2.5 font-medium">Booking</th>
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-5 py-2.5 font-medium">Recording</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => {
              const lead = leadMap.get(call.leadId)
              return (
                <tr
                  key={call.id}
                  className="interactive border-b border-line last:border-0 hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => onSelect(call)}
                >
                  <td className="px-5 py-3 font-medium text-fg">{lead?.name ?? 'Unknown'}</td>
                  <td className="px-3 py-3 tabular text-fg-secondary">{call.durationSec ? formatDuration(call.durationSec) : '—'}</td>
                  <td className="px-3 py-3"><CallOutcomeBadge outcome={call.outcome} /></td>
                  <td className="px-3 py-3"><CallSentimentBadge sentiment={call.sentiment} /></td>
                  <td className="px-3 py-3 text-fg-secondary">{call.outcome === 'booked' ? 'Yes' : '—'}</td>
                  <td className="px-3 py-3 text-xs tabular text-fg-muted">{formatRelativeCompact(call.startedAt, NOW)}</td>
                  <td className="px-5 py-3">
                    {call.recordingUrl ? (
                      <Button variant="ghost" size="sm" leadingIcon={<Play className="size-3" />} onClick={(e) => { e.stopPropagation(); onSelect(call) }}>
                        Play
                      </Button>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 p-3 md:hidden">
        {calls.map((call) => {
          const lead = leadMap.get(call.leadId)
          return (
            <button key={call.id} type="button" onClick={() => onSelect(call)} className="interactive w-full rounded-md border border-line bg-surface-1 p-3 text-left">
              <div className="flex items-start justify-between">
                <div className="font-medium text-fg">{lead?.name}</div>
                <CallOutcomeBadge outcome={call.outcome} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-fg-muted">
                <span>{call.durationSec ? formatDuration(call.durationSec) : 'No answer'}</span>
                <span>·</span>
                <span>{formatRelativeCompact(call.startedAt, NOW)}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
