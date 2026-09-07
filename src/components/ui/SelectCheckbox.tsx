import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  label?: string
  disabled?: boolean
  className?: string
}

/** Row/header checkbox with an indeterminate state (header "select all"). */
export function SelectCheckbox({ checked, indeterminate = false, onChange, label, disabled, className }: SelectCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked
  }, [indeterminate, checked])

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      aria-checked={indeterminate ? 'mixed' : checked}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className={cn('size-4 cursor-pointer accent-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40', className)}
    />
  )
}
