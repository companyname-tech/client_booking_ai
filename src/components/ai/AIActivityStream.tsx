import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AIActivityEvent } from '@/types/aiCommand'
import { repo } from '@/data/repository'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { StatusDot } from '@/components/ui/StatusDot'
import { cn } from '@/lib/utils'

const TONE: Record<AIActivityEvent['status'], 'success' | 'info' | 'warning' | 'neutral'> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  neutral: 'neutral',
}

export function AIActivityStream({ events: initial }: { events: AIActivityEvent[] }) {
  const [events, setEvents] = useState(initial)

  const simulate = () => {
    const ev: AIActivityEvent = {
      id: `sim_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      offerCampaignId: 'cmp_q4_arch',
      campaignName: 'Q4 Architecture Outreach',
      leadName: 'David Carter',
      event: 'Qualification in progress',
      status: 'info',
    }
    repo.addSimulatedActivity(ev)
    setEvents((prev) => [ev, ...prev])
  }

  return (
    <section className="surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">AI Activity</h2>
          <p className="text-sm text-fg-muted">Recent agent events · demo data</p>
        </div>
        <Button variant="ghost" size="sm" onClick={simulate}>Simulate activity</Button>
      </div>
      <Stagger as="ul" className="space-y-0" stagger={0.03}>
        {events.map((e) => (
          <Reveal key={e.id} as="li" className="flex gap-3 border-b border-line py-3 last:border-0">
            <span className="w-16 shrink-0 pt-0.5 font-mono text-2xs tabular text-fg-muted">{e.timestamp}</span>
            <StatusDot tone={TONE[e.status]} size={6} className="mt-1.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg">{e.event}</p>
              <p className="mt-0.5 text-2xs text-fg-muted">
                {e.campaignName}
                {e.leadName && <> · {e.leadName}</>}
              </p>
            </div>
          </Reveal>
        ))}
      </Stagger>
    </section>
  )
}

export function ActiveConversationCard({
  conversation,
}: {
  conversation: import('@/types/aiCommand').AIConversationSummary
}) {
  const intentColor = conversation.intent === 'high' ? 'text-success' : conversation.intent === 'medium' ? 'text-warning' : 'text-fg-muted'
  return (
    <Link
      to={`/client/ai/conversations/${conversation.id}`}
      className={cn(
        'interactive block rounded-lg border border-line bg-surface-2 p-4 transition-colors hover:border-line-strong hover:bg-surface-3/50',
        conversation.isActive && 'border-accent/20',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-fg">{conversation.leadName}</div>
          <div className="text-sm text-fg-muted">{conversation.company}</div>
        </div>
        {conversation.isActive && <span className="rounded-full bg-success-soft px-2 py-0.5 text-2xs font-medium text-success">Live</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-2xs">
        <span className="rounded-full bg-surface-3 px-2 py-0.5 capitalize text-fg-secondary">{conversation.stage.replace('_', ' ')}</span>
        <span className="rounded-full bg-surface-3 px-2 py-0.5 tabular text-fg-secondary">{conversation.confidence}% confidence</span>
        <span className={cn('rounded-full bg-surface-3 px-2 py-0.5 capitalize', intentColor)}>{conversation.intent} intent</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-2xs text-fg-muted">
        <span>{conversation.campaignName}</span>
        <span className="tabular">{Math.floor(conversation.durationSec / 60)}:{String(conversation.durationSec % 60).padStart(2, '0')}</span>
      </div>
    </Link>
  )
}
