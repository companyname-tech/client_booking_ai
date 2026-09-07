/**
 * Client calendar — pinned Phase 3 contracts (DESIGN_brief_client_calendar_CONTRACTS.md §3.2).
 * Mirrors the /calendar/* BE wire shapes via snake→camel mappers in the http adapter.
 */

export type MeetingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed'
export type BookingSource = 'call' | 'manual' | 'client' | 'landing'
export type GoogleSyncState = 'none' | 'synced' | 'error'

export interface CalendarMeeting {
  bookingId: string
  lead: { id: string; name: string; company: string }
  offer: { id: string; title: string }
  /** RFC3339 with offset — render as instant in browser tz. */
  scheduledFor: string
  end: string
  /** IANA, shown as info. */
  timezone: string
  durationMin: number
  title: string
  status: MeetingStatus
  source: BookingSource
  meetingLink?: string
  google?: { state: GoogleSyncState; eventId?: string; calendarId?: string; error?: string }
  notes?: string
  createdAt: string
}

export type AvailabilityKind = 'single' | 'range' | 'recurring_weekly'

export interface AvailabilityRule {
  id: string
  kind: AvailabilityKind
  /** RFC3339 w/ offset (recurring: time-of-day reference). */
  start: string
  end: string
  /** 0=Sun..6=Sat, recurring_weekly only. */
  daysOfWeek?: number[]
  timezone: string
  note?: string
}

export interface AvailabilityInstance {
  /** Resolved occurrence for rendering. */
  id: string
  kind: AvailabilityKind
  start: string
  end: string
  timezone: string
  note?: string
  recurring?: { daysOfWeek?: number[] }
}

export interface GoogleIntegrationState {
  connected: boolean
  accountEmail?: string
  calendarId?: string
  scopes?: string[]
  connectedAt?: string
  needsReconnect?: boolean
}
