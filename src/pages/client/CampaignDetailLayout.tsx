import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import type { CampaignStatus } from '@/types'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { PageContainer, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CampaignStatus as CampaignStatusBadge } from '@/components/campaigns/CampaignStatus'
import { CampaignHeader } from '@/components/campaign/CampaignHeader'

interface Tab {
  to: string
  label: string
  end?: boolean
}

const clientTabs: Tab[] = [
  { to: '', label: 'Overview', end: true },
  { to: 'leads', label: 'Leads' },
  { to: 'calls', label: 'Calls & Recordings' },
  { to: 'analytics', label: 'Analytics' },
  { to: 'integrations', label: 'Integrations' },
]

export default function CampaignDetailLayout({ zone = 'client' }: { zone?: 'client' | 'admin' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [statusOverride, setStatusOverride] = useState<CampaignStatus | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const { data, loading, error, reload } = useAsyncData(
    () => Promise.all([id ? repo.getCampaign(id) : Promise.resolve(undefined), repo.getCurrentClient()]),
    [id],
  )
  const campaign = data?.[0]
  const client = data?.[1]

  if (loading) {
    return (
      <PageTransition>
        <PageContainer>
          <LoadingState rows={6} />
        </PageContainer>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <PageContainer>
          <ErrorState message={error} onRetry={reload} />
        </PageContainer>
      </PageTransition>
    )
  }

  if (!campaign) {
    return (
      <PageTransition>
        <PageContainer>
          <div className="surface">
            <EmptyState
              title="Offer Campaign not found"
              description="It may have been removed, or the link is out of date."
              action={
                <Button variant="secondary" leadingIcon={<ArrowLeft />} onClick={() => history.back()}>
                  Go back
                </Button>
              }
            />
          </div>
        </PageContainer>
      </PageTransition>
    )
  }

  if (!client) return null

  const effectiveStatus = statusOverride ?? campaign.status
  const pauseCampaign = () => setStatusOverride('paused')
  const resumeCampaign = () => setStatusOverride('active')

  const runDelete = async () => {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await repo.bulkDeleteCampaigns([campaign.id])
      navigate(`/${zone}/campaigns`)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed')
      setDeleteBusy(false)
    }
  }

  // Both zones show the same data tabs — the lifecycle stage is conveyed by the
  // CampaignLifecycle progress in Overview, not by separate lifecycle tab pages.
  const visibleTabs = clientTabs

  return (
    <PageTransition>
      <PageContainer className="space-y-6 pb-8">
        <Reveal initial="hidden" animate="show" className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-3">
                <NavLink
                  to={`/${zone}/campaigns`}
                  className="interactive ring-focus inline-flex items-center gap-1 rounded-sm text-xs font-medium text-fg-muted outline-none hover:text-fg-secondary"
                >
                  <ArrowLeft className="size-3.5" /> Campaigns
                </NavLink>
                <span className="text-fg-faint">/</span>
                <WorkspaceEyebrow name={zone === 'admin' ? 'Super Admin' : client.name} context={zone === 'admin' ? 'Review' : 'Offer Campaign'} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{campaign.name}</h1>
              <div className="mt-3">
                <CampaignHeader
                  campaign={campaign}
                  effectiveStatus={effectiveStatus}
                  onPause={pauseCampaign}
                  onResume={resumeCampaign}
                  onDelete={() => setConfirmDelete(true)}
                  zone={zone}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 lg:pt-8">
              <CampaignStatusBadge status={effectiveStatus} size="md" />
            </div>
          </div>

          <nav aria-label="Offer Campaign sections" className="hairline-b -mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
            <div className="flex min-w-max items-center gap-0.5">
              {visibleTabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    cn(
                      'interactive ring-focus relative inline-flex h-9 shrink-0 items-center whitespace-nowrap px-3 text-sm font-medium outline-none',
                      isActive ? 'text-fg' : 'text-fg-muted hover:text-fg-secondary',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span layoutId="campaign-tab" transition={spring} aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
                      )}
                      {t.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>
        </Reveal>

        <Outlet context={{ campaign, zone, effectiveStatus, pauseCampaign, resumeCampaign }} />
      </PageContainer>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => !deleteBusy && setConfirmDelete(false)}
        title={`Delete ${campaign.name}?`}
        body={
          deleteError ||
          'This permanently deletes the campaign and its associated agents, leads and recordings. This cannot be undone.'
        }
        busy={deleteBusy}
        onConfirm={runDelete}
      />
    </PageTransition>
  )
}
