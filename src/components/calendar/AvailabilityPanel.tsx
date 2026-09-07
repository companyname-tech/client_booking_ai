import { useState } from 'react'
import { Trash2, Clock3 } from 'lucide-react'
import { repo } from '@/api/repository'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { WEEKDAY_NAMES_MON, WEEKDAY_TOGGLES, fmtDayShort, fmtTime, ilFromParts, toIso, CAL_TZ } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import type { AvailabilityInstance, AvailabilityKind } from '@/types/calendar'

const KINDS: { value: AvailabilityKind; label: string }[] = [
  { value: 'single', label: 'Single day' },
  { value: 'range', label: 'Date range' },
  { value: 'recurring_weekly', label: 'Weekly' },
]

/** Block-out editor: single / range / recurring-weekly + list of current blocks. */
export function AvailabilityPanel({
  instances,
  clientId,
  onChanged,
}: {
  instances: AvailabilityInstance[]
  clientId?: string
  onChanged: () => void
}) {
  const [kind, setKind] = useState<AvailabilityKind>('single')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [days, setDays] = useState<number[]>([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Israel wall clock → RFC3339 instant (the business works by Israel time).
  const toLocalIso = (date: string, time: string) => {
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    return toIso(ilFromParts(y, m, d, hh ?? 0, mm ?? 0))
  }

  const submit = async () => {
    if (!startDate) return setError('Pick a start date')
    setSaving(true)
    setError('')
    try {
      if (kind === 'recurring_weekly') {
        if (days.length === 0) {
          setSaving(false)
          return setError('Pick at least one weekday')
        }
        // recurring: time-of-day reference (2000-01-03 was a Monday; BE days_of_week 0=Monday)
        const ref = toLocalIso('2000-01-03', startTime)
        const refEnd = toLocalIso('2000-01-03', endTime)
        await repo.upsertAvailability({
          clientId,
          kind,
          start: ref,
          end: refEnd,
          daysOfWeek: days,
          timezone: CAL_TZ,
          note: note.trim() || undefined,
        })
      } else {
        const start = toLocalIso(startDate, startTime)
        const end = toLocalIso(kind === 'single' ? startDate : endDate || startDate, kind === 'single' ? endTime : endTime)
        await repo.upsertAvailability({
          clientId,
          kind,
          start,
          end,
          timezone: CAL_TZ,
          note: note.trim() || undefined,
        })
      }
      setStartDate('')
      setEndDate('')
      setNote('')
      setDays([])
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save block')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    setRemoving(id)
    setError('')
    try {
      await repo.deleteAvailability(id)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete block')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="surface space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Clock3 className="size-4 text-fg-muted" />
        <h3 className="text-sm font-semibold text-fg">Availability</h3>
      </div>

      <div className="space-y-3 rounded-md border border-line p-3">
        <div className="flex flex-wrap gap-1">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                kind === k.value ? 'border-line-strong bg-surface-3 text-fg' : 'border-line text-fg-muted',
              )}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <span className="mb-1 block text-2xs text-fg-muted">{kind === 'recurring_weekly' ? 'Start time' : 'Start'}</span>
            {kind === 'recurring_weekly' ? (
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            ) : (
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            )}
          </div>
          {kind !== 'recurring_weekly' && (
            <div>
              <span className="mb-1 block text-2xs text-fg-muted">{kind === 'single' ? 'Until' : 'End date'}</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
          <div>
            <span className="mb-1 block text-2xs text-fg-muted">Time</span>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <span className="mb-1 block text-2xs text-fg-muted">End time</span>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        {kind === 'recurring_weekly' && (
          <div className="flex flex-wrap gap-1">
            {WEEKDAY_TOGGLES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDays((prev) => (prev.includes(d.value) ? prev.filter((x) => x !== d.value) : [...prev, d.value]))}
                className={cn(
                  'h-7 w-9 rounded text-xs font-medium transition-colors',
                  days.includes(d.value) ? 'bg-accent text-white' : 'bg-surface-3 text-fg-muted hover:text-fg',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="max-w-xs" />

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : kind === 'single' ? 'Block day' : kind === 'range' ? 'Block range' : 'Set weekly hours'}
          </Button>
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      </div>

      {instances.length > 0 && (
        <ul className="space-y-1">
          {instances.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface-1 px-2.5 py-1.5">
              <div className="min-w-0 text-xs text-fg-secondary">
                <span className="capitalize">{b.kind === 'recurring_weekly' ? 'Weekly' : b.kind}</span>
                {b.kind === 'recurring_weekly'
                  ? ` · ${(b.recurring?.daysOfWeek ?? []).length ? (b.recurring?.daysOfWeek ?? []).map((d) => WEEKDAY_NAMES_MON[d] ?? d).join(' ') : 'selected days'} · ${fmtTime(b.start)}–${fmtTime(b.end)}`
                  : ` · ${fmtDayShort(b.start)}${fmtTime(b.start) ? ` ${fmtTime(b.start)}–${fmtTime(b.end)}` : ''}`}
                {b.note ? <span className="ml-1 text-fg-faint">· {b.note}</span> : null}
              </div>
              <button
                type="button"
                onClick={() => void remove(b.id)}
                disabled={removing === b.id}
                className="rounded p-1 text-fg-faint hover:text-danger disabled:opacity-40"
                aria-label="Delete block"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
