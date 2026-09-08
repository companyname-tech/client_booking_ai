import { useCallback, useEffect, useState } from 'react'
import { History, Loader2, Play, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { repo } from '@/api/repository'
import type { TrainingProcessOperation } from '@/types/training'

export function TrainingProcessOperationsPanel({
  campaignId,
  onChanged,
}: {
  campaignId: string
  onChanged?: () => void
}) {
  const [operations, setOperations] = useState<TrainingProcessOperation[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!campaignId) {
      setOperations([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const listed = await repo.listTrainingProcessOperations(campaignId)
      setOperations(listed.operations)
      setDrafts(
        Object.fromEntries(listed.operations.map((row) => [row.operationId, row.modelComment])),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setOperations([])
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    void load()
  }, [load])

  const saveComment = async (row: TrainingProcessOperation) => {
    const comment = (drafts[row.operationId] ?? '').trim()
    setBusyId(row.operationId)
    setError('')
    try {
      const updated = await repo.updateTrainingProcessOperationComment(
        campaignId,
        row.operationId,
        comment,
      )
      setOperations((prev) =>
        prev.map((item) => (item.operationId === row.operationId ? updated : item)),
      )
      setNotice(
        comment
          ? 'Comment saved — it trains the next talk. Publish the memory to pin it.'
          : 'Comment cleared.',
      )
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  const replay = async (row: TrainingProcessOperation) => {
    setBusyId(row.operationId)
    setError('')
    try {
      await repo.runTrainingProcessOperation(campaignId, row.operationId)
      setNotice(`Replayed ${row.method}.`)
      await load()
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  const remove = async (row: TrainingProcessOperation) => {
    setBusyId(row.operationId)
    setError('')
    try {
      await repo.deleteTrainingProcessOperation(campaignId, row.operationId)
      setOperations((prev) => prev.filter((item) => item.operationId !== row.operationId))
      setNotice('Operation removed from the journal.')
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  if (!campaignId) return null

  return (
    <div className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <History className="size-4 text-accent" />
            Process operations
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-fg-muted">
            Logged GET/DELETE of the saved conversation process. A comment on a row trains the next
            talk the same way a timestamp comment does.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh operations"
          onClick={() => void load()}
          leadingIcon={
            loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />
          }
        />
      </div>

      {error ? <p className="mt-3 text-xs text-danger" role="alert">{error}</p> : null}
      {notice ? <p className="mt-3 text-xs text-fg-secondary">{notice}</p> : null}

      {loading ? (
        <p className="mt-4 text-sm text-fg-muted">Loading operations…</p>
      ) : operations.length === 0 ? (
        <p className="mt-4 text-sm text-fg-faint">
          No process operations yet. Saving or loading the conversation process logs a row here.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {operations.map((row) => (
            <li key={row.operationId} className="rounded-md border border-line bg-surface-1 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-fg">
                  <span className="font-semibold">{row.method}</span>{' '}
                  <span className="text-fg-muted">{row.status}</span>
                  <span className="ml-2 font-mono text-2xs text-fg-faint">{row.operationId}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === row.operationId}
                    leadingIcon={<Play className="size-3.5" />}
                    onClick={() => void replay(row)}
                  >
                    Replay
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === row.operationId}
                    leadingIcon={<Trash2 className="size-3.5 text-danger" />}
                    onClick={() => void remove(row)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              {row.responsePreview ? (
                <p className="mt-1 truncate text-2xs text-fg-faint">{row.responsePreview}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="min-w-[12rem] flex-1">
                  <span className="mb-1 block text-2xs font-medium text-fg-secondary">
                    Comment — trains the next talk
                  </span>
                  <Input
                    value={drafts[row.operationId] ?? ''}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [row.operationId]: e.target.value }))
                    }
                    placeholder="What should the agent do?"
                    className="h-7 text-xs"
                  />
                </label>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={
                    busyId === row.operationId
                    || (drafts[row.operationId] ?? '') === (row.modelComment ?? '')
                  }
                  onClick={() => void saveComment(row)}
                >
                  {busyId === row.operationId ? 'Saving…' : 'Save comment'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
