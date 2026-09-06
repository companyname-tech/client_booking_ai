import { Calendar, Video } from 'lucide-react'
import type { Booking } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function BookingCard({ booking }: { booking: Booking }) {
  const d = new Date(booking.scheduledFor)
  return (
    <div className="rounded-lg border border-success/20 bg-success-soft/10 p-4">
      <StatusBadge tone="success" size="sm">Booked</StatusBadge>
      <div className="mt-3">
        <div className="text-lg font-semibold text-fg">
          {d.toLocaleDateString('en-US', { weekday: 'long' })}
        </div>
        <div className="text-sm text-fg-secondary">
          {d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} ·{' '}
          {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
        <p className="mt-1 text-sm text-fg-muted">{booking.title}</p>
      </div>
      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-fg-muted">
          <Calendar className="size-3.5" /> Calendly
        </div>
        <div className="flex items-center gap-2 text-fg-muted">
          <Video className="size-3.5" /> Zoom
        </div>
      </dl>
      <button type="button" className="interactive mt-3 text-xs font-medium text-accent hover:text-fg">
        View booking →
      </button>
    </div>
  )
}
