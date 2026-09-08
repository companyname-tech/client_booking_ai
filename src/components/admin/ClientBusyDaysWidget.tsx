import { useMemo, useState } from 'react'
import { CalendarOff, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { RecurringBusyDaysPanel } from '@/components/calendar/RecurringBusyDaysPanel'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeader } from '@/components/ui/Card'
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

type ViewMode = 'month' | 'week'
type BusyMode = 'single' | 'recurring'

function ClientBusyDaysCalendar({ clientId }: { clientId: string }) {
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState<Date>(() => new Date())
  const [busyMode, setBusyMode] = useState<BusyMode>('single')
  const [busySaving, setBusySaving] = useState(false)
  const [busyNotice, setBusyNotice] = useState('')
  const [busyError, setBusyError] = useState('')

  const { availability, loading, error, reload } = useCalendarEvents({
    view,
    cursor,
    clientId,
  })

  const recurringWindow = useMemo(() => {
    const anchor = new Date()
    return {
      from: toIso(startOfDay(addMonths(anchor, -1))),
      to: toIso(endOfDay(addMonths(anchor, 12))),
    }
  }, [])

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

  const busyDayCount = countAiBusyDays(availability)

  const toggleBusyDay = async (day: Date) => {
    if (busyMode !== 'single' || busySaving) return
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
    <>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-fg-muted">
            {busyDayCount > 0
              ? `${busyDayCount} busy day${busyDayCount === 1 ? '' : 's'} in this view.`
              : 'No busy days in this view yet.'}
            {recurringMeta?.days.length
              ? ` Recurring: every ${formatRecurringBusyDays(recurringMeta.days)}.`
              : ''}
          </p>
          {busyMode === 'single' ? (
            <p className="mt-1 text-xs text-fg-secondary">Single-day mode — click a day to block or unblock it.</p>
          ) : null}
          {busyNotice ? <p className="mt-1 text-xs text-success" aria-live="polite">{busyNotice}</p> : null}
          {busyError ? <p className="mt-1 text-xs text-danger" role="alert">{busyError}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCursor(new Date())} disabled={busySaving}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Previous" onClick={() => shift(-1)} disabled={busySaving}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Next" onClick={() => shift(1)} disabled={busySaving}>
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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CalendarOff className="size-4 text-accent" />
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
        {busySaving ? <Loader2 className="size-4 animate-spin text-fg-muted" aria-hidden /> : null}
      </div>

      {busyMode === 'recurring' ? (
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
        {loading && availability.length === 0 ? (
          <LoadingState rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <CalendarGrid
            view={view}
            cursor={cursor}
            events={[]}
            blocked={availability}
            onSelectMeeting={() => {}}
            onSelectSlot={(day) => void toggleBusyDay(day)}
            markBusyMode={busyMode === 'single'}
          />
        )}
      </div>
    </>
  )
}

/** Calendar for marking days when the AI must not book meetings for this client. */
export function ClientBusyDaysWidget({ clientId }: { clientId?: string }) {
  return (
    <Card id="client-busy-days" className="p-5 sm:p-6">
      <SectionHeader
        title="Busy days"
        description="Click dates on the calendar to block them, or set recurring weekly busy days. The AI will not book meetings on blocked days."
      />
      {clientId ? (
        <ClientBusyDaysCalendar clientId={clientId} />
      ) : (
        <p className="mt-4 text-sm text-fg-muted">
          Create the client workspace first — then return here to block single days or set recurring weekly busy days on the calendar.
        </p>
      )}
    </Card>
  )
}
