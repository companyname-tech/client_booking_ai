import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  label?: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div className={className}>
      {label && <div className="mb-1.5 text-sm font-medium text-fg">{label}</div>}
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-0.5 rounded-md border border-line bg-surface-1 p-0.5"
      >
        {options.map((opt) => {
          const selected = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={cn(
                'interactive ring-focus flex-1 whitespace-nowrap rounded-[5px] px-3 font-medium outline-none transition-colors',
                size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm',
                selected ? 'bg-surface-3 text-fg shadow-1' : 'text-fg-muted hover:text-fg-secondary',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
