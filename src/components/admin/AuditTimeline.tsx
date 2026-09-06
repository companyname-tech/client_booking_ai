import type { AuditEvent } from '@/types/admin'

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="relative space-y-0">
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
          {i < events.length - 1 && (
            <span aria-hidden className="absolute left-[5px] top-3 h-[calc(100%-4px)] w-px bg-line-strong" />
          )}
          <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-accent ring-4 ring-surface-1" />
          <div className="min-w-0 flex-1">
            <time className="text-2xs tabular text-fg-muted">
              {new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </time>
            <div className="text-sm font-medium text-fg">{e.title}</div>
            {e.description && <p className="text-xs text-fg-muted">{e.description}</p>}
            {e.actor && <span className="mt-1 inline-block text-2xs uppercase tracking-wider text-fg-faint">{e.actor}</span>}
          </div>
        </li>
      ))}
    </ol>
  )
}
