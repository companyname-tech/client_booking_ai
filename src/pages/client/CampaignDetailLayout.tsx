import { useState } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import type { CampaignStatus } from '@/types'
import { repo } from '@/data/repository'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { PageContainer, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
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
  { to: 'calls', label: 'Calls' },
  { to: 'recordings', label: 'Recordings' },
  { to: 'analytics', label: 'Analytics' },
  { to: 'integrations', label: 'Integrations' },
  { to: 'downloads', label: 'Downloads' },
]

export default function CampaignDetailLayout({ zone = 'client' }: { zone?: 'client' | 'admin' }) {
  const { id } = useParams()
  const campaign = id ? repo.getCampaign(id) : undefined
  const client = repo.getCurrentClient()
  const [statusOverride, setStatusOverride] = useState<CampaignStatus | null>(null)

  if (!campaign) {
    return (
      <PageTransition>
        <PageContainer>
          <div className="surface">
            <EmptyState
              title="Campaign not found"
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

  const effectiveStatus = statusOverride ?? campaign.status
  const pauseCampaign = () => setStatusOverride('paused')
  const resumeCampaign = () => setStatusOverride('active')

  const adminTabs: Tab[] =
    zone === 'admin'
      ? [
          { to: 'onboarding', label: 'Onboarding' },
          { to: 'ai-training', label: 'AI training' },
          { to: 'legal', label: 'Legal' },
          { to: 'approval', label: 'Approval' },
        ]
      : []
  const visibleTabs = zone === 'admin' ? [clientTabs[0], ...adminTabs, ...clientTabs.slice(1, 5)] : clientTabs

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
                <WorkspaceEyebrow name={zone === 'admin' ? 'Super Admin' : client.name} context={zone === 'admin' ? 'Review' : 'Campaign'} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{campaign.name}</h1>
              <div className="mt-3">
                <CampaignHeader
                  campaign={campaign}
                  effectiveStatus={effectiveStatus}
                  onPause={pauseCampaign}
                  onResume={resumeCampaign}
                  zone={zone}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 lg:pt-8">
              <CampaignStatusBadge status={effectiveStatus} size="md" />
            </div>
          </div>

          <nav aria-label="Campaign sections" className="hairline-b -mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
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
    </PageTransition>
  )
}
