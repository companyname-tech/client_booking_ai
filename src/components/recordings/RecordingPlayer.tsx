import { MicOff } from 'lucide-react'
import { cn, formatDurationShort } from '@/lib/utils'
import { RecordingAudio } from '@/components/recordings/RecordingAudio'

interface RecordingPlayerProps {
  /** Same-origin /api/audio/... URL. Absent => no recording was captured. */
  audioUrl?: string
  durationSec?: number
  className?: string
}

/**
 * Recording player, gated on a REAL audio URL:
 * - No audioUrl -> a clear "No recording" empty state (never a dead 0:00
 *   player or a simulated progress bar).
 * - audioUrl present -> an actual <audio> element playing the file (native
 *   controls; a failed fetch degrades to "Recording unavailable").
 */
export function RecordingPlayer({ audioUrl, durationSec, className }: RecordingPlayerProps) {
  const duration = durationSec && durationSec > 0 ? formatDurationShort(durationSec) : null

  if (!audioUrl) {
    return (
      <div
        className={cn('flex items-center gap-3 rounded-lg border border-dashed border-line bg-surface-2 px-4 py-3', className)}
      >
        <MicOff className="size-4 shrink-0 text-fg-faint" aria-hidden />
        <div className="min-w-0 text-xs text-fg-muted">
          <div className="font-medium text-fg-secondary">No recording</div>
          <div className="mt-0.5">
            {duration ? `Call length ${duration} · audio was not captured for this call.` : 'Audio was not captured for this call.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border border-line bg-surface-2 px-3 py-2.5', className)}>
      <RecordingAudio src={audioUrl} className="w-full" />
      {duration && (
        <div className="mt-1 text-right text-2xs tabular text-fg-muted">{duration}</div>
      )}
    </div>
  )
}
