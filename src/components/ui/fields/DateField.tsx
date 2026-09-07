import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDismiss } from '@/hooks/useDismiss'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export interface DateFieldProps {
  id?: string
  /** DD/MM/YYYY display string ('' = empty). */
  value: string
  onChange: (dateStr: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  min?: Date
  max?: Date
}

function parseValue(value: string): Date | null {
  const m = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec((value || '').trim())
  if (!m) return null
  const [, d, mo, y] = m
  const date = new Date(Number(y), Number(mo) - 1, Number(d))
  return Number.isNaN(date.getTime()) ? null : date
}

function toDDMMYYYY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day} / ${month} / ${d.getFullYear()}`
}

/**
 * Date input + calendar popover (month grid, prev/next). Interaction ported
 * from the MoneyMakers shared-repo CalendarPicker, restyled to app tokens.
 * Value stays a plain DD/MM/YYYY string ('' when cleared).
 */
export function DateField({
  id,
  value,
  onChange,
  placeholder = 'DD / MM / YYYY',
  disabled = false,
  className,
  label,
  min,
  max,
}: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const selected = useMemo(() => parseValue(value), [value])

  const [cursor, setCursor] = useState(() => {
    const base = selected ?? new Date()
    return { month: base.getMonth(), year: base.getFullYear() }
  })

  useEffect(() => {
    if (!open) return
    const base = selected ?? new Date()
    setCursor({ month: base.getMonth(), year: base.getFullYear() })
  }, [open, selected])

  useDismiss(open, () => setOpen(false), [rootRef, panelRef])

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const firstDow = new Date(cursor.year, cursor.month, 1).getDay()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isDisabled = (d: Date) => {
    if (min && d < new Date(min.getFullYear(), min.getMonth(), min.getDate())) return true
    if (max && d > new Date(max.getFullYear(), max.getMonth(), max.getDate())) return true
    return false
  }

  const isSelected = (day: number) =>
    !!selected &&
    selected.getDate() === day &&
    selected.getMonth() === cursor.month &&
    selected.getFullYear() === cursor.year

  const isToday = (day: number) => {
    const now = new Date()
    return now.getDate() === day && now.getMonth() === cursor.month && now.getFullYear() === cursor.year
  }

  const pick = (day: number) => {
    onChange(toDDMMYYYY(new Date(cursor.year, cursor.month, day)))
    setOpen(false)
  }

  const move = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { month: d.getMonth(), year: d.getFullYear() }
    })
  }

  const panel = open ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Pick a date"
      className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-line bg-popover p-3 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => move(-1)}
          className="flex size-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-sm font-semibold text-fg">
          {MONTHS[cursor.month]} {cursor.year}
        </div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => move(1)}
          className="flex size-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-0.5 text-center">
        {DOW.map((d) => (
          <div key={d} className="py-1 text-2xs font-medium uppercase text-fg-muted">
            {d}
          </div>
        ))}
        {cells.map((day, i) =>
          day === null ? (
            <span key={`e-${i}`} />
          ) : (
            <button
              key={day}
              type="button"
              disabled={isDisabled(new Date(cursor.year, cursor.month, day))}
              onClick={() => pick(day)}
              className={cn(
                'flex aspect-square items-center justify-center rounded-md text-sm text-fg hover:bg-surface-3 disabled:opacity-30 disabled:hover:bg-transparent',
                isSelected(day) && 'bg-accent font-semibold text-white hover:bg-accent',
                !isSelected(day) && isToday(day) && 'ring-1 ring-inset ring-accent/60',
              )}
            >
              {day}
            </button>
          ),
        )}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
        <button
          type="button"
          onClick={() => {
            onChange('')
            setOpen(false)
          }}
          className="text-xs text-fg-muted hover:text-fg"
        >
          Clear
        </button>
        <span className="text-2xs tabular text-fg-muted">{value}</span>
      </div>
    </div>
  ) : null

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {label ? <span className="mb-1.5 block text-xs font-medium text-fg-secondary">{label}</span> : null}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50',
          !value && 'text-fg-muted',
        )}
      >
        <CalendarDays className="size-4 shrink-0 text-fg-muted" />
        <span className={cn('flex-1 tabular', value && 'text-fg')}>{value || placeholder}</span>
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </div>
  )
}
