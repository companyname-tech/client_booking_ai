import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export interface SecretInputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * Password input with an eye toggle. Used for provider credentials —
 * never stores or echoes the raw value beyond the field itself.
 */
export const SecretInput = forwardRef<HTMLInputElement, SecretInputProps>(function SecretInput(
  { className, ...props },
  ref,
) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        autoComplete="off"
        className={cn('pr-9', className)}
        {...props}
      />
      <button
        type="button"
        aria-label={show ? 'Hide secret' : 'Show secret'}
        onClick={() => setShow((s) => !s)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-fg-muted hover:text-fg-secondary"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
})
