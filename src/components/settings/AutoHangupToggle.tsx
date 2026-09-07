import { cn } from '@/lib/utils'

export function AutoHangupToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="group inline-flex items-center gap-2.5 rounded-md border border-line bg-surface-1 px-3 py-2 hover:border-white/15"
    >
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors',
          on ? 'border-accent/50 bg-accent-strong' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'inline-block size-3.5 rounded-full bg-white shadow transition-transform',
            on ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </span>
      <span className="flex flex-col text-left">
        <span className="text-sm font-medium text-fg">Auto-hangup</span>
        <span className="text-2xs text-fg-muted">{on ? 'Ends calls automatically' : 'Manual hangup'}</span>
      </span>
    </button>
  )
}
