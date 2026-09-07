import { cn } from '@/lib/utils'
import { sameDay, toDayKey } from '@/lib/calendar'
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
}

const isBlockedDay = (blocked: AvailabilityInstance[] | undefined, day: Date): boolean =>
  !!blocked?.some((b) => sameDay(new Date(b.start), day))

/** One calendar cell: day number, event chips, blocked hatch. */
export function DayCell({ day, month, meetings, blocked, onSelectMeeting, onSelectSlot, today, dense }: DayCellProps) {
  const inMonth = day.getMonth() === month.getMonth()
  const isToday = sameDay(day, today)
  const blockedDay = isBlockedDay(blocked, day)
  const key = toDayKey(day)

  return (
    <div
      key={key}
      data-day={key}
      className={cn(
        'relative flex min-h-16 flex-col gap-0.5 border-b border-line p-1',
        !dense && 'md:min-h-24',
        !inMonth && 'bg-surface-2/40',
      )}
    >
      {blockedDay && <BlockedOverlay />}
      <button
        type="button"
        onClick={() => onSelectSlot(day)}
        aria-label={`New meeting on ${day.toLocaleDateString()}`}
        className={cn(
          'interactive relative z-10 flex h-5 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-medium outline-none',
          isToday ? 'bg-accent text-white' : 'text-fg-muted hover:text-fg',
          !inMonth && 'text-fg-faint',
        )}
      >
        {day.getDate()}
      </button>
      <div className="relative z-10 flex min-w-0 flex-col gap-0.5">
        {meetings
          .filter((m) => m.status !== 'cancelled')
          .slice(0, dense ? 1 : 3)
          .map((m) => (
            <EventChip key={m.bookingId} meeting={m} onClick={() => onSelectMeeting(m)} compact={dense} />
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
