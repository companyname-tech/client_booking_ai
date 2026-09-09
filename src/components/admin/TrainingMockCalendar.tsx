import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { Button } from '@/components/ui/Button'
import { addMonths, fmtMonthYear, fmtTime } from '@/lib/calendar'
import {
  mockMeetToCalendarEvent,
  parseMockTrainingMeet,
  type MockTrainingMeet,
} from '@/lib/mockTrainingMeet'
import type { TrainingExtractedData, TrainingTalkTurn } from '@/types/training'

function textsFromTurns(turns: TrainingTalkTurn[] | undefined): string[] {
  return (turns ?? []).map((row) => row.text).filter(Boolean)
}

export function TrainingMockCalendar({
  texts = [],
  turns,
  extracted,
}: {
  texts?: string[]
  turns?: TrainingTalkTurn[]
  extracted?: TrainingExtractedData | null
}) {
  const meet = useMemo(
    () => parseMockTrainingMeet([...textsFromTurns(turns), ...texts], extracted),
    [texts, turns, extracted],
  )
  return <TrainingMockCalendarView meet={meet} />
}

function TrainingMockCalendarView({ meet }: { meet: MockTrainingMeet | null }) {
  const event = meet ? mockMeetToCalendarEvent(meet) : null
  const follow = event ? new Date(event.scheduledFor) : new Date()
  const [pinned, setPinned] = useState<Date | null>(null)

  useEffect(() => {
    setPinned(null)
  }, [meet?.startIso])

  const monthCursor = pinned ?? follow

  return (
    <div className="mt-4 rounded-md border border-line bg-surface-1 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
            <CalendarDays className="size-3.5 text-accent" />
            Mock calendar — training only
          </div>
          <p className="mt-0.5 text-xs text-fg-muted">
            Bookings from this talk appear here. Nothing is created on Google Calendar.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Previous month"
            onClick={() => setPinned(addMonths(monthCursor, -1))}
            leadingIcon={<ChevronLeft className="size-3.5" />}
          />
          <span className="min-w-[9rem] text-center text-xs font-medium text-fg">
            {fmtMonthYear(monthCursor)}
          </span>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Next month"
            onClick={() => setPinned(addMonths(monthCursor, 1))}
            leadingIcon={<ChevronRight className="size-3.5" />}
          />
        </div>
      </div>

      {meet ? (
        <div className="mt-3 rounded-md border border-accent/25 bg-accent/10 px-3 py-2 text-xs text-fg">
          <p className="font-semibold text-accent">Mock meeting set</p>
          <p className="mt-0.5">
            {meet.dayLabel} · {meet.timeLabel} ({fmtTime(meet.startIso)})
          </p>
          <p className="mt-0.5 text-fg-secondary">
            Host {meet.hostEmail}
            {meet.attendeeEmail ? ` · invite ${meet.attendeeEmail}` : ' · email not captured yet'}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-fg-faint">
          No mock meeting yet — when the talk agrees a day, time, and email, the slot shows on this calendar.
        </p>
      )}

      <div className="mt-3 overflow-hidden rounded-md border border-line">
        <CalendarGrid
          view="month"
          cursor={monthCursor}
          events={event ? [event] : []}
          blocked={[]}
          onSelectMeeting={() => undefined}
          onSelectSlot={() => undefined}
          readOnly
        />
      </div>
    </div>
  )
}
