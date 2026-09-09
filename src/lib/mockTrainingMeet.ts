import { addDays, ilFromParts, ilParts, toIso } from '@/lib/calendar'
import type { CalendarMeeting } from '@/types/calendar'
import type { TrainingExtractedData } from '@/types/training'

/** Host shown on the training mock calendar — never sent to Google. */
export const MOCK_TRAINING_HOST = 'mike@chatcoders.dev'

export interface MockTrainingMeet {
  attendeeEmail: string
  hostEmail: string
  dayLabel: string
  timeLabel: string
  startIso: string
  title: string
}

/** Israel weekday 0=Sun..6=Sat */
const DAY_INDEX: Record<string, number> = {
  ראשון: 0,
  sunday: 0,
  שני: 1,
  monday: 1,
  שלישי: 2,
  tuesday: 2,
  רביעי: 3,
  wednesday: 3,
  חמישי: 4,
  thursday: 4,
  שישי: 5,
  friday: 5,
  שבת: 6,
  saturday: 6,
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const DAY_TIME_RE = new RegExp(
  String.raw`(?:יום\s+)?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|sunday|monday|tuesday|wednesday|thursday|friday|saturday)` +
    String.raw`(?:\s+(?:at|בשעה))?` +
    String.raw`\s+(?:(אחת)|(\d{1,2})[:.](\d{2})|(\d{1,2})\b)`,
  'gi',
)

const DAY_LABEL: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function lastEmail(blob: string): string {
  const hits = blob.match(EMAIL_RE) ?? []
  return (hits[hits.length - 1] || '').trim().toLowerCase()
}

function nextWeekday(now: Date, weekday: number, hour: number, minute: number): Date {
  const p = ilParts(now)
  let daysAhead = (weekday - p.weekday + 7) % 7
  let candidate = ilFromParts(p.year, p.month, p.day + daysAhead, hour, minute)
  if (daysAhead === 0 && candidate.getTime() <= now.getTime()) {
    candidate = addDays(candidate, 7)
  }
  return candidate
}

function parseClock(raw: string): { hour: number; minute: number } | null {
  const trimmed = raw.trim()
  if (/^אחת$/.test(trimmed)) return { hour: 13, minute: 0 }
  const hm = trimmed.match(/^(\d{1,2})[:.](\d{2})$/)
  if (hm) {
    const hour = Number(hm[1])
    const minute = Number(hm[2])
    if (hour > 23 || minute > 59) return null
    return { hour, minute }
  }
  const hourOnly = trimmed.match(/^(\d{1,2})$/)
  if (hourOnly) {
    const hour = Number(hourOnly[1])
    if (hour > 23) return null
    return { hour, minute: 0 }
  }
  return null
}

function lastDayTime(blob: string, now: Date): Date | null {
  let last: Date | null = null
  const re = new RegExp(DAY_TIME_RE.source, DAY_TIME_RE.flags)
  let match: RegExpExecArray | null
  while ((match = re.exec(blob))) {
    const day = (match[1] || '').toLowerCase()
    const weekday = DAY_INDEX[day]
    if (weekday === undefined) continue
    let hour = 0
    let minute = 0
    if (match[2]) {
      hour = 13
    } else if (match[3] != null) {
      hour = Number(match[3])
      minute = Number(match[4] || 0)
    } else {
      hour = Number(match[5] || 0)
    }
    if (hour > 23 || minute > 59) continue
    last = nextWeekday(now, weekday, hour, minute)
  }
  return last
}

function startFromExtracted(
  extracted: TrainingExtractedData | null | undefined,
  now: Date,
): Date | null {
  const day = (extracted?.meeting?.day || '').trim()
  const time = (extracted?.meeting?.time || '').trim()
  if (!day && !time) return null
  const blob = `${day} ${time}`.trim()
  const fromPhrase = lastDayTime(blob, now)
  if (fromPhrase) return fromPhrase
  const weekday = DAY_INDEX[day.toLowerCase()]
  const clock = parseClock(time)
  if (weekday === undefined || !clock) return null
  return nextWeekday(now, weekday, clock.hour, clock.minute)
}

function meetFromStart(
  start: Date,
  attendeeEmail: string,
  hostEmail: string,
): MockTrainingMeet {
  const p = ilParts(start)
  return {
    attendeeEmail,
    hostEmail,
    dayLabel: DAY_LABEL[p.weekday] ?? '',
    timeLabel: `${pad2(p.hour)}:${pad2(p.minute)}`,
    startIso: toIso(start),
    title: attendeeEmail ? `Mock meet · ${attendeeEmail}` : 'Mock meet (training)',
  }
}

/** Last booked day/time (+ email) from a training transcript. No Google calls. */
export function parseMockTrainingMeet(
  texts: string[],
  extracted?: TrainingExtractedData | null,
  now: Date = new Date(),
): MockTrainingMeet | null {
  const blob = texts.filter(Boolean).join('\n')
  const attendee =
    lastEmail(blob)
    || (extracted?.emails?.[extracted.emails.length - 1]?.email || '').trim().toLowerCase()
  const fromTalk = lastDayTime(blob, now)
  const fromExtracted = startFromExtracted(extracted, now)
  const start = fromTalk ?? fromExtracted
  if (!start) return null
  return meetFromStart(start, attendee, MOCK_TRAINING_HOST)
}

/** Calendar grid event for the training mock — google sync is always none. */
export function mockMeetToCalendarEvent(meet: MockTrainingMeet): CalendarMeeting {
  const start = new Date(meet.startIso)
  const end = new Date(start.getTime() + 30 * 60 * 1000)
  return {
    bookingId: `mock-training-${meet.startIso}`,
    lead: { id: 'training', name: meet.attendeeEmail || 'Training lead', company: '' },
    offer: { id: 'training', title: 'Training (mock)' },
    scheduledFor: meet.startIso,
    end: toIso(end),
    timezone: 'Asia/Jerusalem',
    durationMin: 30,
    title: meet.title,
    status: 'confirmed',
    source: 'call',
    notes: `Mock only — host ${meet.hostEmail}. Not sent to Google.`,
    createdAt: toIso(new Date()),
    google: { state: 'none' },
  }
}
