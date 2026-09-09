import { cn } from '@/lib/utils'
import { sameDay, toDayKey, ilParts, WEEKDAY_LABELS, fmtDateShort } from '@/lib/calendar'
import { isAiBusyDay } from '@/lib/calendarBusyDays'
import { EventChip } from './EventChip'
import { BlockedOverlay } from './BlockedOverlay'
import type { CalendarMeeting } from '@/types/calendar'
import type { AvailabilityInstance } from '@/types/calendar'

interface DayCellProps {
  day: Date
  month: Date // reference month (for dimming out-of-month days)
  meetings: CalendarMeeting[]
  blocked?: AvailabilityInstance[]
  onSelectMeeting: (m: CalendarMeeting) => void
  onSelectSlot: (day: Date) => void
  today: Date
  dense?: boolean
  /** When true, clicking the day toggles an AI busy-day block. */
  markBusyMode?: boolean
  readOnly?: boolean
}

const isBlockedDay = (blocked: AvailabilityInstance[] | undefined, day: Date): boolean =>
  !!blocked?.some((b) => sameDay(new Date(b.start), day))

/** One calendar cell: day number, event chips, blocked hatch. */
export function DayCell({
  day,
  month,
  meetings,
  blocked,
  onSelectMeeting,
  onSelectSlot,
  today,
  dense,
  markBusyMode,
  readOnly,
}: DayCellProps) {
  const parts = ilParts(day)
  const monthParts = ilParts(month)
  const inMonth = parts.year === monthParts.year && parts.month === monthParts.month
  const isToday = sameDay(day, today)
  const blockedDay = isBlockedDay(blocked, day)
  const aiBusy = isAiBusyDay(blocked ?? [], day)
  const key = toDayKey(day)

  const toggleBusy = () => {
    if (markBusyMode) onSelectSlot(day)
  }

  return (
    <div
      key={key}
      data-day={key}
      role={markBusyMode ? 'presentation' : undefined}
      tabIndex={markBusyMode ? -1 : undefined}
      onClick={markBusyMode ? toggleBusy : undefined}
      className={cn(
        'relative flex min-h-16 flex-col gap-0.5 border-b border-line p-1',
        !dense && 'md:min-h-24',
        !inMonth && 'bg-surface-2/40',
        markBusyMode && 'cursor-pointer transition-colors hover:bg-surface-2/60',
        markBusyMode && aiBusy && 'bg-danger/10 ring-1 ring-inset ring-danger/25',
      )}
    >
      {blockedDay && (
        <BlockedOverlay title={aiBusy ? 'Busy — AI cannot book here' : 'Unavailable'} />
      )}
      <button
        type="button"
        onClick={(e) => {
          if (readOnly) return
          if (markBusyMode) {
            e.stopPropagation()
            toggleBusy()
            return
          }
          onSelectSlot(day)
        }}
        aria-label={
          readOnly
            ? `${WEEKDAY_LABELS[parts.weekday]} ${fmtDateShort(day)}`
            : markBusyMode
            ? `${aiBusy ? 'Clear busy day' : 'Mark busy day'} on ${WEEKDAY_LABELS[parts.weekday]} ${fmtDateShort(day)}`
            : `New meeting on ${WEEKDAY_LABELS[parts.weekday]} ${fmtDateShort(day)}`
        }
        className={cn(
          'interactive relative z-10 flex h-5 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-medium outline-none',
          isToday ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg',
          !inMonth && 'text-fg-faint',
        )}
      >
        {parts.day}
      </button>
      {markBusyMode && aiBusy ? (
        <span className="relative z-10 px-1 text-2xs font-semibold uppercase tracking-wide text-danger">
          Busy
        </span>
      ) : null}
      <div className="relative z-10 flex min-w-0 flex-col gap-0.5">
        {meetings
          .filter((m) => m.status !== 'cancelled')
          .slice(0, dense ? 1 : 3)
          .map((m) => (
            <EventChip
              key={m.bookingId}
              meeting={m}
              onClick={(e) => {
                e.stopPropagation()
                onSelectMeeting(m)
              }}
              compact={dense}
            />
          ))}
        {!dense && meetings.filter((m) => m.status !== 'cancelled').length > 3 && (
          <span className="px-1 text-2xs text-fg-faint">
            +{meetings.filter((m) => m.status !== 'cancelled').length - 3} more
          </span>
        )}
      </div>
    </div>
  )
}
