/**
 * Calendar date helpers — pinned to Asia/Jerusalem (Israel time) for ALL
 * display + grid arithmetic (Lev: work by Israel time, not the browser's).
 *
 * The BE contract is untouched: meetings/availability/slots travel as RFC3339
 * instants (+ a timezone field). This module converts an instant into
 * Israel-local wall-clock parts for rendering/gridding, and builds instants
 * back from Israel wall-clock parts (window bounds, date inputs, blocks).
 */

export const CAL_TZ = 'Asia/Jerusalem'

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

/** 0=Sun..6=Sat toggles used by the recurring-weekly availability editor. */
export const WEEKDAY_TOGGLES = [
  { value: 1, label: 'Mo' },
  { value: 2, label: 'Tu' },
  { value: 3, label: 'We' },
  { value: 4, label: 'Th' },
  { value: 5, label: 'Fr' },
  { value: 6, label: 'Sa' },
  { value: 0, label: 'Su' },
] as const

/** BE days_of_week display order: index 0 = Monday. */
export const WEEKDAY_NAMES_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

export interface IsraelParts {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
  second: number
  weekday: number // 0=Sun..6=Sat (Israel-local wall clock)
}

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: CAL_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const hmFmtUtc = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Israel-local wall-clock parts of an instant. */
export function ilParts(d: Date): IsraelParts {
  const rec: Record<string, string> = {}
  for (const p of partsFmt.formatToParts(d)) rec[p.type] = p.value
  return {
    year: Number(rec.year),
    month: Number(rec.month),
    day: Number(rec.day),
    hour: Number(rec.hour),
    minute: Number(rec.minute),
    second: Number(rec.second),
    weekday: WEEKDAY_INDEX[rec.weekday] ?? 0,
  }
}

/** Israel's UTC offset in minutes at an instant (positive east). */
function ilOffsetMin(d: Date): number {
  const rec: Record<string, string> = {}
  for (const p of hmFmtUtc.formatToParts(d)) rec[p.type] = p.value
  const utcMin = Number(rec.hour) * 60 + Number(rec.minute)
  const p = ilParts(d)
  let diff = p.hour * 60 + p.minute - utcMin
  if (diff > 720) diff -= 1440
  if (diff < -720) diff += 1440
  return diff
}

/**
 * Instant for Israel wall-clock parts (month 1-12; day/hour overflow normalize
 * via Date.UTC). DST transitions (±1h, twice a year) resolve to the nearest
 * valid instant; normal times are exact.
 */
export function ilFromParts(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms))
  const off1 = ilOffsetMin(guess)
  const t1 = new Date(guess.getTime() - off1 * 60000)
  const off2 = ilOffsetMin(t1)
  return off2 === off1 ? t1 : new Date(guess.getTime() - off2 * 60000)
}

export function parseInstant(iso: string): Date {
  return new Date(iso)
}

const pad = (n: number) => String(n).padStart(2, '0')

const fmtTimeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: CAL_TZ,
  hour: 'numeric',
  minute: '2-digit',
})

const fmtDayShortFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: CAL_TZ,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const fmtDateShortFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: CAL_TZ,
  month: 'short',
  day: 'numeric',
})

const fmtMonthYearFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: CAL_TZ,
  month: 'long',
  year: 'numeric',
})

/** Israel wall time of an RFC3339 instant, e.g. "11:00 PM". */
export function fmtTime(iso: string): string {
  const d = parseInstant(iso)
  if (Number.isNaN(d.getTime())) return ''
  return fmtTimeFmt.format(d)
}

/** Israel wall date of an RFC3339 instant, e.g. "Tue, Sep 8". */
export function fmtDayShort(iso: string): string {
  const d = parseInstant(iso)
  if (Number.isNaN(d.getTime())) return ''
  return fmtDayShortFmt.format(d)
}

/** Israel wall date (Date input), e.g. "Sep 8". */
export function fmtDateShort(d: Date): string {
  if (Number.isNaN(d.getTime())) return ''
  return fmtDateShortFmt.format(d)
}

