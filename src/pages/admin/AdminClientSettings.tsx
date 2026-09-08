import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Settings } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ClientSettingsPanel } from '@/components/admin/ClientSettingsPanel'
import type { Client } from '@/types'

export default function AdminClientSettings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const { data, loading, error, reload } = useAsyncData(
    async () => (isNew || !id ? undefined : repo.getClient(id)),
    [id, isNew],
  )

  const client = data?.client

  const onSaved = (saved: Client) => {
    if (isNew) {
      navigate(`/admin/clients/${saved.id}/settings`, { replace: true })
      return
    }
    void reload()
  }

  if (!isNew && loading) {
    return (
      <PageTransition>
        <PageContainer><LoadingState rows={8} /></PageContainer>
      </PageTransition>
    )
  }

  if (!isNew && error) {
    return (
      <PageTransition>
        <PageContainer><ErrorState message={error} onRetry={reload} /></PageContainer>
      </PageTransition>
    )
  }

  if (!isNew && !client) {
    return (
      <PageTransition>
        <PageContainer><ErrorState message="Client not found" onRetry={() => navigate('/admin/clients')} /></PageContainer>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6 pb-10">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Client settings" />}
          title={
            <span className="inline-flex items-center gap-2">
              <Settings className="size-6 text-fg-muted" />
              {isNew ? 'New client' : `${client!.name} settings`}
            </span>
          }
          description={
            isNew
              ? 'Create a client workspace, set budget, and configure busy days on the calendar.'
              : 'Workspace, contact, busy-day calendar, and wallet settings for this client.'
          }
          actions={
            <Link to={isNew ? '/admin/clients' : `/admin/clients/${client!.id}`}>
              <Button variant="secondary" size="sm" leadingIcon={<ArrowLeft className="size-3.5" />}>
                {isNew ? 'Back to clients' : 'Back to client'}
              </Button>
            </Link>
          }
        />
        <ClientSettingsPanel client={isNew ? null : client} onSaved={onSaved} />
      </PageContainer>
    </PageTransition>
  )
}
