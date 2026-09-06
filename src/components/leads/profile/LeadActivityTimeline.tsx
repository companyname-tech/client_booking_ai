import type { LeadActivityItem } from '@/types/leadIntelligence'
import { formatRelativeCompact } from '@/lib/utils'
import { NOW } from '@/data/time'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<LeadActivityItem['type'], string> = {
  discovered: 'Discovery',
  call: 'Call',
  conversation: 'Conversation',
  classification: 'AI classification',
  status: 'Status change',
  details: 'Details request',
  follow_up: 'Follow-up',
  booking: 'Booking',
  recording: 'Recording',
  note: 'Note',
}

export function LeadActivityTimeline({ items, compact }: { items: LeadActivityItem[]; compact?: boolean }) {
  if (items.length === 0) {
    return <p className="text-sm text-fg-muted">No activity recorded for this lead yet.</p>
  }

  const groups = items.reduce<Record<string, LeadActivityItem[]>>((acc, item) => {
    const key = item.group ?? 'Earlier'
    acc[key] = acc[key] ?? []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([group, groupItems]) => (
        <section key={group}>
          <h4 className="label-caps mb-3">{group}</h4>
          <ol className="space-y-0">
            {groupItems.map((item, i) => (
              <li key={item.id} className={cn('relative flex gap-4 pb-4 last:pb-0', compact && 'pb-3')}>
                {i < groupItems.length - 1 && (
                  <span aria-hidden className="absolute left-[5px] top-3 h-[calc(100%-4px)] w-px bg-line-strong" />
                )}
                <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-accent ring-4 ring-surface-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <time className="text-2xs tabular text-fg-muted">{formatRelativeCompact(item.timestamp, NOW)}</time>
                    {!compact && <span className="text-2xs text-fg-faint">{TYPE_LABELS[item.type]}</span>}
                  </div>
                  <div className="text-sm font-medium text-fg">{item.title}</div>
                  {item.description && <p className="text-xs text-fg-muted">{item.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
