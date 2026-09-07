import { useState } from 'react'
import { Check, Loader2, MessageSquarePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { repo } from '@/api/repository'
import type { TrainingSuggestion } from '@/types/training'
import { cn } from '@/lib/utils'

/**
 * Pronunciation suggestions harvested from real training talks.
 *
 * Each pending word came out of an actual live conversation the operator had
 * with the agent. Accepting moves it into the REAL pronunciation lexicon —
 * "Main list" (global, every agent) or a specific agent's list — which is what
 * feeds live calls. Dismissing drops it from the queue forever.
 */
export function TrainingSuggestionsPanel({
  suggestions,
  agents,
  loading,
  onChanged,
}: {
  suggestions: TrainingSuggestion[]
  agents: { agentId: string; name: string }[]
  loading: boolean
  onChanged: () => void
}) {
  const [busyId, setBusyId] = useState('')
  const [openId, setOpenId] = useState('')
  const [scope, setScope] = useState<'main' | 'agent'>('agent')
  const [targetAgentId, setTargetAgentId] = useState('')
  const [pronounceAs, setPronounceAs] = useState('')
  const [language, setLanguage] = useState('he')
  const [error, setError] = useState('')

  const accept = async (s: TrainingSuggestion) => {
    setBusyId(s.suggestionId)
    setError('')
    try {
      await repo.acceptTrainingSuggestion(s.suggestionId, {
        scope,
        agentId: scope === 'agent' ? targetAgentId : undefined,
        word: s.word,
        pronounceAs: pronounceAs.trim() || s.word,
        language,
      })
      setOpenId('')
      setPronounceAs('')
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  const dismiss = async (s: TrainingSuggestion) => {
    setBusyId(s.suggestionId)
    setError('')
    try {
      await repo.dismissTrainingSuggestion(s.suggestionId)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusyId('')
    }
  }

  if (loading) {
    return <p className="text-sm text-fg-muted">Loading suggestions…</p>
  }
  if (suggestions.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <MessageSquarePlus className="size-4 text-fg-faint" />
        No words waiting for review. Words from live training talks appear here.
      </p>
    )
  }

  return (
    <div>
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <li key={s.suggestionId} className="rounded-md border border-line bg-surface-1 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-fg">{s.word}</span>
                  <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-fg-muted">
                    {s.language === 'he' ? 'Hebrew' : 'English'}
                  </span>
                  {s.pronounceAs ? <span className="text-xs text-fg-faint">→ {s.pronounceAs}</span> : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-fg-faint">
                  {s.note || 'Spoken during a training talk'} · {s.offerTitle || s.offerCampaignId}
                  {s.agentName ? ` · ${s.agentName}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="sm"
                  variant="primary"
                  leadingIcon={busyId === s.suggestionId ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  disabled={busyId === s.suggestionId}
                  onClick={() => {
                    setOpenId(openId === s.suggestionId ? '' : s.suggestionId)
                    setScope('agent')
                    setTargetAgentId(s.agentId || agents[0]?.agentId || '')
                    setPronounceAs('')
                    setLanguage(s.language === 'en' ? 'en' : 'he')
                  }}
                >
                  Accept
                </Button>
                <Button size="sm" variant="ghost" disabled={busyId === s.suggestionId} onClick={() => void dismiss(s)}>
                  Dismiss
                </Button>
              </div>
            </div>

            {openId === s.suggestionId ? (
              <div className="mt-3 grid gap-2 rounded-md border border-line bg-bg/40 p-3 sm:grid-cols-[auto_1fr_auto_auto_auto]">
                <label className="block">
                  <span className="mb-1 block text-2xs font-medium text-fg-secondary">Into</span>
                  <Select
                    value={scope}
                    onChange={(v) => setScope(v as 'main' | 'agent')}
                    ariaLabel="Accept into"
                    size="sm"
                    options={[
                      { value: 'agent', label: "Agent's list" },
                      { value: 'main', label: 'Main list (all agents)' },
                    ]}
                    className="w-full"
                  />
                </label>
                {scope === 'agent' ? (
                  <label className="block">
                    <span className="mb-1 block text-2xs font-medium text-fg-secondary">Agent</span>
                    <Select
                      value={targetAgentId}
                      onChange={(v) => setTargetAgentId(v)}
                      ariaLabel="Target agent"
                      size="sm"
                      options={agents.map((a) => ({ value: a.agentId, label: a.name || '(unnamed)' }))}
                      className="w-full"
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="mb-1 block text-2xs font-medium text-fg-secondary">Pronounce as</span>
                  <Input
                    value={pronounceAs}
                    placeholder={s.word}
                    onChange={(e) => setPronounceAs(e.target.value)}
                    className="h-7 text-xs"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-2xs font-medium text-fg-secondary">Lang</span>
                  <Select
                    value={language}
                    onChange={(v) => setLanguage(v)}
                    ariaLabel="Language"
                    size="sm"
                    options={[
                      { value: 'he', label: 'Hebrew' },
                      { value: 'en', label: 'English' },
                    ]}
                    className="w-full"
                  />
                </label>
                <div className="flex items-end gap-1.5">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={busyId === s.suggestionId}
                    onClick={() => void accept(s)}
                  >
                    {busyId === s.suggestionId ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setOpenId('')} leadingIcon={<X className="size-3.5" />}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {error ? <p className={cn('mt-2 text-xs text-danger')}>{error}</p> : null}
    </div>
  )
}
