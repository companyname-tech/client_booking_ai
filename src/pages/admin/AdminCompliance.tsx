import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

const COMPLIANCE_COLORS = {
  passed: 'text-success border-success/20 bg-success-soft/10',
  needs_review: 'text-warning border-warning/20 bg-warning-soft/10',
  warning: 'text-danger border-danger/20 bg-danger-soft/10',
  not_applicable: 'text-fg-muted border-line bg-surface-1',
}

export default function AdminCompliance() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getCampaigns())
  const campaigns = (data ?? []).filter((c) => ['legal_review', 'awaiting_approval', 'ai_training'].includes(c.status))

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Compliance" />}
          title="Compliance review"
          description="Internal review checklist. AI-assisted preliminary checks — human review required."
        />
        {loading ? (
          <LoadingState rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : campaigns.length === 0 ? (
          <EmptyState title="Nothing in compliance review" description="Campaigns in legal review will appear here." />
        ) : (
          campaigns.map((c) => (
            <Reveal key={c.id}>
              <ComplianceCard campaignId={c.id} name={c.name} />
            </Reveal>
          ))
        )}
      </PageContainer>
    </PageTransition>
  )
}

function ComplianceCard({ campaignId, name }: { campaignId: string; name: string }) {
  const { data: review, loading, error } = useAsyncData(() => repo.getCampaignReview(campaignId), [campaignId])

  if (loading) return <LoadingState rows={2} />
  if (error || !review) return <ErrorState message={error ?? 'Could not load compliance review'} />

  return (
    <div className="surface p-5">
      <h3 className="font-semibold text-fg">{name}</h3>
      <p className="mt-1 text-xs text-fg-muted">AI-assisted preliminary check — not legal advice</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {review.complianceItems.map((item) => (
          <li key={item.id} className={cn('rounded-md border px-3 py-2 text-sm', COMPLIANCE_COLORS[item.status])}>
            <div className="font-medium">{item.label}</div>
            <div className="text-2xs capitalize">{item.status.replace('_', ' ')}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