/** Israel wall month + year of a Date, e.g. "September 2026". */
export function fmtMonthYear(d: Date): string {
  if (Number.isNaN(d.getTime())) return ''
  return fmtMonthYearFmt.format(d)
}

/** Israel day key of an instant/Date: YYYY-MM-DD. */
export function toDayKey(d: Date): string {
  const p = ilParts(d)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

/** YYYY-MM-DD (Israel) for `<input type="date">` values. */
export function toDateInputValue(d: Date): string {
  return toDayKey(d)
}

/** `<input type="date">` value → instant of Israel midnight (or given time). */
export function fromDateInputValue(v: string, hour = 0, minute = 0): Date {
  const [y, m, d] = v.split('-').map(Number)
  if (!y || !m || !d) return new Date(Number.NaN)
  return ilFromParts(y, m, d, hour, minute)
}

export function sameDay(a: Date, b: Date): boolean {
  return toDayKey(a) === toDayKey(b)
}

export function sameDayOfIso(iso: string, day: Date): boolean {
  const d = parseInstant(iso)
  if (Number.isNaN(d.getTime())) return false
  return sameDay(d, day)
}

/** Instant of the Israel midnight starting `d`'s Israel day. */
export function startOfDay(d: Date): Date {
  const p = ilParts(d)
  return ilFromParts(p.year, p.month, p.day)
}

/** Instant of the last ms of `d`'s Israel day. */
export function endOfDay(d: Date): Date {
  const p = ilParts(d)
  return ilFromParts(p.year, p.month, p.day, 23, 59, 59, 999)
}

/** Shift by whole Israel days, preserving the Israel wall time of day. */
export function addDays(d: Date, n: number): Date {
  const p = ilParts(d)
  return ilFromParts(p.year, p.month, p.day + n, p.hour, p.minute, p.second, 0)
}

/** Shift by whole Israel months (day clamped to the target month length). */
export function addMonths(d: Date, n: number): Date {
  const p = ilParts(d)
  const targetMonthFirst = ilFromParts(p.year, p.month + n, 1)
  const tp = ilParts(targetMonthFirst)
  const daysInTarget = ilFromParts(tp.year, tp.month + 1, 1)
  const lastDay = ilParts(daysInTarget).day
  const day = Math.min(p.day, lastDay)
  return ilFromParts(tp.year, tp.month, day, p.hour, p.minute, p.second)
}

/** ISO (RFC3339) string of an instant. */
export function toIso(d: Date): string {
  return d.toISOString()
}

/** 7 Israel days (Sun-first) containing `d` — the week-view window. */
export function weekDays(d: Date): Date[] {
  const p = ilParts(d)
  const sun = ilFromParts(p.year, p.month, p.day - p.weekday)
  return Array.from({ length: 7 }, (_, i) => addDays(sun, i))
}

/**
 * Month matrix (Sun-first Israel weeks) containing `d` — includes
 * leading/trailing days from adjacent months; always rectangular.
 */
export function monthMatrix(d: Date): Date[][] {
  const p = ilParts(d)
  const first = ilFromParts(p.year, p.month, 1)
  const fp = ilParts(first)
  const start = ilFromParts(fp.year, fp.month, 1 - fp.weekday)
  const monthEnd = ilFromParts(p.year, p.month + 1, 0) // Israel midnight, last day
  const weeks: Date[][] = []
  let rowStart = start.getTime()
  while (rowStart <= monthEnd.getTime()) {
    const row = Array.from({ length: 7 }, (_, i) => addDays(new Date(rowStart), i))
    weeks.push(row)
    rowStart = addDays(row[6], 1).getTime()
  }
  return weeks
}

/** RFC3339 range (instants) covering the visible Israel window. */
export function visibleRange(d: Date, view: 'month' | 'week'): { from: string; to: string } {
  if (view === 'week') {
    const days = weekDays(d)
    return { from: toIso(startOfDay(days[0])), to: toIso(endOfDay(days[6])) }
  }
  const weeks = monthMatrix(d)
  const first = weeks[0][0]
  const last = weeks[weeks.length - 1][6]
  return { from: toIso(startOfDay(first)), to: toIso(endOfDay(last)) }
}
