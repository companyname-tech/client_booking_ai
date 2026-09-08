import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

export interface SecretInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Affects the eye-toggle aria label ("Show password" vs "Show secret"). */
  variant?: 'password' | 'secret'
}

/**
 * Masked input with an eye toggle. Used for passwords, API keys, and tokens.
 */
export const SecretInput = forwardRef<HTMLInputElement, SecretInputProps>(function SecretInput(
  { className, variant = 'secret', autoComplete, ...props },
  ref,
) {
  const [show, setShow] = useState(false)
  const noun = variant === 'password' ? 'password' : 'secret'
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete ?? 'off'}
        className={cn('pr-9', className)}
        {...props}
      />
      <button
        type="button"
        aria-label={show ? `Hide ${noun}` : `Show ${noun}`}
        aria-pressed={show}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-fg-muted hover:text-fg focus:outline-none"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
})
