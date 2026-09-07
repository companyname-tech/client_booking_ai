import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Pause, Play } from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'

interface RecordingAudioProps {
  src: string
  className?: string
  /** Stable row key — resets playback/error when the row's recording changes. */
  rowKey?: string
}

/**
 * Custom-styled audio player (no native browser controls). Playback runs
 * through the same-origin /api proxy (src already carries apiBaseUrl) so the
 * session cookie applies. A missing file (404) surfaces as a media error only
 * when the user hits play (preload="metadata"); then we show a muted note.
 */
export function RecordingAudio({ src, className, rowKey }: RecordingAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  // Reset whenever the source (or the row it belongs to) changes.
  useEffect(() => {
    setPlaying(false)
    setFailed(false)
    setCurrent(0)
    setDuration(0)
  }, [src, rowKey])

  if (failed) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 py-1.5 text-2xs text-fg-muted', className)}
        title="The recording file is missing or unavailable (404)"
      >
        <AlertTriangle className="size-3 shrink-0" />
        Recording unavailable
      </span>
    )
  }

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      void el.play().catch(() => setFailed(true))
      setPlaying(true)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    el.currentTime = ratio * duration
    setCurrent(el.currentTime)
  }

  return (
    <div className={cn('flex items-center gap-2 rounded-md border border-line bg-surface-1 px-2 py-1.5', className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent/90"
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="ml-0.5 size-3.5" />}
      </button>
      <div
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration || 0)}
        aria-valuenow={Math.round(current)}
        onClick={seek}
        className="relative h-1.5 min-w-0 flex-1 cursor-pointer rounded-full bg-surface-3"
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${duration ? (current / duration) * 100 : 0}%` }}
        />
      </div>
      <span className="shrink-0 text-2xs tabular text-fg-muted">
        {formatDuration(current)}{duration > 0 ? ` / ${formatDuration(duration)}` : ''}
      </span>
    </div>
  )
}
