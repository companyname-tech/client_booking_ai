import { useCallback, useEffect, useState } from 'react'
import { Bot, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { agentStatusMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { Agent } from '@/types'
import type {
  AgentModels,
  AgentRole,
  AgentVoiceOption,
} from '@/types/settings'
import { AGENT_ROLE_LABELS, AGENT_ROLE_ORDER } from '@/lib/agentRoles'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'

const ROLE_OPTIONS: { value: AgentRole; label: string }[] = AGENT_ROLE_ORDER.map((r) => ({
  value: r,
  label: AGENT_ROLE_LABELS[r],
}))

interface CallerDraft {
  displayName: string
  company: string
}

export default function AgentTab() {
  const { data: agentsData, loading, error, reload } = useAsyncData(() => repo.getAgents())
  const { data: settings } = useAsyncData(() => repo.getSettings())
  const [agents, setAgents] = useState<Agent[]>([])
  const [voices, setVoices] = useState<AgentVoiceOption[]>([])
  const [models, setModels] = useState<AgentModels>({ audio: [], transcription: [], chat: [] })

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Agent>>({})
  const [callerDraft, setCallerDraft] = useState<CallerDraft>({ displayName: '', company: '' })
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savingCaller, setSavingCaller] = useState(false)

  useEffect(() => {
    if (agentsData) setAgents(agentsData)
  }, [agentsData])

  useEffect(() => {
    if (settings) {
      setCallerDraft({ displayName: settings.caller_display_name, company: settings.caller_company_name })
    }
  }, [settings])

  useEffect(() => {
    let cancelled = false
    void Promise.all([repo.listAgentVoices(), repo.listAgentModels()]).then(([v, m]) => {
      if (cancelled) return
      setVoices(v)
      setModels(m)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const draftFor = useCallback(
    (agent: Agent): Agent => drafts[agent.id] ?? agent,
    [drafts],
  )

  const patchDraft = useCallback((id: string, patch: Partial<Agent>) => {
    setDrafts((prev) => {
      const base = prev[id]
      return { ...prev, [id]: { ...base, id, ...patch } as Agent }
    })
  }, [])

  const toggle = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id))
    setDrafts((prev) => {
      if (prev[id]) return prev
      const agent = agents.find((a) => a.id === id)
      return agent ? { ...prev, [id]: { ...agent } } : prev
    })
  }

  const saveCallerIdentity = async () => {
    setSavingCaller(true)
    try {
      await repo.saveSettings({
        caller_display_name: callerDraft.displayName,
        caller_company_name: callerDraft.company,
      })
    } finally {
      setSavingCaller(false)
    }
  }

  const saveAgent = async (id: string) => {
    const draft = drafts[id]
    if (!draft) return
    setSavingId(id)
    try {
      const saved = await repo.updateAgent(id, draft)
      setAgents((prev) => prev.map((a) => (a.id === id ? saved : a)))
      setDrafts((prev) => ({ ...prev, [id]: saved }))
    } finally {
      setSavingId(null)
    }
  }

  const createAgent = async () => {
    const created = await repo.createAgent({ name: 'New Agent' })
    setAgents((prev) => [...prev, created])
    setDrafts((prev) => ({ ...prev, [created.id]: { ...created } }))
    setExpandedId(created.id)
  }

  const removeAgent = async (id: string) => {
    await repo.deleteAgent(id)
    setAgents((prev) => prev.filter((a) => a.id !== id))
    setDrafts((prev) => {
      const { [id]: _removed, ...rest } = prev
      return rest
    })
    if (expandedId === id) setExpandedId(null)
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!agentsData) return <EmptyState title="No data" />

  return (
    <div className="space-y-6">
      {/* Caller identity */}
      <Card flush className="px-5">
        <div className="py-4">
          <SectionHeader
            title="Caller identity"
            description="How the AI introduces itself on outbound calls."
          />
        </div>
        <div className="grid gap-4 pb-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Display name</label>
            <Input
              value={callerDraft.displayName}
              onChange={(e) => setCallerDraft((d) => ({ ...d, displayName: e.target.value }))}
              placeholder="e.g. Avi"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Company</label>
            <Input
              value={callerDraft.company}
              onChange={(e) => setCallerDraft((d) => ({ ...d, company: e.target.value }))}
              placeholder="e.g. Acme Growth"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line py-3">
          <Button variant="primary" onClick={saveCallerIdentity} disabled={savingCaller || !settings}>
            {savingCaller ? 'Saving…' : 'Save identity'}
          </Button>
        </div>
      </Card>

      {/* Agents editor */}
      <Card flush className="px-5">
        <div className="py-4">
          <SectionHeader
            title="Agents"
            description="Voice, language, identity and model configuration per agent."
            action={
              <Button variant="secondary" size="sm" leadingIcon={<Plus />} onClick={createAgent}>
                New Agent
              </Button>
            }
          />
        </div>

        <div className="space-y-3 pb-4">
          {agents.map((agent) => {
            const isOpen = expandedId === agent.id
            const draft = draftFor(agent)
            const status = agentStatusMeta[agent.status]
            const saving = savingId === agent.id
            return (
              <div key={agent.id} className="overflow-hidden rounded-lg border border-line bg-surface-1">
                <button
                  type="button"
                  onClick={() => toggle(agent.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-violet">
                      <Bot className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-fg">{agent.name}</span>
                        <StatusBadge tone={status.tone} live={status.live} size="sm">
                          {status.label}
                        </StatusBadge>
                      </div>
                      <div className="truncate text-xs text-fg-muted">
                        {agent.voice || 'No voice'} · {agent.role_label}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn('size-4 shrink-0 text-fg-muted transition-transform', isOpen && 'rotate-180')}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-line px-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">Name</label>
                        <Input
                          value={draft.name}
                          onChange={(e) => patchDraft(agent.id, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">Voice</label>
                        <Select
                          value={draft.voice}
                          onChange={(v) => patchDraft(agent.id, { voice: v })}
                          ariaLabel="Voice"
                          placeholder="— Select voice —"
                          options={voices.map((v) => ({ value: v.value, label: v.label }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">Audio (TTS) model</label>
                        <Select
                          value={draft.audio_model}
                          onChange={(v) => patchDraft(agent.id, { audio_model: v })}
                          ariaLabel="Audio (TTS) model"
                          placeholder="— Default —"
                          options={models.audio.map((m) => ({ value: m.value, label: m.label }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">Transcription (STT) model</label>
                        <Select
                          value={draft.transcription_model}
                          onChange={(v) => patchDraft(agent.id, { transcription_model: v })}
                          ariaLabel="Transcription (STT) model"
                          placeholder="— Default —"
                          options={models.transcription.map((m) => ({ value: m.value, label: m.label }))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">Language</label>
                        <Select
                          value={draft.language}
                          onChange={(v) => patchDraft(agent.id, { language: v })}
                          ariaLabel="Language"
                          placeholder="Choose…"
                          options={[
                            { value: 'he', label: 'Hebrew' },
                            { value: 'en', label: 'English' },
                            { value: 'ar', label: 'Arabic' },
                            { value: 'ru', label: 'Russian' },
                            { value: 'es', label: 'Spanish' },
                          ]}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">Agent model</label>
                        <Select
                          value={draft.agent_model ?? ''}
                          onChange={(v) => patchDraft(agent.id, { agent_model: v })}
                          ariaLabel="Agent model"
                          placeholder="— Default —"
                          options={[
                            ...models.chat.map((m) => ({ value: m.value, label: m.label })),
                            // Keep a previously-stored value selectable even when it is no
                            // longer on the system roster (legacy free-text agents).
                            ...(draft.agent_model &&
                            !models.chat.some((m) => m.value === draft.agent_model)
                              ? [{ value: draft.agent_model, label: `${draft.agent_model} (custom)` }]
                              : []),
                          ]}
                          className="w-full"
                        />
                        <p className="mt-1.5 text-xs text-fg-muted">
                          Chat brain for operation + transcript analysis. DeepSeek models appear once the DeepSeek key is connected.
                        </p>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-fg">Role</label>
                        <Select
                          value={draft.role}
                          onChange={(v) => patchDraft(agent.id, { role: v as AgentRole })}
                          ariaLabel="Role"
                          options={ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
                          className="w-full"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-fg">Identity</label>
                        <Textarea
                          value={draft.identity}
                          onChange={(e) => patchDraft(agent.id, { identity: e.target.value })}
                          placeholder="Custom persona instructions — leave blank to use the role template."
                        />
                        <p className="mt-1.5 text-xs text-fg-muted">
                          Effective identity:{' '}
                          <span className="text-fg-secondary">
                            {draft.identity.trim()
                              ? draft.identity.slice(0, 90) + (draft.identity.length > 90 ? '…' : '')
                              : 'uses role template'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                      <Button variant="danger" size="sm" leadingIcon={<Trash2 />} onClick={() => removeAgent(agent.id)}>
                        Delete
                      </Button>
                      <Button variant="primary" size="sm" disabled={saving} onClick={() => saveAgent(agent.id)}>
                        {saving ? 'Saving…' : 'Save agent'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
