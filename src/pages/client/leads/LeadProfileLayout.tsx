import { NavLink, Outlet, useOutletContext, useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { repo } from '@/data/repository'
import type { LeadIntelligenceProfile } from '@/types/leadIntelligence'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { motion } from 'motion/react'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { LeadProfileHeader } from '@/components/leads/profile/LeadProfileSections'

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'activity', label: 'Activity' },
  { to: 'conversations', label: 'Conversations' },
  { to: 'calls', label: 'Calls' },
  { to: 'notes', label: 'Notes' },
]

export function useLeadProfile() {
  return useOutletContext<{ profile: LeadIntelligenceProfile }>()
}

export default function LeadProfileLayout() {
  const { id } = useParams()
  const { data: profile, loading, error, reload } = useAsyncData(
    () => (id ? repo.getLeadIntelligence(id) : Promise.resolve<LeadIntelligenceProfile | undefined>(undefined)),
    [id],
  )

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

  if (!profile) {
    return (
      <PageTransition>
        <PageContainer>
          <EmptyState title="Lead not found" action={<Link to="/client/leads"><Button>Back to leads</Button></Link>} />
        </PageContainer>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6 pb-8">
        <Link to="/client/leads" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
          <ArrowLeft className="size-3.5" /> Lead Intelligence
        </Link>
        <LeadProfileHeader profile={profile} />
        <nav className="flex max-w-full gap-1 overflow-x-auto scrollbar-none hairline-b" aria-label="Lead sections">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => cn('interactive relative shrink-0 px-2.5 py-2 text-sm font-medium', isActive ? 'text-fg' : 'text-fg-muted hover:text-fg-secondary')}
            >
              {({ isActive }) => (
                <>
                  {tab.label}
                  {isActive && <motion.span layoutId="lead-tab" transition={spring} className="absolute inset-x-2 bottom-0 h-px bg-fg" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <Outlet context={{ profile }} />
      </PageContainer>
    </PageTransition>
  )
}
