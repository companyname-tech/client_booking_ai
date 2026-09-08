import { useEffect, useState } from 'react'
import { GitBranch, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { repo } from '@/api/repository'
import type { BehaviorVersion } from '@/types/training'

export function BehaviorVersionPanel({
  campaignId,
  agentId,
  refreshToken = 0,
}: {
  campaignId: string
  agentId: string
  refreshToken?: number
}) {
  const [version, setVersion] = useState<BehaviorVersion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    if (!campaignId) {
      setVersion(null)
      setError('')
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    repo
      .getBehaviorVersion(campaignId, agentId)
      .then((row) => {
        if (!cancelled) setVersion(row)
      })
      .catch((e) => {
        if (!cancelled) {
          setVersion(null)
          setError(e instanceof Error ? e.message : String(e))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [campaignId, agentId, refreshToken, reloadTick])

  return (
    <div className="surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <GitBranch className="size-4 text-accent" />
            Live behavior version
          </h3>
          <p className="mt-1 text-xs text-fg-muted">
            Publishing a memory pins a new version. Live calls only retrieve memories on this pointer.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh behavior version"
          disabled={!campaignId || loading}
          onClick={() => setReloadTick((n) => n + 1)}
          leadingIcon={
            loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />
          }
        />
      </div>
      {!campaignId ? (
        <p className="mt-3 text-sm text-fg-faint">Pick a campaign to see what is live.</p>
      ) : error ? (
        <p className="mt-3 text-xs text-danger">{error}</p>
      ) : loading && !version ? (
        <p className="mt-3 text-sm text-fg-muted">Loading pinned version…</p>
      ) : (
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-fg-muted">Version</dt>
            <dd className="mt-0.5 font-mono text-fg">{version?.version?.slice(0, 12) || 'none yet'}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Production memories</dt>
            <dd className="mt-0.5 tabular text-fg">{version?.memory_ids?.length ?? 0}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Runtime policy</dt>
            <dd className="mt-0.5 tabular text-fg">v{version?.runtime_policy_version ?? 0}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
