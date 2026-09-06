import { cn, initials } from '@/lib/utils'

export interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'size-5 text-[9px]',
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
}

/** Deterministic hue from name so avatars are stable without images. */
function hueFor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const hue = hueFor(name)
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold tracking-tight text-white ring-1 ring-white/10',
        sizeClasses[size],
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 60% 48%), hsl(${(hue + 40) % 360} 55% 36%))`,
      }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials(name)}
    </span>
  )
}
