import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Globe2, UserRound, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { repo } from '@/api/repository'
import { groupByLanguage, newEntryId } from '@/lib/pronunciation'
import type {
  PronunciationAgentOption,
  PronunciationLexiconEntry,
} from '@/types/pronunciation'

type Tab = 'main' | 'agent'

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function LexiconList({
  entries,
  onRemove,
}: {
  entries: PronunciationLexiconEntry[]
  onRemove: (id: string) => void
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-fg-muted">No words yet — add your first pronunciation below.</p>
  }
  return (
    <div className="space-y-4">
      {groupByLanguage(entries).map((group) => (
        <div key={group.lang || '__none__'}>
          <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
            {group.label}
          </h4>
          <ul className="space-y-1">
            {group.items.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-1 px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-fg">{e.word}</span>
                  <span className="ml-2 text-xs text-fg-muted">→ {e.pronounce_as}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(e.id!)}
                  className="shrink-0 rounded p-1 text-fg-faint transition-colors hover:text-danger"
                  aria-label={`Remove ${e.word}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function PronunciationLexicon() {
  const [tab, setTab] = useState<Tab>('main')
  const [agents, setAgents] = useState<PronunciationAgentOption[]>([])
  const [agentId, setAgentId] = useState('')
  const [globalEntries, setGlobalEntries] = useState<PronunciationLexiconEntry[]>([])
  const [agentEntries, setAgentEntries] = useState<PronunciationLexiconEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [word, setWord] = useState('')
  const [pronounceAs, setPronounceAs] = useState('')
  const [language, setLanguage] = useState('en')
  const [transcribing, setTranscribing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load global lexicon + agent list once.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [g, ags] = await Promise.all([repo.getGlobalLexicon(), repo.listPronunciationAgents()])
        if (cancelled) return
        setGlobalEntries(g)
        setAgents(ags)
        setAgentId((prev) => prev || ags[0]?.agentId || '')
      } catch (e) {
        if (!cancelled) setStatus({ kind: 'err', text: `Load failed: ${errText(e)}` })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Reload the per-agent lexicon whenever the selected agent changes.
  useEffect(() => {
    if (!agentId) return
    let cancelled = false
    ;(async () => {
      try {
        const lex = await repo.getAgentLexicon(agentId)
        if (cancelled) return
        setAgentEntries(lex)
        setDirty(false)
      } catch (e) {
        if (!cancelled) setStatus({ kind: 'err', text: `Load agent failed: ${errText(e)}` })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [agentId])

  const entries = tab === 'main' ? globalEntries : agentEntries
  const setEntries = tab === 'main' ? setGlobalEntries : setAgentEntries

  const addEntry = () => {
    if (!word.trim() || !pronounceAs.trim()) return
    setEntries((prev) => [
      ...prev,
      { id: newEntryId(), word: word.trim(), pronounce_as: pronounceAs.trim(), language },
    ])
    setDirty(true)
    setWord('')
    setPronounceAs('')
  }

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    setStatus(null)
    try {
      if (tab === 'main') {
        await repo.saveGlobalLexicon(globalEntries)
      } else {
        await repo.saveAgentLexicon(agentId, agentEntries)
      }
      setDirty(false)
      setStatus({ kind: 'ok', text: 'Saved' })
    } catch (e) {
      setStatus({ kind: 'err', text: `Save failed: ${errText(e)}` })
    } finally {
      setSaving(false)
    }
  }

  const onFileChosen = async (file: File | undefined) => {
    if (!file) return
    setTranscribing(true)
    setStatus(null)
    try {
      const reply = await repo.transcribePronunciation(file, language)
      setPronounceAs(reply.pronounce_as)
      if (reply.language === 'en' || reply.language === 'he') setLanguage(reply.language)
      setStatus({ kind: 'ok', text: 'Transcribed — review then Add' })
    } catch (e) {
      setStatus({ kind: 'err', text: `Transcribe failed: ${errText(e)}` })
    } finally {
      setTranscribing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const selectedAgent = agents.find((a) => a.agentId === agentId)

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-fg">Pronunciation lexicon</h3>
          <p className="mt-1 text-xs text-fg-muted">
            Control how the AI pronounces names and terms, per language.
          </p>
        </div>
      </div>

      {/* Tier separation: main list vs per agent */}
      <div className="mt-4 flex rounded-lg border border-line p-1">
        <button
          type="button"
          onClick={() => setTab('main')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${tab === 'main' ? 'bg-surface-1 text-fg' : 'text-fg-muted hover:text-fg'}`}
        >
          <Globe2 className="size-4" />
          Main list
        </button>
        <button
          type="button"
          onClick={() => setTab('agent')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${tab === 'agent' ? 'bg-surface-1 text-fg' : 'text-fg-muted hover:text-fg'}`}
        >
          <UserRound className="size-4" />
          Per agent
        </button>
      </div>

      <p className="mt-2 text-2xs text-fg-faint">
        {tab === 'main'
          ? 'Main list applies to every agent. Per-agent words override the main list when the same word appears in both.'
          : 'Words specific to one agent. A per-agent word overrides a main-list word of the same spelling.'}
      </p>

      {/* Per-agent selector */}
      {tab === 'agent' && (
        <div className="mt-4">
          <label htmlFor="agent-select" className="mb-1.5 block text-xs font-medium text-fg-secondary">
            Agent
          </label>
          <Select
            id="agent-select"
            value={agentId}
            onChange={(v) => setAgentId(v)}
            ariaLabel="Agent"
            placeholder={agents.length === 0 ? 'No agents yet' : 'Choose an agent…'}
            options={agents.map((a) => ({ value: a.agentId, label: a.name?.trim() || '(unnamed)' }))}
            className="w-full"
          />
          {selectedAgent && (
            <p className="mt-1 text-2xs text-fg-faint">
              Showing words for <span className="text-fg-muted">{selectedAgent.name?.trim() || '(unnamed)'}</span>
            </p>
          )}
        </div>
      )}

      {/* Add form */}
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
        <Input
          type="text"
          placeholder="Word (e.g. Acme / אבי)"
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Pronounce as (e.g. ACK-mee / Avi)"
          value={pronounceAs}
          onChange={(e) => setPronounceAs(e.target.value)}
        />
        <Select
          value={language}
          onChange={(v) => setLanguage(v)}
          ariaLabel="Language"
          options={[
            { value: 'en', label: 'English' },
            { value: 'he', label: 'Hebrew' },
          ]}
          className="min-w-[7rem]"
        />
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => onFileChosen(e.target.files?.[0])}
          aria-label="Upload pronunciation audio"
        />
        <Button
          type="button"
          variant="secondary"
          leadingIcon={transcribing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          onClick={() => fileRef.current?.click()}
          disabled={transcribing}
        >
          {transcribing ? 'Transcribing…' : 'Upload audio'}
        </Button>
        <Button type="button" variant="primary" leadingIcon={<Plus className="size-4" />} onClick={addEntry}>
          Add
        </Button>
      </div>

      {/* Status + save */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div aria-live="polite" className="text-xs">
          {status && (
            <span className={status.kind === 'err' ? 'text-danger' : 'text-success'}>
              {status.text}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-2xs text-fg-faint">Unsaved changes</span>}
          <Button
            type="button"
            variant="primary"
            onClick={save}
            disabled={saving || !dirty}
            leadingIcon={saving ? <Loader2 className="size-4 animate-spin" /> : undefined}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {/* The selected list */}
      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-fg-muted">Loading…</p>
        ) : (
          <LexiconList entries={entries} onRemove={removeEntry} />
        )}
      </div>
    </div>
  )
}
