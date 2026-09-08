import { useState } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ActivityFilters, useActivityFilters } from '@/components/admin/ActivityFilters'
import { ActivityTimeline } from '@/components/admin/ActivityTimeline'
import { ActivityDetailDrawer } from '@/components/admin/ActivityDetailDrawer'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import type { ActivityLogEntry } from '@/types/admin'

export default function AdminActivity() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getActivityLog({ limit: 200 }))
  const entries = data ?? []
  const { filters, setFilters, filtered } = useActivityFilters(entries)
  const selection = useBulkSelection(filtered.map((e) => e.id))
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkNotice, setBulkNotice] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<ActivityLogEntry | null>(null)

  const runBulkDelete = async () => {
    const ids = filtered.filter((e) => selection.selected.has(e.id)).map((e) => e.id)
    if (ids.length === 0) return
    setBulkBusy(true)
    setBulkNotice('')
    try {
      const res = await repo.bulkDeleteActivity(ids)
      setBulkNotice(
        res.failed
          ? `Deleted ${res.affected}, ${res.failed} failed`
          : `Deleted ${res.affected} event${res.affected === 1 ? '' : 's'}`,
      )
      selection.clear()
      setConfirmBulk(false)
      void reload()
    } catch (e) {
      setBulkNotice(`Bulk delete failed: ${e instanceof Error ? e.message : String(e)}`)
      setConfirmBulk(false)
    } finally {
      setBulkBusy(false)
    }
  }

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
            <BulkActionBar
              count={selection.count}
              noun="events"
              onClear={selection.clear}
              onDelete={() => setConfirmBulk(true)}
              busy={bulkBusy}
            />
            {bulkNotice && <p aria-live="polite" className="text-xs text-fg-secondary">{bulkNotice}</p>}
            {filtered.length === 0 ? (
              <EmptyState title="No matching events" description="Try a different search or stream filter." />
            ) : (
              <div className="surface p-4">
                <ActivityTimeline entries={filtered} selection={selection} onSelect={setSelectedEntry} />
              </div>
            )}
          </>
        )}
      </PageContainer>
      <ActivityDetailDrawer
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        campaignHref={(entry) =>
          entry.offerId ? `/admin/campaigns/${entry.offerId}/activity` : undefined
        }
      />
      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        title={`Delete ${selection.count} selected event${selection.count === 1 ? '' : 's'}?`}
        body={`This permanently removes ${selection.count} event${selection.count === 1 ? '' : 's'} from the activity trail. This cannot be undone.`}
        busy={bulkBusy}
        onConfirm={runBulkDelete}
      />
    </PageTransition>
  )
}
