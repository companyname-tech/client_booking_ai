import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { NewMeetingModal } from '@/components/calendar/NewMeetingModal'
import { EventDetailSheet } from '@/components/calendar/EventDetailSheet'
import { AvailabilityPanel } from '@/components/calendar/AvailabilityPanel'
import { GoogleConnectCard } from '@/components/calendar/GoogleConnectCard'
import { fmtDateShort, fmtMonthYear, weekDays, addDays, addMonths } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import type { CalendarMeeting } from '@/types/calendar'

type ViewMode = 'month' | 'week'

export default function CalendarScreen() {
  const [params] = useSearchParams()
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState<Date>(() => new Date())
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'err' } | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newDay, setNewDay] = useState<Date>(() => new Date())
  const [selected, setSelected] = useState<CalendarMeeting | null>(null)

  // Resolve the current workspace client id (best-effort; client_user is implicit).
  const { data: workspace } = useAsyncData(() => repo.getCurrentClient().catch(() => null), [])
  const clientId = (workspace as { id?: string } | null)?.id

  const { meetings, availability, loading, error, reload } = useCalendarEvents({
    view,
    cursor,
    clientId,
  })

  // OAuth callback marker: ?google=connected|error
  useEffect(() => {
    const g = params.get('google')
    if (g === 'connected') setToast({ text: 'Google Calendar connected', kind: 'ok' })
    else if (g === 'error') setToast({ text: `Google connect failed: ${params.get('reason') ?? 'unknown error'}`, kind: 'err' })
    if (g) window.history.replaceState({}, '', window.location.pathname)
  }, [params])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(t)
  }, [toast])

  const shift = (dir: -1 | 1) =>
    setCursor((prev) => (view === 'month' ? addMonths(prev, dir) : addDays(prev, dir * 7)))

  const rangeLabel =
    view === 'month'
      ? fmtMonthYear(cursor)
      : `${fmtDateShort(weekDays(cursor)[0])} – ${fmtDateShort(weekDays(cursor)[6])}`

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          title="Calendar"
          description="Meetings, availability, and Google sync."
          actions={
            <Button variant="primary" leadingIcon={<Plus className="size-4" />} onClick={() => { setNewDay(new Date()); setNewOpen(true) }}>
              New meeting
            </Button>
          }
        />

        {toast && (
          <p aria-live="polite" className={cn('text-xs', toast.kind === 'ok' ? 'text-success' : 'text-danger')}>
            {toast.text}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Previous" onClick={() => shift(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Next" onClick={() => shift(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <h2 className="min-w-40 text-lg font-semibold text-fg">{rangeLabel}</h2>
          </div>
          <div className="flex rounded-lg border border-line p-0.5">
            {(['month', 'week'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                  view === v ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {loading && meetings.length === 0 ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <CalendarGrid
              view={view}
              cursor={cursor}
              events={meetings}
              blocked={availability}
              onSelectMeeting={setSelected}
              onSelectSlot={(day) => { setNewDay(day); setNewOpen(true) }}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <AvailabilityPanel instances={availability} clientId={clientId} onChanged={reload} />
              <GoogleConnectCard clientId={clientId} onToast={(text, kind) => setToast({ text, kind })} />
            </div>
          </>
        )}

        <NewMeetingModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          initialDay={newDay}
          clientId={clientId}
          onCreated={(m) => { reload(); setSelected(m) }}
        />
        {selected && (
          <EventDetailSheet
            meeting={selected}
            clientId={clientId}
            onClose={() => setSelected(null)}
            onChange={(m) => { reload(); setSelected(m.status === 'cancelled' ? null : m) }}
            onSync={(m) => { reload(); setSelected({ ...m, google: m.google }) }}
          />
        )}
      </PageContainer>
    </PageTransition>
  )
}
