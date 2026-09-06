import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn, formatDurationShort } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function RecordingPlayer({
  durationSec,
  className,
}: {
  durationSec: number
  className?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)

  const toggle = () => {
    if (playing) {
      setPlaying(false)
      return
    }
    setPlaying(true)
    const interval = window.setInterval(() => {
      setProgress((p) => {
        const next = p + 0.5
        if (next >= 100) {
          window.clearInterval(interval)
          setPlaying(false)
          return 0
        }
        return next
      })
    }, (durationSec * 10) / speed)
  }

  const currentSec = Math.floor((progress / 100) * durationSec)

  return (
    <div className={cn('rounded-lg border border-line bg-surface-2 p-4', className)}>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={toggle}
          className="size-9 rounded-full p-0"
        >
          {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
        </Button>
        <div className="min-w-0 flex-1">
          <div className="relative h-1.5 rounded-full bg-white/[0.08]">
            <div className="absolute h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-2xs tabular text-fg-muted">
            <span>{formatDurationShort(currentSec)}</span>
            <span>{formatDurationShort(durationSec)}</span>
          </div>
        </div>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="rounded-sm border border-line bg-surface-1 px-1.5 py-0.5 text-2xs text-fg-muted"
          aria-label="Playback speed"
        >
          {[0.75, 1, 1.25, 1.5].map((s) => (
            <option key={s} value={s}>{s}×</option>
          ))}
        </select>
      </div>
    </div>
  )
}
