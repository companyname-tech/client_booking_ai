import { useEffect, useState } from 'react'
import { Repeat, Trash2 } from 'lucide-react'
import { repo } from '@/api/repository'
import { Button } from '@/components/ui/Button'
import {
  BE_WEEKDAY_TOGGLES,
  formatRecurringBusyDays,
  inferRecurringBusyRule,
  recurringBusyAvailabilityPayload,
} from '@/lib/calendarBusyDays'
import { cn } from '@/lib/utils'
import type { AvailabilityInstance } from '@/types/calendar'

export interface RecurringBusyDaysPanelProps {
  clientId: string
  availability: AvailabilityInstance[]
  saving: boolean
  onSavingChange: (busy: boolean) => void
  onSaved: (message: string) => void
  onError: (message: string) => void
  onChanged: () => void
}

/** Pick weekdays that stay busy every week — AI cannot book on those days. */
export function RecurringBusyDaysPanel({
  clientId,
  availability,
  saving,
  onSavingChange,
  onSaved,
  onError,
  onChanged,
}: RecurringBusyDaysPanelProps) {
  const inferred = inferRecurringBusyRule(availability)
  const [days, setDays] = useState<number[]>(inferred?.days ?? [])

  useEffect(() => {
    setDays(inferred?.days ?? [])
  }, [inferred?.id, inferred?.days.join(',')])

  const toggleDay = (value: number) => {
    setDays((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value].sort()))
  }

  const save = async () => {
    if (days.length === 0) {
      onError('Pick at least one weekday.')
      return
    }
    onSavingChange(true)
    onError('')
    try {
      await repo.upsertAvailability(
        recurringBusyAvailabilityPayload(clientId, days, inferred?.id),
      )
      onSaved(`Recurring busy days saved — every ${formatRecurringBusyDays(days)}.`)
      onChanged()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not save recurring busy days')
    } finally {
      onSavingChange(false)
    }
  }

  const clear = async () => {
    if (!inferred?.id) return
    onSavingChange(true)
    onError('')
    try {
      await repo.deleteAvailability(inferred.id)
      setDays([])
      onSaved('Recurring busy days cleared.')
      onChanged()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not clear recurring busy days')
    } finally {
      onSavingChange(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-line bg-bg/40 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-fg">
        <Repeat className="size-3.5 text-accent" />
        Recurring busy days
      </div>
      <p className="mt-1 text-2xs text-fg-muted">
        Block the same weekdays every week — the AI will not assign meetings on those days.
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {BE_WEEKDAY_TOGGLES.map((row) => (
          <button
            key={row.value}
            type="button"
            disabled={saving}
            onClick={() => toggleDay(row.value)}
            className={cn(
              'h-8 w-10 rounded-md text-xs font-semibold transition-colors',
              days.includes(row.value)
                ? 'bg-danger/20 text-danger ring-1 ring-danger/40'
                : 'bg-surface-3 text-fg-muted hover:text-fg',
            )}
          >
            {row.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" disabled={saving || days.length === 0} onClick={() => void save()}>
          {saving ? 'Saving…' : inferred ? 'Update recurring days' : 'Save recurring days'}
        </Button>
        {inferred ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={() => void clear()}
            leadingIcon={<Trash2 className="size-3.5" />}
          >
            Clear recurring
          </Button>
        ) : null}
        {inferred ? (
          <span className="text-2xs text-fg-muted">
            Active: every {formatRecurringBusyDays(inferred.days)}
          </span>
        ) : null}
      </div>
    </div>
  )
}
