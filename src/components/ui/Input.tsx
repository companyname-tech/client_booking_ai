import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const inputClassName =
  'interactive w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-fg placeholder:text-fg-faint hover:border-white/15 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-50'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  inputSize?: 'md' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, inputSize = 'md', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        inputClassName,
        inputSize === 'lg' && 'py-3 text-lg font-semibold tabular',
        error && 'border-danger/50 focus:border-danger/60 focus:ring-danger/25',
        className,
      )}
      {...props}
    />
  )
})
