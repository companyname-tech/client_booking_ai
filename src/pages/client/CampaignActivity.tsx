import { useState } from 'react'
import { repo } from '@/api/repository'
import { useCampaignContext } from './campaignContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ActivityFilters, useActivityFilters } from '@/components/admin/ActivityFilters'
import { ActivityTimeline } from '@/components/admin/ActivityTimeline'
import { Reveal } from '@/components/motion/Reveal'

/**
 * Per-campaign Activity/Logs tab (mounted under BOTH /client/campaigns/:id and
 * /admin/campaigns/:id via campaignSubRoutes). Shows the campaign's OWN logs —
 * the platform /activity feed scoped server-side by ?offer_id=<campaign id>
 * (audit trail, AI cost operations and calls that reference this offer).
 * Entries are intentionally not deep-linked: every row already belongs to the
 * campaign whose logs this page shows.
 */
export default function CampaignActivity() {
  const { campaign } = useCampaignContext()
  const { data, loading, error, reload } = useAsyncData(
    () => repo.getActivityLog({ offerId: campaign.id, limit: 200 }),
    [campaign.id],
  )
  const entries = data ?? []
  const { filters, setFilters, filtered } = useActivityFilters(entries)
  const [limit, setLimit] = useState(100)

  if (loading) return <LoadingState rows={6} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const visible = filtered.slice(0, limit)

  return (
    <Reveal className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-fg">Activity log</h2>
        <p className="text-sm text-fg-muted">
          Everything logged for this campaign — audit trail, AI operations and calls — newest first.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="surface p-4">
          <EmptyState
            title="No activity yet"
            description="Audit, AI and call events for this campaign will appear here as it runs."
          />
        </div>
      ) : (
        <>
          <ActivityFilters value={filters} onChange={setFilters} total={filtered.length} />
          {filtered.length === 0 ? (
            <div className="surface p-4">
              <EmptyState title="No matching events" description="Try a different search or stream filter." />
            </div>
          ) : (
            <div className="surface p-4">
              <ActivityTimeline entries={visible} rowTo={() => undefined} />
              {filtered.length > visible.length && (
                <button
                  type="button"
                  onClick={() => setLimit((l) => l + 100)}
                  className="interactive mt-2 w-full rounded-md border border-line py-2 text-xs font-medium text-fg-muted hover:border-line-strong hover:text-fg-secondary"
                >
                  Show {Math.min(100, filtered.length - visible.length)} more
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Reveal>
  )
}
