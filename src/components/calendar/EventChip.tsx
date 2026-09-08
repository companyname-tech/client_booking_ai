import type { MouseEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtTime } from '@/lib/calendar'
import type { CalendarMeeting } from '@/types/calendar'

const TONES: Record<CalendarMeeting['status'], string> = {
  confirmed: 'border-accent/20 bg-accent-soft/50 text-accent hover:bg-accent-soft',
  pending: 'border-warning/20 bg-warning-soft/50 text-warning hover:bg-warning-soft',
  cancelled: 'border-line bg-surface-2 text-fg-muted line-through opacity-70',
  completed: 'border-success/20 bg-success-soft/50 text-success hover:bg-success-soft',
}

/** A single meeting chip inside a day cell. Click -> detail sheet. */
export function EventChip({
  meeting,
  onClick,
  compact,
}: {
  meeting: CalendarMeeting
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  compact?: boolean
}) {
  const tone = meeting.status === 'cancelled' ? '' : TONES[meeting.status]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'interactive block w-full truncate rounded-sm border px-1.5 text-left text-2xs transition-colors',
        compact ? 'py-px' : 'py-0.5',
        tone,
        !onClick && 'cursor-default',
      )}
      title={meeting.title}
    >
      {!compact && <span className="mr-1 font-medium tabular">{fmtTime(meeting.scheduledFor)}</span>}
      <span className="truncate">{meeting.title || meeting.lead.name}</span>
      {meeting.meetingLink && (
        <ArrowUpRight className="ml-0.5 inline size-2.5 shrink-0 align-[-1px]" aria-label="Has meeting link" />
      )}
    </button>
  )
}
