import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Tone } from '@/types'
import type { ActivityLogEntry } from '@/types/admin'
import { ACTIVITY_SOURCE_META } from '@/lib/activity'
import { cn } from '@/lib/utils'
import { SelectCheckbox } from '@/components/ui/SelectCheckbox'

const toneBox: Record<Tone, string> = {
  neutral: 'text-fg-muted bg-white/[0.04] ring-white/[0.06]',
  info: 'text-accent bg-accent-soft ring-accent/15',
  success: 'text-success bg-success-soft ring-success/15',
  warning: 'text-warning bg-warning-soft ring-warning/15',
  danger: 'text-danger bg-danger-soft ring-danger/15',
  violet: 'text-violet bg-violet-soft ring-violet/15',
}

function formatTimestamp(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export interface TimelineSelection {
  selected: ReadonlySet<string>
  toggle: (id: string) => void
  allChecked: boolean
  someChecked: boolean
  toggleAll: () => void
}

const Item = memo(function Item({
  entry,
  selected,
  onToggle,
}: {
  entry: ActivityLogEntry
  selected?: boolean
  onToggle?: (id: string) => void
}) {
  const meta = ACTIVITY_SOURCE_META[entry.source] ?? ACTIVITY_SOURCE_META.audit
  const Icon = meta.icon
  const label = formatTimestamp(entry.timestamp)

  const body = (
    <>
      <span className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-md ring-1', toneBox[meta.tone])}>
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-fg">{entry.action}</span>
          <span className="rounded-full border border-line px-1.5 py-px text-2xs uppercase tracking-wide text-fg-muted">
            {meta.label}
          </span>
        </span>
        {(entry.actor || entry.target) && (
          <span className="mt-0.5 block truncate text-xs text-fg-muted">
            {entry.actor && <span className="capitalize">{entry.actor}</span>}
            {entry.actor && entry.target && <span> · </span>}
            {entry.target && <span>{entry.target}</span>}
          </span>
        )}
        {entry.description && (
          <span className="mt-0.5 block truncate text-xs text-fg-faint">{entry.description}</span>
        )}
      </span>
      {label && (
        <time dateTime={entry.timestamp} className="shrink-0 pt-1 text-2xs tabular text-fg-muted">
          {label}
        </time>
      )}
    </>
  )

  const row = entry.offerId ? (
    <Link
      to={`/admin/campaigns/${entry.offerId}`}
      className="interactive -mx-2 flex min-w-0 flex-1 items-start gap-3 rounded-md px-2 py-2.5 hover:bg-white/[0.03]"
    >
      {body}
    </Link>
  ) : (
    <div className="-mx-2 flex min-w-0 flex-1 items-start gap-3 px-2 py-2.5">{body}</div>
  )

  return (
    <li className="relative flex items-start gap-2.5">
      {onToggle ? (
        <div className="pt-3.5">
          <SelectCheckbox checked={!!selected} onChange={() => onToggle(entry.id)} label={`Select ${entry.action} event`} />
        </div>
      ) : null}
      {row}
    </li>
  )
})

export function ActivityTimeline({ entries, selection }: { entries: ActivityLogEntry[]; selection?: TimelineSelection }) {
  return (
    <div>
      {selection ? (
        <div className="flex items-center gap-2 border-b border-line px-1 pb-2">
          <SelectCheckbox
            checked={selection.allChecked}
            indeterminate={selection.someChecked}
            onChange={selection.toggleAll}
            label="Select all events"
          />
          <span className="text-2xs text-fg-muted">Select all</span>
        </div>
      ) : null}
      <ol className="relative divide-y divide-line">
        {entries.map((e) => (
          <Item
            key={e.id}
            entry={e}
            selected={selection?.selected.has(e.id)}
            onToggle={selection?.toggle}
          />
        ))}
      </ol>
    </div>
  )
}
