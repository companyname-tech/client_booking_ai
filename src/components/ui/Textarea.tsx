import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { inputClassName } from './Input'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        inputClassName,
        'resize-y min-h-[88px]',
        error && 'border-danger/50 focus:border-danger/60 focus:ring-danger/25',
        className,
      )}
      {...props}
    />
  )
})
