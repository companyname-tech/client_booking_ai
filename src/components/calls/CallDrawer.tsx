import type { CallDetail } from '@/types'
import type { Lead } from '@/types'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { CallOutcomeBadge, CallSentimentBadge } from './CallBadges'
import { AISummary } from '@/components/recordings/AISummary'
import { RecordingPlayer } from '@/components/recordings/RecordingPlayer'
import { Transcript } from '@/components/recordings/Transcript'
import { formatDuration } from '@/lib/utils'

export function CallDrawer({
  call,
  lead,
  open,
  onClose,
}: {
  call: CallDetail | null
  lead?: Lead
  open: boolean
  onClose: () => void
}) {
  if (!call) return null

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={lead?.name ?? 'Call detail'}
      subtitle={lead ? `${lead.company} · ${formatDuration(call.durationSec)}` : undefined}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <CallOutcomeBadge outcome={call.outcome} />
          <CallSentimentBadge sentiment={call.sentiment} />
        </div>

        {call.durationSec > 0 && <RecordingPlayer durationSec={call.durationSec} />}

        <AISummary summary={call.summary} signals={call.signals} confidence={call.confidence} />

        {call.keyMoments.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold text-fg">Key moments</h4>
            <ul className="mt-2 space-y-2">
              {call.keyMoments.map((m) => (
                <li key={m.offsetSec} className="flex gap-3 text-sm">
                  <span className="shrink-0 tabular text-2xs text-fg-muted">
                    {String(Math.floor(m.offsetSec / 60)).padStart(2, '0')}:{String(m.offsetSec % 60).padStart(2, '0')}
                  </span>
                  <span className="text-fg-secondary">{m.label}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h4 className="mb-3 text-sm font-semibold text-fg">Transcript</h4>
          <Transcript messages={call.transcript} />
        </section>
      </div>
    </DetailDrawer>
  )
}
