import { useCallback, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { popVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useDismiss } from '@/hooks/useDismiss'
import { FieldError, FieldGroup, FieldLabel } from './Field'

export interface MultiSelectProps {
  label: string
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  error?: string
  required?: boolean
  searchable?: boolean
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  error,
  required,
  searchable = true,
}: MultiSelectProps) {
  const id = useId()
  const errorId = `${id}-error`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, [wrapRef])

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
  }

  return (
    <FieldGroup>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div ref={wrapRef} className="relative">
        <button
          id={id}
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'interactive ring-focus flex min-h-[38px] w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-left text-sm outline-none hover:border-white/15',
            error && 'border-danger/50',
            open && 'border-accent/60 ring-2 ring-accent/25',
          )}
        >
          <span className={cn('flex flex-1 flex-wrap gap-1', value.length === 0 && 'text-fg-faint')}>
            {value.length === 0 ? (
              placeholder
            ) : (
              value.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded-sm bg-white/[0.06] px-1.5 py-0.5 text-xs text-fg-secondary"
                >
                  {v}
                  <button
                    type="button"
                    aria-label={`Remove ${v}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(v)
                    }}
                    className="text-fg-muted hover:text-fg"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))
            )}
          </span>
          <ChevronDown className={cn('size-4 shrink-0 text-fg-muted transition-transform', open && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              role="listbox"
              aria-multiselectable
              variants={popVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="surface-overlay absolute z-50 mt-1 max-h-56 w-full overflow-hidden p-1"
            >
              {searchable && (
                <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
                  <Search className="size-3.5 text-fg-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <ul className="max-h-44 overflow-y-auto py-1">
                {filtered.map((opt) => {
                  const selected = value.includes(opt)
                  return (
                    <li key={opt}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => toggle(opt)}
                        className={cn(
                          'interactive flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                          selected ? 'bg-white/[0.06] text-fg' : 'text-fg-secondary hover:bg-white/[0.04]',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-4 items-center justify-center rounded-sm border',
                            selected ? 'border-accent bg-accent text-white' : 'border-line-strong',
                          )}
                        >
                          {selected && <Check className="size-2.5" strokeWidth={3} />}
                        </span>
                        {opt}
                      </button>
                    </li>
                  )
                })}
                {filtered.length === 0 && <li className="px-2 py-3 text-center text-xs text-fg-muted">No matches</li>}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </FieldGroup>
  )
}