import { Link } from 'react-router-dom'
import type { CampaignHealth as Health, Tone } from '@/types'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { StatusDot } from '@/components/ui/StatusDot'

interface Cell {
  key: keyof Health
  label: string
  tone: Tone
  live?: boolean
}

const cells: Cell[] = [
  { key: 'active', label: 'Active', tone: 'success', live: true },
  { key: 'inSetup', label: 'In setup', tone: 'violet' },
  { key: 'awaitingApproval', label: 'Awaiting approval', tone: 'warning' },
  { key: 'paused', label: 'Paused', tone: 'neutral' },
  { key: 'completed', label: 'Completed', tone: 'info' },
]

const barTone: Record<Tone, string> = {
  neutral: 'bg-fg-muted',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  violet: 'bg-violet',
}

/**
 * Campaign health strip: a proportional distribution bar plus counts.
 * Reads as a single instrument rather than five cards.
 */
export function CampaignHealth({ health, className }: { health: Health; className?: string }) {
  const total = cells.reduce((n, c) => n + health[c.key], 0)

  return (
    <Stagger as="section" aria-label="Campaign health" className={cn('surface p-5', className)}>
      <Reveal className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-md font-semibold text-fg">Campaign health</h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            <span className="tabular text-fg-secondary">{total}</span> campaigns across your workspace
          </p>
        </div>
        <Link to="/client/campaigns" className="interactive text-xs font-medium text-fg-muted hover:text-fg-secondary">
          Manage →
        </Link>
      </Reveal>

      {/* Distribution bar */}
      <Reveal className="mt-4 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {cells.map((c) =>
          health[c.key] > 0 ? (
            <span
              key={c.key}
              className={cn('h-full rounded-[2px] transition-[flex] duration-500', barTone[c.tone])}
              style={{ flex: health[c.key] }}
            />
          ) : null,
        )}
      </Reveal>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        {cells.map((c) => (
          <Reveal key={c.key} className="flex items-start gap-2.5">
            <StatusDot tone={c.tone} live={c.live && health[c.key] > 0} size={7} className="mt-[7px]" />
            <div className="min-w-0">
              <AnimatedNumber value={health[c.key]} className="block text-xl font-semibold leading-tight tracking-tight text-fg" />
              <span className="block truncate text-xs text-fg-muted">{c.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </Stagger>
  )
}
