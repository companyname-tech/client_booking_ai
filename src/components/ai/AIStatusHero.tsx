import { Bot } from 'lucide-react'
import type { AICommandOverview } from '@/types/aiCommand'
import { formatNumber, formatPercent } from '@/lib/utils'
import { AnimatedNumber } from '@/components/motion/AnimatedNumber'
import { StatusDot } from '@/components/ui/StatusDot'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/lib/utils'

const PIPELINE = ['Calling', 'Connecting', 'Qualifying', 'Booking']

export function AIStatusHero({ overview }: { overview: AICommandOverview }) {
  const active = overview.status === 'active'

  return (
    <div className="surface overflow-hidden">
      <div className="grid gap-px bg-line lg:grid-cols-[1.2fr_1fr]">
        <div className="bg-surface-2 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-violet-soft text-violet ring-1 ring-violet/20">
              <Bot className="size-6" strokeWidth={1.75} />
            </span>
            <div>
              <div className="label-caps">AI Agent</div>
              <h2 className="text-2xl font-semibold text-fg">{overview.agentName}</h2>
              <p className="text-sm text-fg-muted">{overview.agentRole}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-xs font-medium">
                <StatusDot tone={active ? 'success' : overview.status === 'paused' ? 'warning' : 'neutral'} live={active} size={6} />
                {active ? 'Active' : overview.status === 'paused' ? 'Paused' : overview.status === 'training' ? 'Training' : 'Idle'}
              </div>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: 'Campaigns active', value: overview.activeCampaigns },
              { label: 'Calls today', value: overview.callsToday },
              { label: 'Conversations', value: overview.conversations },
              { label: 'Bookings', value: overview.bookings },
              { label: 'Follow-ups', value: overview.followUps },
              { label: 'AI success rate', value: overview.successRate, format: formatPercent },
            ].map((m) => (
              <div key={m.label}>
                <dt className="text-2xs text-fg-muted">{m.label}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular text-fg">
                  <AnimatedNumber value={m.value} format={m.format ?? formatNumber} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-surface-2 p-5 sm:p-6">
          <div className="label-caps">{active ? 'AI is active' : 'AI status'}</div>
          <p className="mt-1 text-sm text-fg-secondary">
            {active ? `Handling conversations across ${overview.activeCampaigns} campaigns.` : 'Agent is not currently placing calls.'}
          </p>
          {active && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-1 text-2xs text-fg-muted">
                {PIPELINE.map((step, i) => (
                  <span key={step} className="flex items-center gap-1">
                    <span className={cn('rounded-full px-2 py-0.5', i === 2 ? 'bg-accent-soft text-accent' : 'bg-surface-3')}>{step}</span>
                    {i < PIPELINE.length - 1 && <span>→</span>}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border border-line bg-surface-1 px-3 py-2"><span className="text-fg-muted">Active</span><div className="font-semibold tabular">{overview.activeConversations}</div></div>
                <div className="rounded-md border border-line bg-surface-1 px-3 py-2"><span className="text-fg-muted">Booking</span><div className="font-semibold tabular">{overview.bookingConversations}</div></div>
                <div className="rounded-md border border-line bg-surface-1 px-3 py-2"><span className="text-fg-muted">Qualifying</span><div className="font-semibold tabular">{overview.qualificationConversations}</div></div>
                <div className="rounded-md border border-line bg-surface-1 px-3 py-2"><span className="text-fg-muted">Follow-ups</span><div className="font-semibold tabular">{overview.followUpConversations}</div></div>
              </div>
            </>
          )}
          {overview.preparationStages && (
            <div className="mt-4 space-y-2">
              {overview.preparationStages.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className={s.done ? 'text-fg' : 'text-fg-muted'}>{s.label}</span>
                  <span className="text-2xs text-fg-muted">{s.done ? '✓' : 'Pending'}</span>
                </div>
              ))}
              <ProgressBar value={(overview.preparationStages.filter((s) => s.done).length / overview.preparationStages.length) * 100} tone="violet" size="sm" className="mt-2" label="Preparation progress" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
