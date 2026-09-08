import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { OfferCampaign } from '@/types'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useAuth } from '@/contexts/AuthContext'
import { canUse, isSuperAdmin } from '@/lib/permissions'
import { canReviewCampaign } from '@/lib/campaignAdminMeta'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  ApproveCampaignModal,
  RejectCampaignModal,
  RequestChangesModal,
} from '@/components/admin/CampaignReviewModals'

type ModalKind = 'approve' | 'reject' | 'changes'

export function CampaignApprovalActions({
  campaign,
  zone,
  onUpdated,
  embedded = false,
}: {
  campaign: OfferCampaign
  zone: 'client' | 'admin'
  onUpdated: () => void | Promise<void>
  /** When true, renders compact actions for the awaiting-approval banner (no outer card). */
  embedded?: boolean
}) {
  const { session } = useAuth()
  const canApprove =
    zone === 'admin' &&
    (isSuperAdmin(session) ||
      canUse(session, 'campaigns.approve') ||
      canUse(session, 'campaigns.edit'))
  const [modal, setModal] = useState<ModalKind | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const { data } = useAsyncData(async () => {
    if (!canApprove) return undefined
    const [meta, review, clientPage] = await Promise.all([
      repo.getAdminMeta(campaign.id),
      repo.getCampaignReview(campaign.id).catch(() => undefined),
      campaign.clientId ? repo.getClient(campaign.clientId).catch(() => undefined) : Promise.resolve(undefined),
    ])
    return { meta, review, clientName: clientPage?.client?.name ?? 'Client' }
  }, [canApprove, campaign.id, campaign.clientId])

  if (!canApprove || !data || !canReviewCampaign(data.meta)) return null

  const review = data.review
  const complianceWarning = Boolean(
    review?.complianceItems.some((c) => c.status === 'needs_review' || c.status === 'warning'),
  )

  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true)
    setNotice('')
    try {
      await action()
      await onUpdated()
      setNotice(message)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {embedded ? (
        <div className="mt-5 border-t border-warning/20 pt-4">
          <p className="text-sm font-medium text-fg">Review decision</p>
          <p className="mt-1 text-sm text-fg-secondary">
            Approve this campaign for launch, request changes from the client, or reject it.
          </p>
          {notice && (
            <p className="mt-2 text-sm text-fg-secondary" role="status">{notice}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setModal('changes')}>
              Request changes
            </Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setModal('reject')}>
              Deny
            </Button>
            <Button variant="primary" size="sm" disabled={busy} onClick={() => setModal('approve')}>
              Approve
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-accent/20 bg-accent-soft/5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-fg">Campaign approval</h2>
              <p className="mt-1 max-w-xl text-sm text-fg-secondary">
                Review this campaign and approve it for launch, request changes from the client, or reject it.
              </p>
              {notice && (
                <p className="mt-2 text-sm text-fg-secondary" role="status">{notice}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" disabled={busy} onClick={() => setModal('changes')}>
                Request changes
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setModal('reject')}>
                Deny
              </Button>
              <Button variant="primary" disabled={busy} onClick={() => setModal('approve')}>
                Approve campaign
              </Button>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <Link
              to={`/admin/campaigns/${campaign.id}/review`}
              className="interactive inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Open full review
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>
      )}

      <ApproveCampaignModal
        open={modal === 'approve'}
        onClose={() => setModal(null)}
        onSubmit={() => run(() => repo.approveCampaign(campaign.id), 'Campaign approved and entering launch queue')}
        campaignName={campaign.name}
        checks={['Targeting', 'Offer', 'Integrations', 'Compliance']}
        complianceWarning={complianceWarning}
      />
      <RejectCampaignModal
        open={modal === 'reject'}
        onClose={() => setModal(null)}
        onSubmit={(reason, detail) =>
          run(() => repo.rejectCampaign(campaign.id, `${reason}: ${detail}`), 'Campaign rejected')
        }
      />
      <RequestChangesModal
        open={modal === 'changes'}
        onClose={() => setModal(null)}
        clientName={data.clientName}
        onSubmit={(_, message) =>
          run(() => repo.requestCampaignChanges(campaign.id, message), `Changes requested from ${data.clientName}`)
        }
      />
    </>
  )
}
