import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-strong text-white shadow-[0_1px_0_rgb(255_255_255/0.18)_inset,0_0_0_1px_rgb(91_127_255/0.6),0_8px_20px_-10px_rgb(91_127_255/0.8)] hover:bg-accent hover:shadow-[0_1px_0_rgb(255_255_255/0.22)_inset,0_0_0_1px_rgb(124_156_255/0.7),0_10px_24px_-10px_rgb(124_156_255/0.85)] active:translate-y-px',
  secondary:
    'bg-surface-3 text-fg border border-line-strong hover:bg-surface-4 hover:border-white/15 active:translate-y-px',
  ghost: 'text-fg-secondary hover:text-fg hover:bg-white/[0.05] active:bg-white/[0.07]',
  danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/20 active:translate-y-px',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-sm',
  md: 'h-8 px-3 text-sm gap-2 rounded-md',
  lg: 'h-10 px-4 text-base gap-2 rounded-md',
  icon: 'h-8 w-8 rounded-md',
  'icon-sm': 'h-7 w-7 rounded-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', leadingIcon, trailingIcon, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'interactive ring-focus inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {leadingIcon && <span className="-ml-0.5 inline-flex shrink-0 [&>svg]:size-4">{leadingIcon}</span>}
      {children}
      {trailingIcon && <span className="-mr-0.5 inline-flex shrink-0 [&>svg]:size-4">{trailingIcon}</span>}
    </button>
  )
})
