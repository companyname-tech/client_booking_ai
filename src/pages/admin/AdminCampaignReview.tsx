import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { motion } from 'motion/react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { tweenBase } from '@/lib/motion'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { CopyableName } from '@/components/ui/CopyableName'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CampaignStatus } from '@/components/campaigns/CampaignStatus'
import { ApprovalPanel } from '@/components/admin/ApprovalPanel'
import { REVIEW_SECTIONS, ReviewSectionContent, type ReviewSection } from '@/components/admin/ReviewSections'
import {
  AgentSelectEditor,
  BookingEditor,
  BudgetEditor,
  OfferDetailsEditor,
  TargetingEditor,
  type BookingDraft,
  type BudgetDraft,
  type OfferDetailsDraft,
} from '@/components/admin/CampaignSectionEditors'
import { ApproveCampaignModal, RejectCampaignModal, RequestChangesModal } from '@/components/admin/CampaignReviewModals'
import type { OfferCampaign } from '@/types'
import type { ReviewCampaignContent } from '@/types/admin'
import type { LeadCriteria } from '@/types'
import { cn } from '@/lib/utils'

/** Review sections whose content the admin can change inline before approving. */
const EDITABLE_SECTIONS: ReadonlySet<ReviewSection> = new Set(['offer', 'target', 'budget', 'booking', 'ai'])

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export default function AdminCampaignReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [section, setSection] = useState<ReviewSection>('overview')
  const [modal, setModal] = useState<'approve' | 'reject' | 'changes' | null>(null)
  const [editing, setEditing] = useState<ReviewSection | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const { data, loading, error, reload } = useAsyncData(async () => {
    if (!id) return undefined
    const [campaign, review, agents] = await Promise.all([repo.getCampaign(id), repo.getCampaignReview(id), repo.getAgents()])
    return { campaign, review, agents }
  }, [id])

  const campaign = data?.campaign
  const review = data?.review
  const agents = data?.agents ?? []

  const { data: clientData } = useAsyncData(
    () => (campaign && campaign.clientId ? repo.getClient(campaign.clientId) : Promise.resolve(undefined)),
    [campaign?.clientId],
  )
  const client = clientData?.client

  if (loading) {
    return (
      <PageTransition>
        <PageContainer><LoadingState rows={6} /></PageContainer>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <PageContainer><ErrorState message={error} onRetry={reload} /></PageContainer>
      </PageTransition>
    )
  }

  if (!campaign || !review) {
    return (
      <PageTransition>
        <PageContainer>
          <EmptyState title="OfferCampaign not found" action={<Button onClick={() => navigate('/admin/approvals')}>Back to queue</Button>} />
        </PageContainer>
      </PageTransition>
    )
  }

  const agent = campaign.agentId ? agents.find((a) => a.id === campaign.agentId) : undefined
  // Last persisted admin-editable content — every section save merges into it so
  // partial edits never wipe content saved on other sections.
  const stored: ReviewCampaignContent = review.campaignContent ?? {}

  const toastError = (e: unknown) => setToast(`Save failed — ${errorMessage(e)}`)

  /** Run a save handler, then reload so the review + header reflect the edit. */
  const persist = async (action: () => Promise<OfferCampaign>) => {
    setSaving(true)
    try {
      await action()
      setEditing(null)
      setToast('Changes saved')
      void reload()
    } catch (e) {
      toastError(e)
    } finally {
      setSaving(false)
    }
  }

  const openEditor = (s: ReviewSection) => {
    setEditing(s)
    setSection(s)
  }

  const renderEditor = (s: ReviewSection) => {
    if (s === 'offer') {
      const seed: OfferDetailsDraft = {
        title: campaign.offerName,
        description: review.offerAnalysis.clarity,
        pitch: review.offerAnalysis.valueProposition,
        cta: review.offerAnalysis.cta,
      }
      return (
        <OfferDetailsEditor
          seed={seed}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={(draft) =>
            persist(() =>
              repo.updateCampaignOffer(campaign.id, {
                title: draft.title,
                description: draft.description,
                pitch: draft.pitch,
                cta: draft.cta,
              }),
            )
          }
        />
      )
    }
    if (s === 'target') {
      const seed: Partial<LeadCriteria> = stored.targeting ?? campaign.criteria
      return (
        <TargetingEditor
          seed={seed}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={(draft) => persist(() => repo.updateCampaignOffer(campaign.id, { content: { ...stored, targeting: draft } }))}
        />
      )
    }
    if (s === 'budget') {
      const seed: BudgetDraft = {
        total: campaign.budget.total,
        daily: campaign.budget.daily,
        expectedDurationDays: campaign.budget.expectedDurationDays,
        warningThresholds: campaign.budget.warningThresholds,
      }
      return (
        <BudgetEditor
          seed={seed}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={(draft) =>
            persist(() =>
              repo.updateCampaignOffer(campaign.id, { content: { ...stored, budget: { ...draft, currency: 'USD' } } }),
            )
          }
        />
      )
    }
    if (s === 'booking') {
      const seed: BookingDraft = {
        titleTemplate: stored.booking?.titleTemplate ?? review.bookingTitle ?? '',
        email: stored.booking?.email ?? review.bookingEmail ?? '',
      }
      return (
        <BookingEditor
          seed={seed}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={(draft) => persist(() => repo.updateCampaignOffer(campaign.id, { content: { ...stored, booking: draft } }))}
        />
      )
    }
    if (s === 'ai') {
      return (
        <AgentSelectEditor
          agents={agents}
          seedAgentId={campaign.agentId}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={(agentId) => persist(() => repo.updateCampaignOffer(campaign.id, { agentId }))}
        />
      )
    }
    return null
  }

  const handleApprove = async () => {
    await repo.approveCampaign(campaign.id)
    reload()
    setToast('OfferCampaign approved and entering launch queue')
    window.setTimeout(() => navigate(`/admin/campaigns/${campaign.id}`), 2000)
  }

  const sectionMeta = (s: ReviewSection) => REVIEW_SECTIONS.find((x) => x.id === s)
  const editingLabel = editing ? sectionMeta(editing)?.label : undefined

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
            <CopyableName
              name={campaign.name}
              id={campaign.id}
              className="mt-5 text-2xl font-semibold text-fg"
              onCopied={setToast}
            />
            <p className="mt-1 text-sm text-fg-muted">{client?.name} · {review.displayId}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CampaignStatus status={campaign.status} />
              <span className="text-xs text-fg-muted">
                Submitted {new Date(review.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button variant="ghost" disabled={editing !== null} onClick={() => setModal('changes')}>Request Changes</Button>
            <Button variant="secondary" disabled={editing !== null} onClick={() => setModal('reject')}>Reject</Button>
            <Button variant="primary" disabled={editing !== null} onClick={() => setModal('approve')}>Approve</Button>
          </div>
        </div>

        {editing && (
          <div className="rounded-md border border-warning/25 bg-warning-soft/10 px-3 py-2 text-xs text-fg-secondary">
            Editing {editingLabel} — save or discard your changes before approving the campaign.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)_280px]">
          <nav className="space-y-0.5">
            {REVIEW_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setEditing(null)
                  setSection(s.id)
                }}
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
            {/* Keyed on the section so switching re-runs the fade-in; edit toggles
                stay inside the same keyed node (no exit-animation dependency). */}
            <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: tweenBase }}>
              <div className="surface min-h-[320px] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-fg">{sectionMeta(section)?.label}</h2>
                  {editing === null && EDITABLE_SECTIONS.has(section) && (
                    <Button variant="ghost" size="sm" leadingIcon={<Pencil className="size-3.5" />} onClick={() => openEditor(section)}>
                      Edit
                    </Button>
                  )}
                </div>
                {editing === section ? (
                  renderEditor(section)
                ) : (
                  <ReviewSectionContent
                    section={section}
                    campaign={campaign}
                    review={review}
                    agent={agent}
                    onUploadCampaignVideo={
                      section === 'video'
                        ? async (file, meta) => {
                            setSaving(true)
                            try {
                              await repo.uploadCampaignVideo(campaign.id, file, meta)
                              setToast('Video uploaded')
                              void reload()
                            } catch (e) {
                              toastError(e)
                              throw e
                            } finally {
                              setSaving(false)
                            }
                          }
                        : undefined
                    }
                    onRemoveCampaignVideo={
                      section === 'video'
                        ? async () => {
                            setSaving(true)
                            try {
                              await repo.deleteCampaignVideo(campaign.id)
                              setToast('Video removed')
                              void reload()
                            } catch (e) {
                              toastError(e)
                              throw e
                            } finally {
                              setSaving(false)
                            }
                          }
                        : undefined
                    }
                    videoUploading={saving}
                  />
                )}
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:block">
            {editing === null ? (
              <ApprovalPanel
                review={review}
                sticky
                onApprove={() => setModal('approve')}
                onReject={() => setModal('reject')}
                onRequestChanges={() => setModal('changes')}
              />
            ) : (
              <aside className="surface flex flex-col gap-3 p-5 lg:sticky lg:top-24 lg:self-start">
                <div className="label-caps">Editing {editingLabel}</div>
                <p className="text-xs text-fg-muted">Save or discard your changes before approving the campaign.</p>
                <div className="flex flex-col gap-2 border-t border-line pt-4">
                  <Button variant="secondary" onClick={() => setEditing(null)}>Discard edits</Button>
                </div>
              </aside>
            )}
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-bg/95 p-3 backdrop-blur-sm lg:hidden">
          <Button variant="ghost" className="flex-1" disabled={editing !== null} onClick={() => setModal('changes')}>Changes</Button>
          <Button variant="secondary" className="flex-1" disabled={editing !== null} onClick={() => setModal('reject')}>Reject</Button>
          <Button variant="primary" className="flex-1" disabled={editing !== null} onClick={() => setModal('approve')}>Approve</Button>
        </div>

        <ApproveCampaignModal
          open={modal === 'approve'}
          onClose={() => setModal(null)}
          onSubmit={handleApprove}
          campaignName={campaign.name}
          checks={['Targeting', 'Offer', 'Integrations', 'Compliance']}
          complianceWarning={review.complianceItems.some((c) => c.status === 'needs_review' || c.status === 'warning')}
        />
        <RejectCampaignModal
          open={modal === 'reject'}
          onClose={() => setModal(null)}
          onSubmit={async (reason, detail) => {
            await repo.rejectCampaign(campaign.id, `${reason}: ${detail}`)
            reload()
            setToast('OfferCampaign rejected')
          }}
        />
        <RequestChangesModal
          open={modal === 'changes'}
          onClose={() => setModal(null)}
          clientName={client?.name ?? 'Client'}
          onSubmit={async (_, message) => {
            await repo.requestCampaignChanges(campaign.id, message)
            reload()
            setToast(`Changes requested from ${client?.name}`)
          }}
        />
      </PageContainer>
    </PageTransition>
  )
}
