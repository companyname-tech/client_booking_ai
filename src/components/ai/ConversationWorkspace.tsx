import { useState } from 'react'
import type { AIConversationDetail } from '@/types/aiCommand'
import { cn, formatDuration } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer'
import { Reveal } from '@/components/motion/Reveal'

export function ConversationTranscript({ messages }: { messages: AIConversationDetail['transcript'] }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  return (
    <div className="space-y-4">
      {messages.map((m, i) => (
        <Reveal key={i} className={cn('flex gap-3', m.speaker === 'prospect' ? 'flex-row-reverse text-right' : '')}>
          <div className={cn('max-w-[85%] rounded-lg px-4 py-3', m.speaker === 'ai' ? 'bg-violet-soft/20 text-fg' : 'bg-surface-3 text-fg-secondary')}>
            <div className="mb-1 flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider">
              <span className={m.speaker === 'ai' ? 'text-violet' : 'text-fg-muted'}>{m.speaker === 'ai' ? 'AI' : 'Prospect'}</span>
              <span className="text-fg-faint">{m.timestamp}</span>
            </div>
            <p className="text-sm leading-relaxed">{m.text}</p>
            {m.marker && (
              <button type="button" onClick={() => setExpanded(expanded === i ? null : i)} className="mt-2 text-2xs font-medium text-accent">
                {m.marker.type} {expanded === i ? '▲' : '▼'}
              </button>
            )}
            {expanded === i && m.marker && (
              <p className="mt-1 text-2xs text-fg-muted">{m.marker.detail}</p>
            )}
          </div>
        </Reveal>
      ))}
      <p className="text-2xs text-fg-faint">Conversation</p>
    </div>
  )
}

export function AIDecisionLayer({ decisions }: { decisions: AIConversationDetail['decisions'] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-fg">AI Decision Layer</h3>
      <p className="text-2xs text-fg-muted">Operational explanations</p>
      {decisions.map((d) => (
        <div key={d.id} className="rounded-lg border border-line bg-surface-1 p-4">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <div><span className="text-fg-muted">Intent</span><div className="font-medium">{d.intent}</div></div>
            <div><span className="text-fg-muted">Confidence</span><div className="font-medium tabular">{d.confidence}%</div></div>
            <div><span className="text-fg-muted">Qualification</span><div className="font-medium">{d.qualification}</div></div>
            {d.objection && <div><span className="text-fg-muted">Objection</span><div className="font-medium">{d.objection}</div></div>}
            {d.responseStrategy && <div><span className="text-fg-muted">Strategy</span><div className="font-medium">{d.responseStrategy}</div></div>}
            <div><span className="text-fg-muted">Next action</span><div className="font-medium">{d.nextAction}</div></div>
          </div>
          <p className="mt-2 text-xs text-fg-muted">{d.explanation}</p>
        </div>
      ))}
    </div>
  )
}

export function ConversationSummary({ conversation }: { conversation: AIConversationDetail }) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-fg">AI Summary</h3>
      <p className="mt-2 text-sm text-fg-secondary">{conversation.summary}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div><dt className="text-fg-muted">Decision maker</dt><dd className="font-medium">{conversation.leadProfile.isDecisionMaker ? 'Yes' : 'No'}</dd></div>
        <div><dt className="text-fg-muted">Pain point</dt><dd className="font-medium">{conversation.leadProfile.painPoint ?? '—'}</dd></div>
        <div><dt className="text-fg-muted">Current solution</dt><dd className="font-medium">{conversation.leadProfile.currentSolution ?? '—'}</dd></div>
        <div><dt className="text-fg-muted">Interest</dt><dd className="font-medium">{conversation.leadProfile.interest}</dd></div>
        <div><dt className="text-fg-muted">Booking</dt><dd className="font-medium">{conversation.leadProfile.bookingStatus}</dd></div>
      </dl>
    </div>
  )
}

export function LeadProfilePanel({ profile }: { profile: AIConversationDetail['leadProfile'] }) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-fg">Lead Profile</h3>
      <div className="mt-3 space-y-1 text-sm">
        <div className="font-medium text-fg">{profile.name}</div>
        <div className="text-fg-muted">{profile.role} · {profile.company}</div>
        <div className="text-fg-muted">{profile.industry} · {profile.companySize} · {profile.location}</div>
      </div>
      <div className="mt-4 text-2xl font-semibold tabular text-fg">{profile.leadScore}<span className="text-sm text-fg-muted">/100</span></div>
      <p className="text-2xs text-fg-muted">Lead score · {profile.previousInteractions} previous interactions</p>
    </div>
  )
}

export function ConversationTimeline({ events }: { events: AIConversationDetail['timeline'] }) {
  return (
    <ol className="relative space-y-0">
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-4 pb-4 last:pb-0">
          {i < events.length - 1 && <span aria-hidden className="absolute left-[5px] top-3 h-[calc(100%-4px)] w-px bg-line-strong" />}
          <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-accent ring-4 ring-surface-1" />
          <div>
            <time className="text-2xs tabular text-fg-muted">{e.timestamp}</time>
            <div className="text-sm font-medium text-fg">{e.label}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function AIConfidencePanel({ overall, breakdown }: { overall: number; breakdown: { label: string; value: number }[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <div className="text-3xl font-semibold tabular text-violet">{overall}%</div>
      <div className="text-sm text-fg-muted">Simulated AI confidence</div>
      <div className="mt-4 space-y-2">
        {breakdown.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-xs"><span className="text-fg-muted">{b.label}</span><span className="tabular">{b.value}%</span></div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-violet/70" style={{ width: `${b.value}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ConversationOutcome({ outcome }: { outcome: AIConversationDetail['outcomeDetails'] }) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-fg">Call Outcome</h3>
      <div className="mt-2"><StatusBadge tone="success">{outcome.outcome}</StatusBadge></div>
      <dl className="mt-3 space-y-2 text-xs">
        <div className="flex justify-between"><dt className="text-fg-muted">Confidence</dt><dd className="font-medium tabular">{outcome.confidence}%</dd></div>
        <div className="flex justify-between"><dt className="text-fg-muted">Classification</dt><dd className="font-medium">{outcome.classification}</dd></div>
        <div className="flex justify-between"><dt className="text-fg-muted">Next action</dt><dd className="font-medium">{outcome.nextAction}</dd></div>
      </dl>
    </div>
  )
}

export function RecordingIntelligence({ conversation }: { conversation: AIConversationDetail }) {
  return (
    <div className="space-y-4">
      <RecordingPlayer durationSec={conversation.recordingDurationSec} />
      <div>
        <h3 className="text-sm font-semibold text-fg">Key moments</h3>
        <ul className="mt-2 space-y-1">
          {conversation.keyMoments.map((m) => (
            <li key={m.offsetSec} className="flex justify-between text-xs">
              <span className="font-mono tabular text-fg-muted">{formatDuration(m.offsetSec)}</span>
              <span className="text-fg-secondary">{m.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
