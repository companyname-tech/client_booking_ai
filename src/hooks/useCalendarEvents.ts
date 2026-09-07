import { useCallback, useMemo } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { visibleRange, toIso, addDays, startOfDay } from '@/lib/calendar'
import type { AvailabilityInstance, CalendarMeeting, MeetingStatus } from '@/types/calendar'

export interface CalendarWindow {
  view: 'month' | 'week'
  cursor: Date
  clientId?: string
}

/** Meetings + availability for the visible window; refetch when the window changes. */
export function useCalendarEvents({ view, cursor, clientId }: CalendarWindow) {
  const range = useMemo(() => visibleRange(cursor, view), [cursor, view])

  const meetings = useAsyncData(
    () =>
      repo.getCalendarMeetings({
        clientId,
        from: range.from,
        to: range.to,
      }),
    [clientId, range.from, range.to],
  )

  const availability = useAsyncData(
    () => repo.getAvailability({ clientId, from: range.from, to: range.to }),
    [clientId, range.from, range.to],
  )

  const refresh = useCallback(() => {
    meetings.reload()
    availability.reload()
  }, [meetings, availability])

  return {
    meetings: (meetings.data ?? []) as CalendarMeeting[],
    availability: (availability.data ?? []) as AvailabilityInstance[],
    loading: meetings.loading || availability.loading,
    error: meetings.error ?? availability.error,
    reload: refresh,
  }
}

/** Slot options for a given day (day-range chunk around it). */
export function useDaySlots(day: Date, durationMin: number, clientId?: string, enabled = true) {
  const from = useMemo(() => toIso(startOfDay(day)), [day])
  const to = useMemo(() => toIso(addDays(startOfDay(day), 1)), [day])
  const slots = useAsyncData(
    () => (enabled ? repo.getSlots({ clientId, from, to, durationMin }) : Promise.resolve([] as string[])),
    [clientId, from, to, durationMin, enabled],
  )
  return { slots: (slots.data ?? []) as string[], loading: slots.loading, reload: slots.reload }
}

export type { MeetingStatus }
