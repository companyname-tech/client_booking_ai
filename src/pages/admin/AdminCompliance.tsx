import { repo } from '@/data/repository'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'

const COMPLIANCE_COLORS = {
  passed: 'text-success border-success/20 bg-success-soft/10',
  needs_review: 'text-warning border-warning/20 bg-warning-soft/10',
  warning: 'text-danger border-danger/20 bg-danger-soft/10',
  not_applicable: 'text-fg-muted border-line bg-surface-1',
}

export default function AdminCompliance() {
  const campaigns = repo.getCampaigns().filter((c) => ['legal_review', 'awaiting_approval', 'ai_training'].includes(c.status))

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Compliance" />}
          title="Compliance review"
          description="Internal review checklist. AI-assisted preliminary checks — human review required."
        />
        {campaigns.map((c) => {
          const review = repo.getCampaignReview(c.id)
          if (!review) return null
          return (
            <Reveal key={c.id}>
              <div className="surface p-5">
                <h3 className="font-semibold text-fg">{c.name}</h3>
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
            </Reveal>
          )
        })}
      </PageContainer>
    </PageTransition>
  )
}
