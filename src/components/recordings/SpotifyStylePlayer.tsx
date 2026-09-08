import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AlertTriangle, AudioLines, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { formatTalkClock } from '@/lib/trainingTranscript'
import { cn } from '@/lib/utils'

export interface SpotifyStylePlayerHandle {
  seekTo: (seconds: number) => void
  play: () => Promise<void>
  getAudio: () => HTMLAudioElement | null
}

export interface SpotifyStylePlayerProps {
  src: string
  title?: string
  /** Karaoke-style line shown under the title while playing. */
  subtitle?: string
  rowKey?: string
  className?: string
  onTimeUpdate?: (seconds: number) => void
  onSeek?: (seconds: number) => void
  onDurationChange?: (seconds: number) => void
}

/**
 * Spotify-inspired training recording player — large artwork tile, scrub bar,
 * and a subtitle line for the active transcript moment.
 */
export const SpotifyStylePlayer = forwardRef<SpotifyStylePlayerHandle, SpotifyStylePlayerProps>(
function SpotifyStylePlayer({
  src,
  title = 'Training talk',
  subtitle,
  rowKey,
  className,
  onTimeUpdate,
  onSeek,
  onDurationChange,
}, ref) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const seekTo = (seconds: number) => {
    const el = audioRef.current
    if (!el) return
    const capped =
      el.duration && Number.isFinite(el.duration)
        ? Math.min(el.duration, Math.max(0, seconds))
        : Math.max(0, seconds)
    el.currentTime = capped
    setCurrent(capped)
    onTimeUpdate?.(capped)
    onSeek?.(capped)
  }

  useImperativeHandle(ref, () => ({
    seekTo,
    play: async () => {
      const el = audioRef.current
      if (!el) return
      await el.play()
      setPlaying(true)
    },
    getAudio: () => audioRef.current,
  }), [onSeek, onTimeUpdate])

  useEffect(() => {
    setPlaying(false)
    setFailed(false)
    setCurrent(0)
    setDuration(0)
  }, [src, rowKey])

  // timeupdate fires ~4×/s — poll while playing so subtitles track the audio.
  useEffect(() => {
    if (!playing) return
    let frame = 0
    const tick = () => {
      const el = audioRef.current
      if (el) {
        const t = el.currentTime
        setCurrent(t)
        onTimeUpdate?.(t)
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [playing, onTimeUpdate])

  if (!src) {
    return (
      <div className={cn('rounded-xl border border-dashed border-line bg-surface-2 p-4 text-xs text-fg-muted', className)}>
        No recording for this talk.
      </div>
    )
  }

  if (failed) {
    return (
      <div className={cn('flex items-center gap-2 rounded-xl border border-line bg-surface-2 p-4 text-xs text-fg-muted', className)}>
        <AlertTriangle className="size-4 shrink-0" />
        Recording unavailable
      </div>
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

  const seekRatio = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    seekTo(ratio * duration)
  }

  return (
    <div className={cn('rounded-xl border border-line bg-gradient-to-b from-surface-2 to-surface-1 p-4 shadow-2', className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime
          setCurrent(t)
          onTimeUpdate?.(t)
        }}
        onLoadedMetadata={(e) => {
          const next = e.currentTarget.duration || 0
          setDuration(next)
          onDurationChange?.(next)
        }}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/25">
          <AudioLines className="size-7 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{title}</p>
          <p className="mt-1 min-h-[2.5rem] text-sm leading-snug text-fg-secondary">
            {subtitle || <span className="text-fg-faint">Press play — transcript lines appear here as subtitles.</span>}
          </p>
        </div>
      </div>
      <div
        role="slider"
        aria-label="Seek recording"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration || 0)}
        aria-valuenow={Math.round(current)}
        onClick={seekRatio}
        className="group mt-4 h-2 cursor-pointer rounded-full bg-surface-3"
      >
        <div
          className="relative h-full rounded-full bg-accent transition-all group-hover:bg-accent-strong"
          style={{ width: `${duration ? (current / duration) * 100 : 0}%` }}
        >
          <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-fg opacity-0 shadow transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-mono text-2xs tabular text-fg-muted">
          {formatTalkClock(current)}
          {duration > 0 ? ` / ${formatTalkClock(duration)}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Back 5 seconds"
            onClick={() => seekTo(current - 5)}
            className="flex size-8 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={toggle}
            className="flex size-11 items-center justify-center rounded-full bg-accent text-white shadow-accent transition-transform hover:scale-105 hover:bg-accent-strong"
          >
            {playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
          </button>
          <button
            type="button"
            aria-label="Forward 5 seconds"
            onClick={() => seekTo(current + 5)}
            className="flex size-8 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
          >
            <SkipForward className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
})

SpotifyStylePlayer.displayName = 'SpotifyStylePlayer'

export function seekTrainingPlayer(seconds: number, audio: HTMLAudioElement | null) {
  if (!audio) return
  audio.currentTime = Math.max(0, seconds)
}
