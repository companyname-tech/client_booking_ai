import { callOutcomeMeta, callSentimentMeta } from '@/lib/status'
import type { CallOutcome, CallSentiment } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function CallOutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  const meta = callOutcomeMeta[outcome]
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
}

export function CallSentimentBadge({ sentiment }: { sentiment: CallSentiment }) {
  const meta = callSentimentMeta[sentiment]
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
}
