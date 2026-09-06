import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { repo } from '@/data/repository'
import { tweenBase } from '@/lib/motion'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CampaignStatus } from '@/components/campaigns/CampaignStatus'
import { ApprovalPanel } from '@/components/admin/ApprovalPanel'
import { REVIEW_SECTIONS, ReviewSectionContent, type ReviewSection } from '@/components/admin/ReviewSections'
import { ApproveCampaignModal, RejectCampaignModal, RequestChangesModal } from '@/components/admin/CampaignReviewModals'
import { AITrainingPanel, AISimulation } from '@/components/admin/AITrainingPanel'
import { cn } from '@/lib/utils'

export default function AdminCampaignReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [, setTick] = useState(0)
  const refresh = () => setTick((t) => t + 1)

  const campaign = id ? repo.getCampaign(id) : undefined
  const review = id ? repo.getCampaignReview(id) : undefined
  const client = campaign ? repo.getClient(campaign.clientId) : undefined
  const [section, setSection] = useState<ReviewSection>('overview')
  const [modal, setModal] = useState<'approve' | 'reject' | 'changes' | null>(null)
  const [toast, setToast] = useState('')

  if (!campaign || !review) {
    return (
      <PageTransition>
        <PageContainer>
          <EmptyState title="Campaign not found" action={<Button onClick={() => navigate('/admin/approvals')}>Back to queue</Button>} />
        </PageContainer>
      </PageTransition>
    )
  }

  const handleApprove = () => {
    repo.approveCampaign(campaign.id)
    refresh()
    setToast('Campaign approved and entering launch queue')
    window.setTimeout(() => navigate(`/admin/campaigns/${campaign.id}`), 2000)
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6 pb-24 lg:pb-0">
        {toast && (
          <div className="fixed right-4 top-20 z-50 rounded-md border border-line bg-surface-2 px-4 py-2 text-sm shadow-2" role="status">
            {toast}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link to="/admin/approvals" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
              <ArrowLeft className="size-3.5" /> Approvals
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-fg">{campaign.name}</h1>
            <p className="mt-1 text-sm text-fg-muted">{client?.name} · {review.displayId}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CampaignStatus status={campaign.status} />
              <span className="text-xs text-fg-muted">
                Submitted {new Date(review.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button variant="ghost" onClick={() => setModal('changes')}>Request Changes</Button>
            <Button variant="secondary" onClick={() => setModal('reject')}>Reject</Button>
            <Button variant="primary" onClick={() => setModal('approve')}>Approve</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_280px]">
          <nav className="space-y-0.5">
            {REVIEW_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={cn(
                  'interactive w-full rounded-md px-3 py-2 text-left text-sm',
                  section === s.id ? 'bg-white/[0.06] font-medium text-fg' : 'text-fg-muted hover:text-fg-secondary',
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: tweenBase }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                <div className="surface min-h-[320px] p-5 sm:p-6">
                  <h2 className="mb-4 text-lg font-semibold text-fg">{REVIEW_SECTIONS.find((s) => s.id === section)?.label}</h2>
                  <ReviewSectionContent section={section} campaign={campaign} review={review} />
                  {section === 'ai' && (
                    <div className="mt-6 space-y-4">
                      <AITrainingPanel onComplete={(score) => { repo.completeCampaignTraining(campaign.id, score); refresh() }} />
                      <AISimulation />
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden lg:block">
            <ApprovalPanel
              review={review}
              sticky
              onApprove={() => setModal('approve')}
              onReject={() => setModal('reject')}
              onRequestChanges={() => setModal('changes')}
            />
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-bg/95 p-3 backdrop-blur-sm lg:hidden">
          <Button variant="ghost" className="flex-1" onClick={() => setModal('changes')}>Changes</Button>
          <Button variant="secondary" className="flex-1" onClick={() => setModal('reject')}>Reject</Button>
          <Button variant="primary" className="flex-1" onClick={() => setModal('approve')}>Approve</Button>
        </div>

        <ApproveCampaignModal
          open={modal === 'approve'}
          onClose={() => setModal(null)}
          onSubmit={handleApprove}
          campaignName={campaign.name}
          checks={['Targeting', 'Offer', 'AI Training', 'Integrations', 'Compliance']}
          complianceWarning={review.complianceItems.some((c) => c.status === 'needs_review' || c.status === 'warning')}
        />
        <RejectCampaignModal
          open={modal === 'reject'}
          onClose={() => setModal(null)}
          onSubmit={(reason, detail) => {
            repo.rejectCampaign(campaign.id, `${reason}: ${detail}`)
            refresh()
            setToast('Campaign rejected')
          }}
        />
        <RequestChangesModal
          open={modal === 'changes'}
          onClose={() => setModal(null)}
          clientName={client?.name ?? 'Client'}
          onSubmit={(_, message) => {
            repo.requestCampaignChanges(campaign.id, message)
            refresh()
            setToast(`Changes requested from ${client?.name}`)
          }}
        />
      </PageContainer>
    </PageTransition>
  )
}
