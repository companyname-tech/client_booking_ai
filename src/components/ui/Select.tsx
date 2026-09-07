import { useCallback, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown } from 'lucide-react'
import { popVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useDismiss } from '@/hooks/useDismiss'

export interface SelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Shown when `value` is empty and no option matches it. */
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  align?: 'start' | 'end'
  /** Wrapper class — use it for width (e.g. `w-full`, `sm:max-w-xs`). */
  className?: string
  id?: string
}

/**
 * The app-styled single-select dropdown. Replaces native `<select>` so the
 * open list is themed like the rest of the UI (never the browser's plain
 * popup). Keyboard: ArrowUp/Down to move, Enter to pick, Escape to close.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  ariaLabel,
  disabled,
  size = 'md',
  align = 'start',
  className,
  id,
}: SelectProps) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, [wrapRef])

  const selected = options.find((o) => o.value === value) ?? null
  const activeOption = options[active] ?? null

  const toggle = () => {
    if (disabled) return
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen((o) => !o)
  }

  const pick = (option: SelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        toggle()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1 < options.length ? a + 1 : options.length > 0 ? 0 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + options.length) % Math.max(options.length, 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (activeOption) pick(activeOption)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(Math.max(0, options.length - 1))
    }
  }

  return (
    <div ref={wrapRef} className={cn('relative', className)} onKeyDown={onKeyDown}>
      <button
        id={id ?? `${uid}-trigger`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          'ring-focus interactive flex w-full items-center justify-between gap-2 rounded-md border border-line bg-surface-1 text-left text-fg',
          size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm',
          open && 'border-accent',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-fg-muted')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-fg-muted transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-labelledby={id ? `${id}-trigger` : `${uid}-trigger`}
            variants={popVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ originY: 0 }}
            className={cn(
              'surface-overlay absolute z-50 max-h-64 overflow-auto p-1',
              align === 'start' ? 'left-0' : 'right-0',
              size === 'sm' ? 'min-w-[10rem]' : 'min-w-[12rem]',
            )}
          >
            {options.map((option, index) => {
              const isActive = index === active
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(option)}
                  className={cn(
                    'interactive flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left outline-none',
                    size === 'sm' ? 'text-xs' : 'text-sm',
                    isActive ? 'bg-white/[0.06] text-fg' : 'text-fg-secondary',
                    option.disabled && 'pointer-events-none opacity-40',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-xs text-fg-muted">{option.description}</span>
                    )}
                  </span>
                  {isSelected && <Check className="size-4 shrink-0 text-accent" />}
                </button>
              )
            })}
            {options.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-fg-muted">No options</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
