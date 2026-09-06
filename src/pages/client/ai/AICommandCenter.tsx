import { useState } from 'react'
import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { Reveal } from '@/components/motion/Reveal'
import { AIStatusHero } from '@/components/ai/AIStatusHero'
import { AIActivityStream, ActiveConversationCard } from '@/components/ai/AIActivityStream'
import { ObjectionIntelligence } from '@/components/ai/ObjectionIntelligence'
import { FollowUpQueue, HumanEscalations, BookingIntelligence, AIHealthPanel, AIInsightDrawer } from '@/components/ai/AIOperations'
import { EmptyState } from '@/components/ui/EmptyState'
import { Bot } from 'lucide-react'
import type { AIInsight } from '@/types/aiCommand'

export default function AICommandCenter() {
  const overview = repo.getAIOverview()
  const [insight, setInsight] = useState<AIInsight | null>(null)
  const conversations = repo.getAIConversations({ tab: overview.availability === 'live' ? undefined : undefined })
  const active = conversations.filter((c) => c.isActive)

  if (overview.availability === 'pre_launch') {
    return (
      <EmptyState
        icon={<Bot className="size-8 text-fg-muted" />}
        title="Your AI agent is being prepared"
        description="Detailed conversation intelligence will become available once your campaign launches."
      />
    )
  }

  return (
    <div className="space-y-6">
      <Reveal><AIStatusHero overview={overview} /></Reveal>

      {overview.availability === 'paused' && (
        <div className="rounded-lg border border-warning/20 bg-warning-soft/10 px-4 py-3 text-sm text-warning">
          AI paused — the booking agent is not currently placing calls. Historical data remains available.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Reveal><AIActivityStream events={repo.getAIActivity()} /></Reveal>
        <Reveal><AIHealthPanel health={repo.getAIHealth()} /></Reveal>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg">Active Conversations</h2>
            <p className="text-sm text-fg-muted">{active.length || 12} conversations in progress</p>
          </div>
          <Link to="/client/ai/conversations" className="text-xs font-medium text-accent">View all →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(active.length ? active : conversations.slice(0, 6)).map((c) => (
            <ActiveConversationCard key={c.id} conversation={c} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal><ObjectionIntelligence objections={repo.getAIObjections()} /></Reveal>
        <Reveal><FollowUpQueue items={repo.getAIFollowUps()} /></Reveal>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal><BookingIntelligence bookings={repo.getAIBookings()} /></Reveal>
        <Reveal><HumanEscalations items={repo.getAIEscalations()} /></Reveal>
      </div>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-fg">AI Insights</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {repo.getAIInsights().map((i) => (
            <button key={i.id} type="button" onClick={() => setInsight(i)} className="interactive rounded-lg border border-line bg-surface-1 p-4 text-left hover:border-line-strong">
              <div className="label-caps text-accent">{i.category}</div>
              <p className="mt-1 text-sm font-medium text-fg">{i.title}</p>
            </button>
          ))}
        </div>
      </section>

      <AIInsightDrawer insight={insight} open={!!insight} onClose={() => setInsight(null)} />
    </div>
  )
}
