import { Link } from 'react-router-dom'
import type { ActivityLogEntry } from '@/types/admin'
import { ACTIVITY_SOURCE_META } from '@/lib/activity'
import { cn } from '@/lib/utils'
import { DetailDrawer } from '@/components/ui/DetailDrawer'

function formatTimestamp(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatKind(kind: string): string {
  if (!kind) return '—'
  return kind.replaceAll('_', ' ')
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-fg-muted">{label}</dt>
      <dd className={cn('min-w-0 text-right text-fg', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  )
}

export function ActivityDetailDrawer({
  entry,
  open,
  onClose,
  campaignHref,
}: {
  entry: ActivityLogEntry | null
  open: boolean
  onClose: () => void
  /** When set, show a footer link to the campaign activity page. */
  campaignHref?: (entry: ActivityLogEntry) => string | undefined
}) {
  if (!entry) return null

  const meta = ACTIVITY_SOURCE_META[entry.source] ?? ACTIVITY_SOURCE_META.audit
  const Icon = meta.icon
  const href = entry.offerId && campaignHref ? campaignHref(entry) : undefined

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={entry.action}
      subtitle={entry.target || undefined}
      footer={
        href ? (
          <Link
            to={href}
            className="interactive inline-flex h-7 w-full items-center justify-center rounded-sm border border-line-strong bg-surface-3 px-2.5 text-xs font-medium text-fg hover:bg-surface-4"
          >
            View campaign activity →
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-2xs uppercase tracking-wide text-fg-muted">
            <Icon className="size-3" strokeWidth={1.75} />
            {meta.label}
          </span>
          {entry.kind && (
            <span className="rounded-full border border-line px-2 py-0.5 text-2xs capitalize text-fg-muted">
              {formatKind(entry.kind)}
            </span>
          )}
        </div>

        <dl className="space-y-2.5 text-sm">
          <DetailRow label="When" value={formatTimestamp(entry.timestamp)} />
          <DetailRow label="Actor" value={entry.actor} />
          {entry.target && (
            <DetailRow
              label={entry.targetType ? `${entry.targetType.replaceAll('_', ' ')}` : 'Target'}
              value={entry.target}
            />
          )}
          {entry.targetId && entry.targetId !== entry.target && (
            <DetailRow label="Target ID" value={entry.targetId} mono />
          )}
          {entry.description && (
            <div>
              <dt className="text-fg-muted">{entry.source === 'audit' ? 'Reason' : 'Details'}</dt>
              <dd className="mt-1 rounded-md border border-line bg-surface-1 p-2.5 text-sm text-fg-secondary">
                {entry.description}
              </dd>
            </div>
          )}
          {entry.offerId && <DetailRow label="Campaign ID" value={entry.offerId} mono />}
          <DetailRow label="Event ID" value={entry.id} mono />
        </dl>
      </div>
    </DetailDrawer>
  )
}
