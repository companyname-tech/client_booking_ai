import { cloneElement, useCallback, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { tooltipVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Side = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content: ReactNode
  side?: Side
  /** Hide the tooltip entirely (e.g. when a label is already visible). */
  disabled?: boolean
  delay?: number
  children: ReactElement<Record<string, unknown>>
}

const GAP = 8

function computePosition(rect: DOMRect, side: Side) {
  switch (side) {
    case 'top':
      return { x: rect.left + rect.width / 2, y: rect.top - GAP, transform: 'translate(-50%, -100%)' }
    case 'bottom':
      return { x: rect.left + rect.width / 2, y: rect.bottom + GAP, transform: 'translate(-50%, 0)' }
    case 'left':
      return { x: rect.left - GAP, y: rect.top + rect.height / 2, transform: 'translate(-100%, -50%)' }
    case 'right':
      return { x: rect.right + GAP, y: rect.top + rect.height / 2, transform: 'translate(0, -50%)' }
  }
}

/**
 * Lightweight portal tooltip. Shows on hover/focus, positioned from the
 * trigger's bounding rect so it never gets clipped by overflow containers.
 */
export function Tooltip({ content, side = 'top', disabled, delay = 250, children }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<ReturnType<typeof computePosition> | null>(null)
  const timer = useRef<number | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const show = useCallback(() => {
    if (disabled) return
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const el = triggerRef.current
      if (!el) return
      setPos(computePosition(el.getBoundingClientRect(), side))
      setOpen(true)
    }, delay)
  }, [delay, disabled, side])

  const hide = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    setOpen(false)
  }, [])

  const child = children as ReactElement<{
    ref?: unknown
    onMouseEnter?: (e: unknown) => void
    onMouseLeave?: (e: unknown) => void
    onFocus?: (e: unknown) => void
    onBlur?: (e: unknown) => void
    'aria-describedby'?: string
  }>

  const trigger = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node
      const childRef = (child.props as { ref?: unknown }).ref
      if (typeof childRef === 'function') childRef(node)
      else if (childRef && typeof childRef === 'object') (childRef as { current: unknown }).current = node
    },
    onMouseEnter: (e: unknown) => {
      child.props.onMouseEnter?.(e)
      show()
    },
    onMouseLeave: (e: unknown) => {
      child.props.onMouseLeave?.(e)
      hide()
    },
    onFocus: (e: unknown) => {
      child.props.onFocus?.(e)
      show()
    },
    onBlur: (e: unknown) => {
      child.props.onBlur?.(e)
      hide()
    },
    'aria-describedby': open ? id : undefined,
  })

  return (
    <>
      {trigger}
      {createPortal(
        <AnimatePresence>
          {open && pos && !disabled && (
            <div
              className="pointer-events-none fixed z-[80]"
              style={{ left: pos.x, top: pos.y, transform: pos.transform }}
            >
              <motion.div
                id={id}
                role="tooltip"
                variants={tooltipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                  'max-w-xs rounded-md border border-line-strong bg-surface-4 px-2.5 py-1.5 text-xs font-medium text-fg shadow-2',
                )}
              >
                {content}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
