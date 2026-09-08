import { useCallback, useEffect, useState } from 'react'
import { BrainCircuit, Check, Loader2, RefreshCw, Rocket, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { repo } from '@/api/repository'
import type { AgentMemoryRecord, MemoryStatus } from '@/types/training'

const STAGES: { value: MemoryStatus; label: string }[] = [
  { value: 'candidate', label: 'Candidates — waiting for review' },
  { value: 'validated', label: 'Validated — ready to publish' },
  { value: 'production', label: 'Production — live on calls' },
  { value: 'disabled', label: 'Disabled' },
]

const STAGE_HINT: Record<MemoryStatus, string> = {
  candidate:
    'Written by call evaluation. Validate, then Publish — that pins the extra rule on live calls. The conversation process you saved already trains the next talk.',
  validated: 'Approved but not live yet. Publish to pin it into the live prompt, or remove if you changed your mind.',
  production: 'These rules are in the live prompt on the next talk or call. Disabling unpins them and records a new version.',
  disabled: 'Removed or unpinned from live behavior. Kept for audit.',
}

/**
 * Agent memory review queue.
 *
 * A call evaluation can only ever write a candidate. Promotion to live
 * behavior takes two deliberate operator steps — validate, then publish — so
 * one bad call can never rewrite what the agent does on real calls.
 */
export function MemoryReviewPanel({
  campaignId = '',
  agentId = '',
  onChanged,
}: {
  campaignId?: string
  agentId?: string
  onChanged?: () => void
}) {
  const [stage, setStage] = useState<MemoryStatus>('candidate')
  const [memories, setMemories] = useState<AgentMemoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [openId, setOpenId] = useState('')
  const [reviewer, setReviewer] = useState('')
  const [rationale, setRationale] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(
    async (next: MemoryStatus) => {
      setLoading(true)
      setError('')
      try {
        setMemories(await repo.listAgentMemories(next, campaignId, agentId))
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        setMemories([])
      } finally {
        setLoading(false)
      }
    },
    [campaignId, agentId],
  )

  useEffect(() => {
    void load(stage)
  }, [load, stage])

  const validate = async (memory: AgentMemoryRecord) => {
    setBusyId(memory.memory_id)
    setError('')
    try {
      await repo.validateAgentMemory(memory.memory_id, { reviewer, rationale })
      setOpenId('')
      setRationale('')
      setNotice(
        'Validated. Publish it next to pin the extra rule on live calls. The conversation process you saved already applies on the next talk.',
      )
      setStage('validated')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  const publish = async (memory: AgentMemoryRecord) => {
    setBusyId(memory.memory_id)
    setError('')
    try {
      const version = await repo.publishAgentMemory(memory.memory_id)
      setNotice(`Published — behavior version ${version.version.slice(0, 8)} is now live.`)
      await load(stage)
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  const disable = async (memory: AgentMemoryRecord) => {
    setBusyId(memory.memory_id)
    setError('')
    try {
      const version = await repo.disableAgentMemory(memory.memory_id)
      setNotice(`Unpinned — behavior version ${version.version.slice(0, 8)} is now live.`)
      await load(stage)
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  const remove = async (memory: AgentMemoryRecord) => {
    setBusyId(memory.memory_id)
    setError('')
    try {
      await repo.dismissAgentMemory(memory.memory_id)
      if (openId === memory.memory_id) setOpenId('')
      setNotice('Memory removed from the review queue.')
      await load(stage)
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <BrainCircuit className="size-4 text-accent" />
            Agent memory review
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-fg-muted">{STAGE_HINT[stage]}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={stage}
            onChange={(v) => setStage(v as MemoryStatus)}
            ariaLabel="Memory stage"
            size="sm"
            options={STAGES}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh"
            onClick={() => void load(stage)}
            leadingIcon={
              loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />
            }
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-fg-muted">Loading memories…</p>
        ) : memories.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-fg-muted">
            <BrainCircuit className="size-4 text-fg-faint" />
            Nothing at this stage. Reviewed calls add candidates here.
          </p>
        ) : (
          <ul className="space-y-2">
            {memories
              .filter((memory, index, rows) => {
                const key = (memory.rule || '').trim()
                return rows.findIndex((row) => (row.rule || '').trim() === key) === index
              })
              .map((memory) => (
              <li
                key={memory.memory_id}
                className="rounded-md border border-line bg-surface-1 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-fg">{memory.rule}</p>
                    <p className="mt-0.5 truncate text-xs text-fg-faint">
                      {memory.scope?.join(', ') || memory.type} · {memory.language} ·{' '}
                      {memory.campaign_id}
                      {memory.reviewer ? ` · reviewed by ${memory.reviewer}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {stage === 'candidate' ? (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={busyId === memory.memory_id}
                          leadingIcon={<Check className="size-3.5" />}
                          onClick={() => {
                            setOpenId(openId === memory.memory_id ? '' : memory.memory_id)
                            setRationale('')
                          }}
                        >
                          Validate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === memory.memory_id}
                          onClick={() => void remove(memory)}
                          leadingIcon={<Trash2 className="size-3.5 text-danger" />}
                        >
                          Remove
                        </Button>
                      </>
                    ) : null}
                    {stage === 'validated' ? (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={busyId === memory.memory_id}
                          leadingIcon={
                            busyId === memory.memory_id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Rocket className="size-3.5" />
                            )
                          }
                          onClick={() => void publish(memory)}
                        >
                          Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === memory.memory_id}
                          onClick={() => void remove(memory)}
                          leadingIcon={<Trash2 className="size-3.5 text-danger" />}
                        >
                          Remove
                        </Button>
                      </>
                    ) : null}
                    {stage === 'production' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === memory.memory_id}
                        onClick={() => void disable(memory)}
                      >
                        Disable
                      </Button>
                    ) : null}
                  </div>
                </div>

                {openId === memory.memory_id ? (
                  <div className="mt-3 grid gap-2 rounded-md border border-line bg-bg/40 p-3 sm:grid-cols-[minmax(0,12rem)_1fr_auto]">
                    <label className="block">
                      <span className="mb-1 block text-2xs font-medium text-fg-secondary">
                        Reviewer
                      </span>
                      <Input
                        value={reviewer}
                        onChange={(e) => setReviewer(e.target.value)}
                        placeholder="your name"
                        className="h-7 text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-2xs font-medium text-fg-secondary">
                        Why this is a behavior rule, not a code fix
                      </span>
                      <Input
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="rationale stored with the memory"
                        className="h-7 text-xs"
                      />
                    </label>
                    <div className="flex items-end gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={
                          busyId === memory.memory_id || !reviewer.trim() || !rationale.trim()
                        }
                        onClick={() => void validate(memory)}
                      >
                        {busyId === memory.memory_id ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setOpenId('')}
                        leadingIcon={<X className="size-3.5" />}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {notice ? <p className="mt-2 text-xs text-fg-muted">{notice}</p> : null}
        {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      </div>
    </div>
  )
}
