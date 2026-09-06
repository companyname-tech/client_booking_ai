import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLeadProfile } from './LeadProfileLayout'
import { Reveal } from '@/components/motion/Reveal'
import {
  LeadAISummary,
  LeadScoreBreakdown,
  LeadJourney,
  LeadIntentChart,
  LeadCompanyIntelligence,
  LeadContactInfo,
  LeadAIInsights,
  LeadEngagementPanel,
  LeadSignals,
} from '@/components/leads/profile/LeadProfileSections'
import { LeadActivityTimeline } from '@/components/leads/profile/LeadActivityTimeline'
import { LeadConversationHistory } from '@/components/leads/profile/LeadConversationHistory'
import { LeadActionCenter } from '@/components/leads/profile/LeadActionCenter'
import { LeadStatePanel, LeadRelationshipGraph, LeadObjectionHistory } from '@/components/leads/profile/LeadStatePanel'
import { repo } from '@/data/repository'

export default function LeadProfileOverview() {
  const { profile } = useLeadProfile()
  const [toast, setToast] = useState('')
  const [tags, setTags] = useState([...new Set([...profile.tags, ...repo.getLeadTags(profile.lead.id)])])

  const insights = profile.objections.length > 0
    ? {
        strongestSignal: profile.objections[0]?.label ?? 'Strong engagement signals',
        objections: profile.objections.map((o) => o.label),
        positiveSignals: profile.signals.filter((s) => !s.includes('Concern')),
        recommendedAction: profile.nextBestAction,
      }
    : {
        strongestSignal: profile.signals[0] ?? 'Moderate fit detected',
        objections: [] as string[],
        positiveSignals: profile.signals,
        recommendedAction: profile.nextBestAction,
      }

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="rounded-lg border border-success/20 bg-success-soft/10 px-4 py-3 text-sm text-success">{toast}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Reveal><LeadScoreBreakdown breakdown={profile.scoreBreakdown} /></Reveal>
          <Reveal><LeadStatePanel profile={profile} /></Reveal>
          <Reveal><LeadContactInfo contact={profile.contact} lead={profile.lead} /></Reveal>
          <Reveal><LeadCompanyIntelligence company={profile.company} /></Reveal>
        </div>

        <div className="space-y-4">
          <Reveal><LeadAISummary profile={profile} /></Reveal>
          <Reveal>
            <div className="rounded-lg border border-line bg-surface-1 p-4">
              <h3 className="text-sm font-semibold text-fg">Prospect journey</h3>
              <div className="mt-4"><LeadJourney stages={profile.journey} /></div>
            </div>
          </Reveal>
          <Reveal>
            <div className="rounded-lg border border-line bg-surface-1 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-fg">Recent activity</h3>
                <Link to={`/client/leads/${profile.lead.id}/activity`} className="text-xs text-accent">View all →</Link>
              </div>
              <div className="mt-4"><LeadActivityTimeline items={profile.activity.slice(0, 4)} compact /></div>
            </div>
          </Reveal>
          <Reveal>
            <div className="rounded-lg border border-line bg-surface-1 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-fg">Conversation history</h3>
                <Link to={`/client/leads/${profile.lead.id}/conversations`} className="text-xs text-accent">View all →</Link>
              </div>
              <div className="mt-4"><LeadConversationHistory conversations={profile.conversations.slice(0, 2)} /></div>
            </div>
          </Reveal>
        </div>

        <div className="space-y-4">
          <Reveal><LeadActionCenter profile={profile} onAction={notify} /></Reveal>
          <Reveal>
            <div className="rounded-lg border border-line bg-surface-1 p-4">
              <h3 className="text-sm font-semibold text-fg">AI signals</h3>
              <div className="mt-3"><LeadSignals signals={profile.signals} /></div>
            </div>
          </Reveal>
          <Reveal><LeadEngagementPanel engagement={profile.engagement} /></Reveal>
          <Reveal><LeadIntentChart points={profile.intentTimeline} /></Reveal>
          <Reveal><LeadAIInsights insights={insights} /></Reveal>
          <Reveal>
            <div className="rounded-lg border border-line bg-surface-1 p-4">
              <h3 className="text-sm font-semibold text-fg">Objection history</h3>
              <div className="mt-3"><LeadObjectionHistory objections={profile.objections} /></div>
            </div>
          </Reveal>
          <Reveal><LeadRelationshipGraph profile={profile} /></Reveal>
          <Reveal>
            <div className="rounded-lg border border-line bg-surface-1 p-4">
              <h3 className="text-sm font-semibold text-fg">Tags</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['High Intent', 'Decision Maker', 'Follow-up', 'Priority', 'Pricing Concern'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      repo.toggleLeadTag(profile.lead.id, tag)
                      const stored = repo.getLeadTags(profile.lead.id)
                      if (stored.length) setTags(stored)
                      else setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                    }}
                    className={`rounded-full border px-2.5 py-0.5 text-2xs font-medium ${tags.includes(tag) ? 'border-accent bg-accent-soft/10 text-accent' : 'border-line text-fg-muted'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
