import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CallHistoryList } from '@/components/recordings/CallHistoryList'

export default function AdminRecordings() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getCallHistory())

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Recordings" />}
          title="Recordings"
          description="Every recorded call with replayable audio."
        />

        {loading ? (
          <LoadingState rows={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <div className="surface p-5">
            <CallHistoryList recordings={data ?? []} />
          </div>
        )}
      </PageContainer>
    </PageTransition>
  )
}
