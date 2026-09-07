import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ActivityFilters, useActivityFilters } from '@/components/admin/ActivityFilters'
import { ActivityTimeline } from '@/components/admin/ActivityTimeline'

export default function AdminActivity() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getActivityLog({ limit: 200 }))
  const entries = data ?? []
  const { filters, setFilters, filtered } = useActivityFilters(entries)

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Activity" />}
          title="Activity"
          description="Platform-wide audit trail and system events."
        />

        {loading ? (
          <LoadingState rows={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : entries.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Audit and system events will appear here as the platform runs."
          />
        ) : (
          <>
            <ActivityFilters value={filters} onChange={setFilters} total={filtered.length} />
            {filtered.length === 0 ? (
              <EmptyState title="No matching events" description="Try a different search or stream filter." />
            ) : (
              <div className="surface p-4">
                <ActivityTimeline entries={filtered} />
              </div>
            )}
          </>
        )}
      </PageContainer>
    </PageTransition>
  )
}
