import { useState } from 'react'
import { cn } from '@/lib/utils'

interface RecordingAudioProps {
  src: string
  className?: string
  /** Stable row key — resets the error state when the row's recording changes. */
  rowKey?: string
}

/**
 * <audio> with a graceful "recording unavailable" fallback.
 *
 * Playback runs through the same-origin /api proxy (audioUrl is already
 * prefixed with apiBaseUrl), so the session cookie applies. A missing file
 * (404) surfaces as a media error only when the user hits play
 * (preload="none" — we don't prefetch every row's audio); when that happens
 * we swap the dead player for a muted note instead of a silent no-op.
 */
export function RecordingAudio({ src, className, rowKey }: RecordingAudioProps) {
  const [failed, setFailed] = useState(false)

  return failed ? (
    <span
      className={cn('inline-flex items-center rounded-sm border border-line bg-surface-2 px-2 py-1 text-2xs text-fg-muted', className)}
      title="The recording file is missing or unavailable (404)"
    >
      Recording unavailable
    </span>
  ) : (
    <audio
      key={rowKey}
      controls
      preload="none"
      src={src}
      className={cn('h-8', className)}
      onError={() => setFailed(true)}
    />
  )
}
