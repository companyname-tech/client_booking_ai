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
  const [loading, setLoading] = useState(true)
  const [refreshToken, setRefreshToken] = useState(0)

  const reload = useCallback(() => {
    setRefreshToken((n) => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    void Promise.all([repo.getTrainingCampaigns(), repo.listPronunciationAgents(), repo.getTrainingSuggestions('pending')])
      .then(([c, a, s]) => {
        if (cancelled) return
        setCampaigns(c)
        setAgents(a)
        setSuggestions(s)
      })
      .catch(() => {
        if (cancelled) return
        // Screens show the empty/error state; the talk console explains what is missing.
      })
      .finally(() => {
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
