import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  duration?: number
  className?: string
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString('en-US')

/**
 * Counts from the previous value to `value`. Writes directly to the DOM
 * node via motion's `animate()` so React never re-renders per frame.
 */
export function AnimatedNumber({ value, format = defaultFormat, duration = 0.9, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const previous = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce) {
      el.textContent = format(value)
      previous.current = value
      return
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = format(v)
      },
    })
    previous.current = value
    return () => controls.stop()
  }, [value, reduce, duration, format])

  return (
    <span ref={ref} className={cn('tabular', className)}>
      {format(reduce ? value : 0)}
    </span>
  )
}
