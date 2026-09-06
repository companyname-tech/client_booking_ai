import type { ReactNode } from 'react'
import { Construction } from 'lucide-react'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { repo } from '@/data/repository'

export interface PlaceholderPageProps {
  title: string
  description?: string
  zone?: 'client' | 'admin'
  icon?: ReactNode
  /** Short note about what will live here. */
  plan?: string
  actions?: ReactNode
}

/**
 * Consistent scaffold for routes that exist in the architecture but are
 * not yet designed. Keeps navigation, breadcrumbs and transitions real.
 */
export default function PlaceholderPage({ title, description, zone = 'client', icon, plan, actions }: PlaceholderPageProps) {
  const client = repo.getCurrentClient()
  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={
            zone === 'admin' ? (
              <WorkspaceEyebrow name="Super Admin" context="Internal console" />
            ) : (
              <WorkspaceEyebrow name={client.name} context="Client Workspace" />
            )
          }
          title={title}
          description={description}
          actions={actions}
        />
        <div className="surface">
          <EmptyState
            icon={icon ?? <Construction />}
            title={`${title} is coming in a later phase`}
            description={plan ?? 'This route is part of the application architecture and will be designed next.'}
          />
        </div>
      </PageContainer>
    </PageTransition>
  )
}
