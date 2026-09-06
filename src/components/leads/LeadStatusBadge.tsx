import { leadStatusMeta } from '@/lib/status'
import type { LeadStatus } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function LeadStatusBadge({ status, size }: { status: LeadStatus; size?: 'sm' | 'md' }) {
  const meta = leadStatusMeta[status]
  return (
    <StatusBadge tone={meta.tone} size={size}>
      {meta.label}
    </StatusBadge>
  )
}
