import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import type { CampaignStatus, OfferCampaign } from '@/types'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { canUse } from '@/lib/permissions'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { PageContainer, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CampaignHeader } from '@/components/campaign/CampaignHeader'
import { CopyableName } from '@/components/ui/CopyableName'
import { CampaignAgentAssign } from '@/components/campaign/CampaignAgentAssign'
import { hasRunnableBudget, isBudgetStopped, isTrainingCampaign, resolveCampaignDisplayStatus } from '@/lib/campaignOperationalStatus'
import { mergeCampaignWithMeta } from '@/lib/campaignAdminMeta'

interface Tab {
  to: string
  label: string
  end?: boolean
  /** Console family required to see/open the tab (catalog-mapped tabs only). */
  perm?: string
}

const clientTabs: Tab[] = [
  { to: '', label: 'Overview', end: true },
  { to: 'leads', label: 'Leads', perm: 'leads.view' },
  { to: 'calls', label: 'Calls & Recordings', perm: 'calls.view' },
  { to: 'activity', label: 'Activity', perm: 'activity.view' },
  { to: 'analytics', label: 'Analytics' },
  { to: 'integrations', label: 'Integrations' },
  { to: 'settings', label: 'Settings' },
]

export default function CampaignDetailLayout({ zone = 'client' }: { zone?: 'client' | 'admin' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [statusOverride, setStatusOverride] = useState<CampaignStatus | null>(null)
  const [campaignOverride, setCampaignOverride] = useState<OfferCampaign | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [copyNotice, setCopyNotice] = useState('')
  const [pauseBusy, setPauseBusy] = useState(false)
  const [pauseError, setPauseError] = useState('')

  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        id ? repo.getCampaign(id) : Promise.resolve(undefined),
        repo.getCurrentClient(),
        repo.getAgents(),
        zone === 'admin' && id ? repo.getAdminMeta(id).catch(() => undefined) : Promise.resolve(undefined),
      ]),
    [id, zone],
  )
  const rawCampaign = campaignOverride ?? data?.[0]
  const adminMeta = data?.[3]
  const campaign =
    rawCampaign && adminMeta ? mergeCampaignWithMeta(rawCampaign, adminMeta) : rawCampaign
  const client = data?.[1]
  const agents = data?.[2] ?? []

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

  const effectiveStatus = resolveCampaignDisplayStatus(campaign, statusOverride)
  const assignedAgent = campaign.agentId ? agents.find((a) => a.id === campaign.agentId) : undefined
  const budgetStopped = isBudgetStopped(campaign)
  const canAssignAgent = zone === 'admin' && canUse(session, 'campaigns.edit')
  const persistPause = async (paused: boolean) => {
    setPauseBusy(true)
    setPauseError('')
    try {
      await repo.setCampaignPaused(campaign.id, paused)
      // Mirror the persisted value onto the local campaign so the UI reflects
      // it immediately (the stored flag also survives refresh via toCampaign).
      const current = campaignOverride ?? data?.[0] ?? campaign
      setCampaignOverride({ ...current, userPaused: paused })
      setStatusOverride(paused ? 'paused' : 'active')
    } catch (e) {
      setPauseError(e instanceof Error ? e.message : `Failed to ${paused ? 'pause' : 'resume'} campaign`)
    } finally {
      setPauseBusy(false)
    }
  }
  const pauseCampaign = () => {
    if (pauseBusy) return
    void persistPause(true)
  }
  const resumeCampaign = () => {
    // Budget stop rule: no runnable budget (non-training) means it stays paused.
    if (!isTrainingCampaign(campaign) && !hasRunnableBudget(campaign.budget)) return
    if (pauseBusy) return
    void persistPause(false)
  }

  const updateCampaignBudget = (budget: OfferCampaign['budget']) => {
    const base = campaignOverride ?? data?.[0]
    if (!base) return
    setCampaignOverride({ ...base, budget })
    if (hasRunnableBudget(budget)) {
      setStatusOverride('active')
    }
  }

  const refreshCampaign = async () => {
    if (!id) return
    setStatusOverride(null)
    const [fresh, , , meta] = await Promise.all([
      repo.getCampaign(id),
      repo.getCurrentClient(),
      repo.getAgents(),
      zone === 'admin' ? repo.getAdminMeta(id).catch(() => undefined) : Promise.resolve(undefined),
    ])
    if (fresh) {
      setCampaignOverride(meta ? mergeCampaignWithMeta(fresh, meta) : fresh)
    }
    reload({ silent: true })
  }

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
  // Catalog-mapped tabs (leads/calls/activity) hide for restricted sessions
  // that lack the family grant; workspace-internal tabs stay for everyone.
  const visibleTabs = clientTabs.filter((t) => canUse(session, t.perm))

  return (
    <PageTransition className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <PageContainer className="flex min-h-0 flex-1 flex-col pb-0">
        <Reveal initial="hidden" animate="show" className="shrink-0 space-y-5 pb-6">
          <div className="min-w-0">
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
              <h1 className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                <CopyableName
                  name={campaign.name}
                  id={campaign.id}
                  className="text-2xl font-semibold sm:text-3xl"
                  onCopied={setCopyNotice}
                />
                <span className="font-normal text-fg-muted" aria-hidden>·</span>
                {assignedAgent ? (
                  <span className="text-lg font-medium text-fg-secondary">{assignedAgent.name}</span>
                ) : canAssignAgent ? (
                  <button
                    type="button"
                    onClick={() => setAssignOpen(true)}
                    className="interactive text-lg font-medium text-accent hover:underline"
                  >
                    Assigned agent
                  </button>
                ) : (
                  <span className="text-lg font-medium text-fg-muted">Assigned agent</span>
                )}
              </h1>
              {copyNotice && (
                <p aria-live="polite" className="mt-1 text-xs text-fg-secondary">{copyNotice}</p>
              )}
              <div className="mt-3">
                <CampaignHeader
                  campaign={campaign}
                  effectiveStatus={effectiveStatus}
                  budgetStopped={budgetStopped}
                  onPause={pauseCampaign}
                  onResume={resumeCampaign}
                  onDelete={() => setConfirmDelete(true)}
                  zone={zone}
                />
                {pauseError && (
                  <p role="alert" aria-live="polite" className="mt-1.5 text-xs text-danger">
                    {pauseError}
                  </p>
                )}
              </div>
          </div>
          <CampaignAgentAssign
            campaign={campaign}
            agents={agents}
            open={assignOpen}
            onOpenChange={setAssignOpen}
            onAssigned={(next) => {
              setCampaignOverride(next)
              void reload()
            }}
          />

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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8">
          <Outlet context={{ campaign, zone, effectiveStatus, pauseCampaign, resumeCampaign, refreshCampaign, updateCampaignBudget }} />
        </div>
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
