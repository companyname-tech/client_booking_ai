import { useCallback, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { popVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useDismiss } from '@/hooks/useDismiss'

export interface DropdownItem {
  id: string
  label: string
  description?: string
  icon?: ReactNode
  shortcut?: string
  selected?: boolean
  destructive?: boolean
  onSelect?: () => void
}

export interface DropdownSection {
  label?: string
  items: DropdownItem[]
}

export interface DropdownProps {
  trigger: (props: { open: boolean; toggle: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu'; id: string }) => ReactNode
  sections: DropdownSection[]
  align?: 'start' | 'end'
  side?: 'top' | 'bottom'
  width?: number
  className?: string
}

/**
 * Minimal, accessible dropdown menu. Keyboard: arrow keys, Enter, Escape.
 */
export function Dropdown({ trigger, sections, align = 'start', side = 'bottom', width = 224, className }: DropdownProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, [wrapRef])

  const flat = sections.flatMap((s) => s.items)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flat[active]?.onSelect?.()
      close()
    }
  }

  return (
    <div ref={wrapRef} className={cn('relative inline-flex', className)} onKeyDown={onKeyDown}>
      {trigger({
        open,
        toggle: () => {
          setActive(0)
          setOpen((o) => !o)
        },
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        id: `${id}-trigger`,
      })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-labelledby={`${id}-trigger`}
            variants={popVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width, originY: side === 'bottom' ? 0 : 1 }}
            className={cn(
              'surface-overlay absolute z-50 p-1',
              side === 'bottom' ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]',
              align === 'start' ? 'left-0' : 'right-0',
            )}
          >
            {sections.map((section, si) => (
              <div key={si} className={cn(si > 0 && 'mt-1 border-t border-line pt-1')}>
                {section.label && <div className="label-caps px-2 pb-1 pt-1.5">{section.label}</div>}
                {section.items.map((item) => {
                  const index = flat.indexOf(item)
                  const isActive = index === active
                  return (
                    <button
                      key={item.id}
                      role="menuitem"
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => {
                        item.onSelect?.()
                        close()
                      }}
                      className={cn(
                        'interactive flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm outline-none',
                        isActive ? 'bg-white/[0.06] text-fg' : 'text-fg-secondary',
                        item.destructive && 'text-danger',
                      )}
                    >
                      {item.icon && <span className="inline-flex shrink-0 text-fg-muted [&>svg]:size-4">{item.icon}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{item.label}</span>
                        {item.description && (
                          <span className="block truncate text-xs text-fg-muted">{item.description}</span>
                        )}
                      </span>
                      {item.selected && <Check className="size-4 text-accent" />}
                      {item.shortcut && <span className="text-2xs text-fg-muted">{item.shortcut}</span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
