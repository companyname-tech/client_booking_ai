import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { fmtWhen } from '@/lib/callHistory'

export default function ClientBookings() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getMeetings())
  const meetings = data ?? []

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          title="Bookings"
          description="Meetings the AI booked, newest first."
        />

        {loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : meetings.length === 0 ? (
          <EmptyState
            title="No meetings booked yet"
            description="Bookings appear here once the AI schedules a meeting."
          />
        ) : (
          <div className="space-y-2">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-lg border border-line bg-surface-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-medium text-fg">{m.leadName || '—'}</div>
                  <div className="text-xs text-fg-muted">
                    {m.contactName ? `${m.contactName} · ` : ''}
                    {m.offer || '—'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-fg-secondary">
                    {m.email && <span>{m.email}</span>}
                    {m.phone && <span>{m.phone}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <span className="text-xs text-fg-muted">{fmtWhen(m.scheduledAt)}</span>
                  {m.meetingLink ? (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      Open meeting →
                    </a>
                  ) : (
                    <span className="text-xs text-fg-faint">No link</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </PageTransition>
  )
}
