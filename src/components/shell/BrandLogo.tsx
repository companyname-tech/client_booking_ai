import { cn } from '@/lib/utils'

/**
 * Brand mark. The source PNG has a solid black background, so we composite
 * it with `mix-blend-mode: screen` — black becomes transparent against any
 * dark surface without editing the asset.
 *
 * The icon occupies the left ~11.8% of the artwork; `mark` crops to it.
 */
const LOGO_W = 1998
const LOGO_H = 348
const MARK_W = 236

export function BrandLogo({ variant = 'full', height = 24, className }: { variant?: 'full' | 'mark'; height?: number; className?: string }) {
  const scale = height / LOGO_H
  const fullWidth = Math.round(LOGO_W * scale)
  const markWidth = Math.round(MARK_W * scale)

  return (
    <span
      className={cn('relative block shrink-0 overflow-hidden', className)}
      style={{ width: variant === 'full' ? fullWidth : markWidth, height }}
      aria-hidden
    >
      <img
        src="/brand/logo.png"
        alt=""
        draggable={false}
        className="absolute left-0 top-0 max-w-none select-none mix-blend-screen"
        style={{ height, width: fullWidth }}
      />
    </span>
  )
}
