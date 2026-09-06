import type { LeadTimelineEvent } from '@/types'
import { formatDate } from '@/lib/utils'

export function LeadTimeline({ events }: { events: LeadTimelineEvent[] }) {
  return (
    <ol className="relative space-y-0">
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < events.length - 1 && (
            <span aria-hidden className="absolute left-[5px] top-3 h-[calc(100%-4px)] w-px bg-line-strong" />
          )}
          <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-accent ring-4 ring-surface-1" />
          <div className="min-w-0 flex-1">
            <time className="text-2xs text-fg-muted">{formatDate(e.timestamp)}</time>
            <div className="text-sm font-medium text-fg">{e.title}</div>
            {e.description && <p className="text-xs text-fg-muted">{e.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
