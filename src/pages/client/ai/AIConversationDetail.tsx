import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { repo } from '@/data/repository'
import { formatDuration } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reveal } from '@/components/motion/Reveal'
import {
  ConversationTranscript,
  AIDecisionLayer,
  ConversationSummary,
  LeadProfilePanel,
  ConversationTimeline,
  AIConfidencePanel,
  ConversationOutcome,
  RecordingIntelligence,
} from '@/components/ai/ConversationWorkspace'

export default function AIConversationDetail() {
  const { id } = useParams()
  const conversation = id ? repo.getAIConversation(id) : undefined

  useEffect(() => {
    if (id) repo.markConversationViewed(id)
  }, [id])

  if (!conversation) {
    return <EmptyState title="Conversation not found" action={<Link to="/client/ai/conversations" className="text-accent">Back to conversations</Link>} />
  }

  return (
    <div className="space-y-6">
      <Link to="/client/ai/conversations" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> Conversations
      </Link>

      <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">{conversation.leadName}</h1>
          <p className="text-sm text-fg-muted">{conversation.company} · {conversation.campaignName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge tone="success">{conversation.outcome ?? 'In progress'}</StatusBadge>
            <StatusBadge tone="violet">{conversation.intent} intent</StatusBadge>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-fg-muted">Duration</dt><dd className="font-medium tabular">{formatDuration(conversation.durationSec)}</dd></div>
          <div><dt className="text-fg-muted">AI confidence</dt><dd className="font-medium tabular">{conversation.confidence}%</dd></div>
          <div><dt className="text-fg-muted">Intent</dt><dd className="font-medium capitalize">{conversation.intent}</dd></div>
          <div><dt className="text-fg-muted">Outcome</dt><dd className="font-medium">{conversation.outcome ?? '—'}</dd></div>
        </dl>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Reveal className="space-y-6">
          <section className="surface p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-fg">Transcript</h2>
            <ConversationTranscript messages={conversation.transcript} />
          </section>
          <section className="surface p-5 sm:p-6 lg:hidden">
            <AIDecisionLayer decisions={conversation.decisions} />
          </section>
          <section className="surface p-5 sm:p-6">
            <RecordingIntelligence conversation={conversation} />
          </section>
        </Reveal>

        <aside className="space-y-4">
          <Reveal><AIConfidencePanel overall={conversation.confidence} breakdown={conversation.confidenceBreakdown} /></Reveal>
          <Reveal className="hidden lg:block"><AIDecisionLayer decisions={conversation.decisions} /></Reveal>
          <Reveal><ConversationSummary conversation={conversation} /></Reveal>
          <Reveal><LeadProfilePanel profile={conversation.leadProfile} /></Reveal>
          <Reveal><ConversationOutcome outcome={conversation.outcomeDetails} /></Reveal>
          <Reveal className="surface p-4">
            <h3 className="text-sm font-semibold text-fg">Timeline</h3>
            <div className="mt-3"><ConversationTimeline events={conversation.timeline} /></div>
          </Reveal>
        </aside>
      </div>
    </div>
  )
}
