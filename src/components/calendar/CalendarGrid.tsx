import { WEEKDAY_LABELS, monthMatrix, weekDays, sameDayOfIso } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import { DayCell } from './DayCell'
import type { CalendarMeeting } from '@/types/calendar'
import type { AvailabilityInstance } from '@/types/calendar'

interface CalendarGridProps {
  view: 'month' | 'week'
  cursor: Date
  events: CalendarMeeting[]
  blocked: AvailabilityInstance[]
  onSelectMeeting: (m: CalendarMeeting) => void
  onSelectSlot: (day: Date) => void
}

const DAYS = Array.from({ length: 7 }, (_, i) => i) // Sun..Sat

function inDay(events: CalendarMeeting[], day: Date): CalendarMeeting[] {
  return events.filter((m) => sameDayOfIso(m.scheduledFor, day))
}
function dayBlocked(blocked: AvailabilityInstance[], day: Date): AvailabilityInstance[] {
  return blocked.filter((b) => sameDayOfIso(b.start, day))
}

/** Pure layout: month (4-6 week matrix) or week (7 columns). PURE — no data fetching. */
export function CalendarGrid({ view, cursor, events, blocked, onSelectMeeting, onSelectSlot }: CalendarGridProps) {
  const today = new Date()

  const columns =
    view === 'month'
      ? monthMatrix(cursor).map((week) => week.map((d) => <DayCell key={d.getTime()} day={d} month={cursor} meetings={inDay(events, d)} blocked={dayBlocked(blocked, d)} onSelectMeeting={onSelectMeeting} onSelectSlot={onSelectSlot} today={today} />))
      : [weekDays(cursor).map((d) => <DayCell key={d.getTime()} day={d} month={d} meetings={inDay(events, d)} blocked={dayBlocked(blocked, d)} onSelectMeeting={onSelectMeeting} onSelectSlot={onSelectSlot} today={today} />)]

  return (
    <div className="surface overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line">
        {DAYS.map((i) => (
          <div key={i} className="px-2 py-2 text-center text-2xs font-semibold uppercase tracking-wide text-fg-muted">
            {WEEKDAY_LABELS[i]}
          </div>
        ))}
      </div>
      <div className={cn('overflow-x-auto')}>
        {view === 'month' ? (
          <div className="min-w-[640px]">
            {columns.map((row, i) => (
              <div key={i} className="grid grid-cols-7">
                {row}
              </div>
            ))}
          </div>
        ) : (
          <div className="min-w-[640px] grid grid-cols-7">
            {columns[0]}
          </div>
        )}
      </div>
    </div>
  )
}
