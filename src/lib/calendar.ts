/**
 * Calendar date helpers — tz-safe around RFC3339 strings.
 * The backend sends RFC3339 with offsets; we render as instants in the
 * browser's local timezone (the pinned contract §3.2 says exactly that).
 */

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

export function parseInstant(iso: string): Date {
  return new Date(iso)
}

export function fmtTime(iso: string): string {
  const d = parseInstant(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function fmtDayShort(iso: string): string {
  const d = parseInstant(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export function fmtDateShort(d: Date): string {
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function toDayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}

export function startOfDay(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

export function endOfDay(d: Date): Date {
  const out = new Date(d)
  out.setHours(23, 59, 59, 999)
  return out
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

/** ISO (RFC3339-ish, local) for a date. */
export function toIso(d: Date): string {
  return d.toISOString()
}

/** 7 days (Sun-first) containing `d` — the week-view window. */
export function weekDays(d: Date): Date[] {
  const sun = addDays(startOfDay(d), -d.getDay())
  return Array.from({ length: 7 }, (_, i) => addDays(sun, i))
}

/**
 * Month matrix (Sun-first weeks) containing `d` — includes leading/trailing
 * days from adjacent months so the grid is always rectangular.
 */
export function monthMatrix(d: Date): Date[][] {
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  const start = addDays(first, -first.getDay())
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)))
  }
  return weeks
}

/** RFC3339 range (UTC instants) covering the full visible matrix/window. */
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

export function sameDayOfIso(iso: string, day: Date): boolean {
  const d = parseInstant(iso)
  if (Number.isNaN(d.getTime())) return false
  return sameDay(d, day)
}
