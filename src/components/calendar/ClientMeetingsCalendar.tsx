import { useMemo, useState } from 'react'
import { CalendarDays, CalendarOff, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { EventDetailSheet } from '@/components/calendar/EventDetailSheet'
import { RecurringBusyDaysPanel } from '@/components/calendar/RecurringBusyDaysPanel'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import {
  addDays,
  addMonths,
  endOfDay,
  fmtDateShort,
  fmtMonthYear,
  startOfDay,
  toIso,
  weekDays,
} from '@/lib/calendar'
import {
  aiBusyDayRule,
  busyDayAvailabilityPayload,
  countAiBusyDays,
  formatRecurringBusyDays,
  inferRecurringBusyRule,
} from '@/lib/calendarBusyDays'
import { cn } from '@/lib/utils'
import type { CalendarMeeting } from '@/types/calendar'

type ViewMode = 'month' | 'week'
type BusyMode = 'single' | 'recurring'

export interface ClientMeetingsCalendarProps {
  clientId: string
  /** Optional month to open first (e.g. engagement start). */
  initialCursor?: Date
  className?: string
}

/** Embedded month/week calendar with this client's planned meetings. */
export function ClientMeetingsCalendar({ clientId, initialCursor, className }: ClientMeetingsCalendarProps) {
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState<Date>(() => initialCursor ?? new Date())
  const [selected, setSelected] = useState<CalendarMeeting | null>(null)
  const [markBusyMode, setMarkBusyMode] = useState(false)
  const [busyMode, setBusyMode] = useState<BusyMode>('single')
  const [busySaving, setBusySaving] = useState(false)
  const [busyNotice, setBusyNotice] = useState('')
  const [busyError, setBusyError] = useState('')

  const { meetings, availability, loading, error, reload } = useCalendarEvents({
    view,
    cursor,
    clientId,
  })

  const recurringWindow = useMemo(() => {
    const anchor = initialCursor ?? new Date()
    return {
      from: toIso(startOfDay(addMonths(anchor, -1))),
      to: toIso(endOfDay(addMonths(anchor, 12))),
    }
  }, [initialCursor])

  const recurringAvailability = useAsyncData(
    () => repo.getAvailability({ clientId, from: recurringWindow.from, to: recurringWindow.to }),
    [clientId, recurringWindow.from, recurringWindow.to],
  )

  const recurringMeta = useMemo(
    () => inferRecurringBusyRule(recurringAvailability.data ?? availability),
    [recurringAvailability.data, availability],
  )

  const shift = (dir: -1 | 1) =>
    setCursor((prev) => (view === 'month' ? addMonths(prev, dir) : addDays(prev, dir * 7)))

  const rangeLabel =
    view === 'month'
      ? fmtMonthYear(cursor)
      : `${fmtDateShort(weekDays(cursor)[0])} – ${fmtDateShort(weekDays(cursor)[6])}`

  const plannedCount = meetings.filter((m) => m.status !== 'cancelled').length
  const busyDayCount = countAiBusyDays(availability)

  const toggleBusyDay = async (day: Date) => {
    if (!markBusyMode || busyMode !== 'single' || busySaving) return
    const existing = aiBusyDayRule(availability, day)
    setBusySaving(true)
    setBusyNotice('')
    setBusyError('')
    try {
      if (existing) {
        await repo.deleteAvailability(existing.id)
        setBusyNotice('Busy day cleared — the AI can schedule meetings again.')
      } else {
        await repo.upsertAvailability(busyDayAvailabilityPayload(day, clientId))
        setBusyNotice('Day marked busy — the AI will not book meetings on this date.')
      }
      reload()
      void recurringAvailability.reload()
    } catch (e) {
      setBusyError(e instanceof Error ? e.message : 'Could not update busy day')
    } finally {
      setBusySaving(false)
    }
  }

  return (
    <div className={cn('surface p-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <CalendarDays className="size-4 text-accent" />
            Planned meetings
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            {plannedCount > 0
              ? `${plannedCount} meeting${plannedCount === 1 ? '' : 's'} in this view — click an event for details.`
              : 'No meetings in this view yet — booked calls appear on the calendar.'}
            {busyDayCount > 0 ? ` ${busyDayCount} busy day${busyDayCount === 1 ? '' : 's'} in view.` : ''}
            {recurringMeta?.days.length
              ? ` Recurring: every ${formatRecurringBusyDays(recurringMeta.days)}.`
              : ''}
          </p>
          {markBusyMode && busyMode === 'single' ? (
            <p className="mt-1 text-xs text-warning">
              Single-day mode — click a day to block or unblock it once.
            </p>
          ) : null}
          {busyNotice ? <p className="mt-1 text-xs text-fg-secondary" aria-live="polite">{busyNotice}</p> : null}
          {busyError ? <p className="mt-1 text-xs text-danger" role="alert">{busyError}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={markBusyMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setMarkBusyMode((prev) => !prev)
              setBusyNotice('')
              setBusyError('')
            }}
            leadingIcon={busySaving ? <Loader2 className="size-3.5 animate-spin" /> : <CalendarOff className="size-3.5" />}
            disabled={busySaving}
          >
            {markBusyMode ? 'Done' : 'Busy days'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Previous" onClick={() => shift(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Next" onClick={() => shift(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <span className="min-w-36 text-sm font-semibold text-fg">{rangeLabel}</span>
          <div className="flex rounded-lg border border-line p-0.5">
            {(['month', 'week'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors',
                  view === mode ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {markBusyMode ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-2xs font-semibold uppercase tracking-wide text-fg-muted">Block type</span>
          <div className="flex rounded-lg border border-line p-0.5">
            {([
              { id: 'single' as const, label: 'Single days' },
              { id: 'recurring' as const, label: 'Recurring weekly' },
            ]).map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setBusyMode(row.id)
                  setBusyNotice('')
                  setBusyError('')
                }}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  busyMode === row.id ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg',
                )}
              >
                {row.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {markBusyMode && busyMode === 'recurring' ? (
        <RecurringBusyDaysPanel
          clientId={clientId}
          availability={recurringAvailability.data ?? availability}
          saving={busySaving}
          onSavingChange={setBusySaving}
          onSaved={setBusyNotice}
          onError={setBusyError}
          onChanged={() => {
            reload()
            void recurringAvailability.reload()
          }}
        />
      ) : null}

      <div className="mt-4">
        {loading && meetings.length === 0 ? (
          <LoadingState rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <CalendarGrid
            view={view}
            cursor={cursor}
            events={meetings}
            blocked={availability}
            onSelectMeeting={setSelected}
            onSelectSlot={(day) => void toggleBusyDay(day)}
            markBusyMode={markBusyMode && busyMode === 'single'}
          />
        )}
      </div>

      {selected ? (
        <EventDetailSheet
          meeting={selected}
          clientId={clientId}
          onClose={() => setSelected(null)}
          onChange={(m) => {
            reload()
            setSelected(m.status === 'cancelled' ? null : m)
          }}
          onSync={(m) => {
            reload()
            setSelected({ ...m, google: m.google })
          }}
        />
      ) : null}
    </div>
  )
}
