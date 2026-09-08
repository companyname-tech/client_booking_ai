import { CAL_TZ, ilFromParts, ilParts, sameDay, toIso } from '@/lib/calendar'
import type { AvailabilityInstance } from '@/types/calendar'

/** One-off full day blocked from the calendar picker. */
export const AI_BUSY_DAY_NOTE = 'ai_busy_day'
/** Weekly recurring full-day block from the calendar picker. */
export const AI_BUSY_RECURRING_NOTE = 'ai_busy_recurring'

const AI_BUSY_NOTES = new Set([AI_BUSY_DAY_NOTE, AI_BUSY_RECURRING_NOTE])

/** BE days_of_week: 0=Monday … 6=Sunday (Python weekday). */
export const BE_WEEKDAY_TOGGLES = [
  { value: 0, label: 'Mo' },
  { value: 1, label: 'Tu' },
  { value: 2, label: 'We' },
  { value: 3, label: 'Th' },
  { value: 4, label: 'Fr' },
  { value: 5, label: 'Sa' },
  { value: 6, label: 'Su' },
] as const

/** Israel calendar weekday (0=Sun..6=Sat) → BE days_of_week (0=Mon..6=Sun). */
export function ilWeekdayToBe(israelWeekday: number): number {
  return israelWeekday === 0 ? 6 : israelWeekday - 1
}

export function beWeekdayLabel(beWeekday: number): string {
  return BE_WEEKDAY_TOGGLES.find((row) => row.value === beWeekday)?.label ?? '?'
}

export function busyDayBounds(day: Date): { start: string; end: string } {
  const parts = ilParts(day)
  const start = ilFromParts(parts.year, parts.month, parts.day, 0, 0, 0)
  const end = ilFromParts(parts.year, parts.month, parts.day, 23, 59, 59)
  return { start: toIso(start), end: toIso(end) }
}

export function aiBusyDayRule(
  blocked: AvailabilityInstance[],
  day: Date,
): AvailabilityInstance | undefined {
  return blocked.find((row) => row.note === AI_BUSY_DAY_NOTE && sameDay(new Date(row.start), day))
}

export function isAiBusyDay(blocked: AvailabilityInstance[], day: Date): boolean {
  return blocked.some(
    (row) => AI_BUSY_NOTES.has(row.note ?? '') && sameDay(new Date(row.start), day),
  )
}

export function countAiBusyDays(blocked: AvailabilityInstance[]): number {
  const keys = new Set<string>()
  for (const row of blocked) {
    if (!AI_BUSY_NOTES.has(row.note ?? '')) continue
    const day = new Date(row.start)
    if (Number.isNaN(day.getTime())) continue
    keys.add(`${ilParts(day).year}-${ilParts(day).month}-${ilParts(day).day}`)
  }
  return keys.size
}

export function inferRecurringBusyRule(blocked: AvailabilityInstance[]): {
  id: string
  days: number[]
} | null {
  const rows = blocked.filter(
    (row) => row.kind === 'recurring_weekly' && row.note === AI_BUSY_RECURRING_NOTE,
  )
  if (!rows.length) return null
  const days = new Set<number>()
  for (const row of rows) {
    const start = new Date(row.start)
    if (Number.isNaN(start.getTime())) continue
    days.add(ilWeekdayToBe(ilParts(start).weekday))
  }
  return { id: rows[0].id, days: [...days].sort((a, b) => a - b) }
}

export const busyDayAvailabilityPayload = (day: Date, clientId: string) => {
  const { start, end } = busyDayBounds(day)
  return {
    clientId,
    kind: 'range' as const,
    start,
    end,
    timezone: CAL_TZ,
    note: AI_BUSY_DAY_NOTE,
  }
}

export const recurringBusyAvailabilityPayload = (
  clientId: string,
  daysOfWeek: number[],
  ruleId?: string,
) => {
  const start = toIso(ilFromParts(2000, 1, 3, 0, 0, 0))
  const end = toIso(ilFromParts(2000, 1, 3, 23, 59, 59))
  return {
    id: ruleId,
    clientId,
    kind: 'recurring_weekly' as const,
    start,
    end,
    daysOfWeek,
    timezone: CAL_TZ,
    note: AI_BUSY_RECURRING_NOTE,
  }
}

export function formatRecurringBusyDays(days: number[]): string {
  if (!days.length) return 'none'
  return days.map(beWeekdayLabel).join(', ')
}
