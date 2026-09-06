import { Link } from 'react-router-dom'
import type { AIFollowUp, AIEscalation, AIBookingConversation, AIHealthSnapshot, AIInsight } from '@/types/aiCommand'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/utils'

const PRIORITY_TONE = { high: 'danger', medium: 'warning', low: 'neutral' } as const

export function FollowUpQueue({ items }: { items: AIFollowUp[] }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">AI Follow-ups</h2>
      <ul className="mt-4 space-y-2">
        {items.map((f) => (
          <li key={f.id} className="rounded-lg border border-line bg-surface-1 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-fg">{f.leadName}</div>
                <p className="mt-1 text-sm text-fg-muted">&ldquo;{f.note}&rdquo;</p>
              </div>
              <StatusBadge tone={PRIORITY_TONE[f.priority]} size="sm">{f.priority}</StatusBadge>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-2xs text-fg-muted">
              <span>Follow-up: {f.scheduledFor}</span>
              <span>{f.recommendation}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function HumanEscalations({ items }: { items: AIEscalation[] }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">Needs Human Attention</h2>
      <p className="text-sm text-fg-muted">{items.length} conversations need review</p>
      <ul className="mt-4 space-y-2">
        {items.map((e) => (
          <li key={e.id} className="rounded-lg border border-warning/20 bg-warning-soft/5 p-4">
            <div className="font-medium text-fg">{e.leadName} · {e.company}</div>
            <p className="mt-1 text-sm text-fg-muted">{e.reason}</p>
            {e.conversationId && (
              <Link to={`/client/ai/conversations/${e.conversationId}`} className="mt-2 inline-block text-xs font-medium text-accent">Review conversation →</Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function BookingIntelligence({ bookings }: { bookings: AIBookingConversation[] }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-fg">Booking Intelligence</h2>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-line p-3"><div className="text-2xs text-fg-muted">Bookings today</div><div className="text-xl font-semibold tabular">184</div></div>
        <div className="rounded-lg border border-line p-3"><div className="text-2xs text-fg-muted">Booking conversion</div><div className="text-xl font-semibold tabular">4.9%</div></div>
        <div className="rounded-lg border border-line p-3"><div className="text-2xs text-fg-muted">Avg time to booking</div><div className="text-xl font-semibold tabular">3m 18s</div></div>
      </div>
      <p className="mt-4 text-sm text-fg-muted">Most common path: Pain point → qualification → objection → resolution → booking</p>
      <h3 className="mt-6 text-sm font-semibold text-fg">Recent Bookings</h3>
      <ul className="mt-3 space-y-2">
        {bookings.slice(0, 5).map((b) => (
          <li key={b.id}>
            <Link to={`/client/ai/conversations/${b.conversationId}`} className="interactive flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2.5 hover:bg-surface-2">
              <div>
                <div className="font-medium text-fg">{b.leadName}</div>
                <div className="text-2xs text-fg-muted">{b.company} · {Math.floor(b.durationSec / 60)}m {b.durationSec % 60}s</div>
              </div>
              <div className="text-right text-2xs">
                <div className="font-medium text-fg">{b.bookingTime}</div>
                <div className="text-fg-muted">{b.channel} · {b.status}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function AIHealthPanel({ health }: { health: AIHealthSnapshot }) {
  return (
    <section className="surface p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fg">AI Health</h2>
        <StatusBadge tone={health.status === 'healthy' ? 'success' : 'warning'}>{health.status === 'healthy' ? 'Healthy' : 'Attention'}</StatusBadge>
      </div>
      <ul className="mt-4 space-y-2">
        {health.components.map((c) => (
          <li key={c.label} className="flex items-center justify-between text-sm">
            <span className="text-fg-secondary">{c.label}</span>
            <StatusBadge tone={c.tone} size="sm">{c.status}</StatusBadge>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function AIInsightDrawer({ insight, open, onClose }: { insight: AIInsight | null; open: boolean; onClose: () => void }) {
  return (
    <DetailDrawer open={open} onClose={onClose} title={insight?.title ?? 'AI Insight'} subtitle="Mock operational insight">
      {insight && (
        <div className="space-y-4 p-5">
          <div><div className="label-caps">Evidence</div><p className="mt-1 text-sm text-fg-secondary">{insight.evidence}</p></div>
          <div><div className="label-caps">Impact</div><p className="mt-1 text-sm font-medium text-fg">{insight.impact}</p></div>
          <div><div className="label-caps">Recommended action</div><p className="mt-1 text-sm text-fg-secondary">{insight.action}</p></div>
        </div>
      )}
    </DetailDrawer>
  )
}

export function AgentReadiness({ readiness, breakdown }: { readiness: number; breakdown: { label: string; value: number }[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <div className="text-3xl font-semibold tabular text-fg">{readiness}%</div>
      <div className="text-sm text-fg-muted">Agent readiness</div>
      <div className="mt-4 space-y-2">
        {breakdown.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-xs"><span className="text-fg-muted">{b.label}</span><span className="tabular">{b.value}%</span></div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-accent/70" style={{ width: `${b.value}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AIPerformanceGrid({ metrics }: { metrics: { label: string; value: number; delta: number }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-lg border border-line bg-surface-1 p-4">
          <div className="text-xs text-fg-muted">{m.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular text-fg">{m.value}%</div>
          <div className={cn('text-2xs font-medium', m.delta > 0 ? 'text-success' : 'text-fg-muted')}>+{m.delta}pp</div>
        </div>
      ))}
      <p className="col-span-full text-2xs text-fg-faint">Simulated AI metrics — not real model benchmarks</p>
    </div>
  )
}
