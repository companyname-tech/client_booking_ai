import { useCallback, useEffect, useState } from 'react'
import { Loader2, MessageSquareText, RefreshCw } from 'lucide-react'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { PronunciationLexicon } from '@/components/admin/PronunciationLexicon'
import { TrainingTalkConsole } from '@/components/admin/TrainingTalkConsole'
import { TrainingSuggestionsPanel } from '@/components/admin/TrainingSuggestionsPanel'
import { Reveal } from '@/components/motion/Reveal'
import { repo } from '@/api/repository'
import type { TrainingCampaignRow, TrainingSuggestion } from '@/types/training'
import type { PronunciationAgentOption } from '@/types/pronunciation'

export default function AdminAITraining() {
  const [campaigns, setCampaigns] = useState<TrainingCampaignRow[]>([])
  const [agents, setAgents] = useState<PronunciationAgentOption[]>([])
  const [suggestions, setSuggestions] = useState<TrainingSuggestion[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshToken, setRefreshToken] = useState(0)

  const reload = useCallback(() => {
    setRefreshToken((n) => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErrors([])
    // Each section loads independently so one failing endpoint (e.g. a
    // mid-deploy backend) never blanks the campaigns/agents selectors or the
    // whole workspace. Failures are surfaced in the banner below the header.
    const loadSection = async <T,>(
      fetchFn: () => Promise<T>,
      apply: (value: T) => void,
      label: string,
    ) => {
      try {
        const data = await fetchFn()
        if (!cancelled) apply(data)
      } catch (e) {
        if (!cancelled) {
          const detail = e instanceof Error ? e.message : String(e)
          setErrors((prev) => [...prev, `${label}: ${detail}`])
        }
      }
    }
    void Promise.all([
      loadSection(() => repo.getTrainingCampaigns(), setCampaigns, 'Campaign list'),
      loadSection(() => repo.listPronunciationAgents(), setAgents, 'Agents'),
      loadSection(() => repo.getTrainingSuggestions('pending'), setSuggestions, 'Pronunciation suggestions'),
    ]).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [refreshToken])

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="AI Training" />}
          title="AI training workspace"
          description="Talk to the agent live — the real conversation updates its training state, and new names and words land in the pronunciation lexicon for your review."
        />

        {errors.length > 0 ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs text-danger"
            role="alert"
          >
            <div>
              <p className="font-semibold">Some training data failed to load</p>
              <ul className="mt-0.5 list-inside list-disc space-y-0.5 opacity-90">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
              <p className="mt-1 text-fg-muted">The sections below that loaded are still usable.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={reload} leadingIcon={<RefreshCw className="size-3.5" />}>
              Retry
            </Button>
          </div>
        ) : null}

        <Reveal>
          <TrainingTalkConsole
            campaigns={campaigns}
            agents={agents}
            onTrainingUpdated={reload}
          />
        </Reveal>

        <Reveal>
          <div className="surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
                  <MessageSquareText className="size-4 text-accent" />
                  Pronunciation suggestions from training talks
                </h3>
                <p className="mt-1 text-xs text-fg-muted">
                  Words the agent said during live training, waiting for your review. Accepting adds them to the real
                  pronunciation lexicon — the same list that feeds live calls.
                </p>
              </div>
              {!loading && suggestions.length > 0 ? (
                <span className="inline-flex items-center rounded-full border border-line bg-surface-1 px-2.5 py-1 text-2xs font-medium text-fg-muted">
                  {suggestions.length} pending
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Refresh"
                onClick={reload}
                leadingIcon={loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              />
            </div>
            <div className="mt-4">
              <TrainingSuggestionsPanel
                suggestions={suggestions}
                agents={agents}
                loading={loading}
                onChanged={reload}
              />
            </div>
          </div>
        </Reveal>

        <Reveal>
          {/* key remounts on refresh so accepted words appear in the manual lists */}
          <PronunciationLexicon key={refreshToken} />
        </Reveal>
      </PageContainer>
    </PageTransition>
  )
}
