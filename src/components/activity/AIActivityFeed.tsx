import { memo } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Bot, CalendarCheck, FileText, Gauge, GraduationCap, Phone, Plug, Sparkles } from 'lucide-react'
import type { Activity, ActivityKind, Tone } from '@/types'
import { cn, formatRelativeTime } from '@/lib/utils'
import { NOW } from '@/data/time'
import { Reveal, Stagger } from '@/components/motion/Reveal'
import { StatusDot } from '@/components/ui/StatusDot'

const kindIcon: Record<ActivityKind, typeof Bot> = {
  leads_analyzed: Bot,
  calls_completed: Phone,
  bookings_detected: CalendarCheck,
  budget_threshold: Gauge,
  summary_generated: FileText,
  training_progress: GraduationCap,
  integration: Plug,
  approval: BadgeCheck,
}

const toneText: Record<Tone, string> = {
  neutral: 'text-fg-muted bg-white/[0.04] ring-white/[0.06]',
  info: 'text-accent bg-accent-soft ring-accent/15',
  success: 'text-success bg-success-soft ring-success/15',
  warning: 'text-warning bg-warning-soft ring-warning/15',
  danger: 'text-danger bg-danger-soft ring-danger/15',
  violet: 'text-violet bg-violet-soft ring-violet/15',
}

const Item = memo(function Item({ activity, isLatest, isLast }: { activity: Activity; isLatest: boolean; isLast: boolean }) {
  const Icon = kindIcon[activity.kind] ?? Bot
  const inner = (
    <>
      <span className={cn('relative flex size-7 shrink-0 items-center justify-center rounded-md ring-1', toneText[activity.tone])}>
        <Icon className="size-3.5" strokeWidth={1.75} />
        {isLatest && <StatusDot tone={activity.tone} live size={6} className="absolute -right-0.5 -top-0.5 ring-2 ring-surface-2" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-fg">{activity.title}</span>
        {activity.description && <span className="block truncate text-xs text-fg-muted">{activity.description}</span>}
      </span>
      <time dateTime={activity.timestamp} className="shrink-0 pt-0.5 text-2xs tabular text-fg-muted">
        {formatRelativeTime(activity.timestamp, NOW)}
      </time>
    </>
  )

  return (
    <Reveal as="li" className="relative">
      {!isLast && <span aria-hidden className="absolute left-[13px] top-9 h-[calc(100%-22px)] w-px bg-line" />}
      {activity.offerCampaignId ? (
        <Link
          to={`/client/campaigns/${activity.offerCampaignId}`}
          className="interactive ring-focus -mx-2 flex items-start gap-3 rounded-md px-2 py-2 outline-none hover:bg-white/[0.03]"
        >
          {inner}
        </Link>
      ) : (
        <div className="-mx-2 flex items-start gap-3 px-2 py-2">{inner}</div>
      )}
    </Reveal>
  )
})

export function AIActivityFeed({ items, className }: { items: Activity[]; className?: string }) {
  return (
    <section className={cn('surface flex min-w-0 flex-col p-5', className)} aria-labelledby="ai-activity-title">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="flex size-5 items-center justify-center rounded-sm bg-violet-soft text-violet">
            <Sparkles className="size-3 motion-safe:animate-pulse-dot" />
          </span>
          <h2 id="ai-activity-title" className="text-md font-semibold text-fg">
            AI activity
          </h2>
        </div>
        <span className="flex items-center gap-1.5 text-2xs font-medium text-fg-muted">
          <StatusDot tone="success" live size={6} /> Live
        </span>
      </div>
      <Stagger as="ul" stagger={0.05} className="-my-1 flex-1">
        {items.map((a, i) => (
          <Item key={a.id} activity={a} isLatest={i === 0} isLast={i === items.length - 1} />
        ))}
      </Stagger>
      <Link
        to="/client/agents"
        className="interactive mt-3 self-start text-xs font-medium text-fg-muted hover:text-fg-secondary"
      >
        View all agent activity →
      </Link>
    </section>
  )
}
