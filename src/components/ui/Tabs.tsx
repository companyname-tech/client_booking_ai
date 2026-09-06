import { useId, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

export interface TabItem<T extends string = string> {
  id: T
  label: ReactNode
  count?: number
  disabled?: boolean
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  variant?: 'underline' | 'segmented'
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

/**
 * Tabs with a shared animated indicator. Keyboard: arrows move focus/selection.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'underline',
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: TabsProps<T>) {
  const layoutId = useId()

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    let next = index
    for (let i = 0; i < items.length; i++) {
      next = (next + dir + items.length) % items.length
      if (!items[next].disabled) break
    }
    onChange(items[next].id)
    ;(e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus()
  }

  const segmented = variant === 'segmented'

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'relative flex max-w-full items-center overflow-x-auto scrollbar-none',
        segmented ? 'gap-0.5 rounded-md border border-line bg-surface-1 p-0.5' : 'gap-1 hairline-b',
        className,
      )}
    >
      {items.map((item, index) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'interactive ring-focus relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium disabled:opacity-40',
              size === 'sm' ? 'text-xs' : 'text-sm',
              segmented ? 'h-7 rounded-[5px] px-2.5' : 'h-9 px-2.5',
              selected ? 'text-fg' : 'text-fg-muted hover:text-fg-secondary',
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={spring}
                aria-hidden
                className={cn(
                  'absolute',
                  segmented
                    ? 'inset-0 rounded-[5px] bg-surface-3 shadow-1'
                    : 'inset-x-2 bottom-0 h-px bg-fg',
                )}
              />
            )}
            <span className="relative">{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  'relative rounded-full bg-white/[0.06] px-1.5 text-2xs tabular',
                  selected ? 'text-fg-secondary' : 'text-fg-muted',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
