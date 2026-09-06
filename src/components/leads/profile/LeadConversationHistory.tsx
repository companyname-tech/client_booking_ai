import { Link } from 'react-router-dom'
import type { LeadConversationRef } from '@/types/leadIntelligence'
import { formatDurationShort } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'

export function LeadConversationHistory({ conversations }: { conversations: LeadConversationRef[] }) {
  if (conversations.length === 0) {
    return <EmptyState title="No conversations yet" description="No conversations have been recorded for this lead yet." />
  }

  return (
    <ul className="space-y-2">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            to={`/client/ai/conversations/${c.id}`}
            className="interactive flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-1 px-4 py-3 hover:bg-surface-2"
          >
            <div>
              <div className="text-sm font-medium text-fg">{c.date}</div>
              <div className="text-xs text-fg-muted">{formatDurationShort(c.durationSec)}</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge tone={c.outcome === 'Booked' ? 'success' : 'neutral'} size="sm">{c.outcome}</StatusBadge>
              <StatusBadge tone={c.intent === 'very_high' || c.intent === 'high' ? 'success' : 'neutral'} size="sm">
                {c.intent === 'very_high' ? 'High intent' : c.intent}
              </StatusBadge>
            </div>
            <span className="text-xs text-accent">Open conversation intelligence →</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
