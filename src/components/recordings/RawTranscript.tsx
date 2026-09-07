import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export interface RawTranscriptLine {
  speaker: string
  text: string
}

/**
 * Splits the backend's raw transcript blob ("agent: …\nclient: …") into
 * displayable lines. Lines without a known speaker keep their whole text.
 */
export function parseRawTranscript(transcript: string): RawTranscriptLine[] {
  return (transcript ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':')
      if (idx <= 0) return { speaker: '', text: line }
      const maybe = line.slice(0, idx).trim().toLowerCase()
      return { speaker: maybe, text: line.slice(idx + 1).trim() }
    })
}

/**
 * Renders the raw conversation transcript ("agent: … / client: …" lines)
 * the way the rest of the app presents chat turns — agent on the left in the
 * accent tone, lead on the right. Falls back to a muted empty note.
 */
export function RawTranscript({ transcript, className }: { transcript: string; className?: string }) {
  const lines = useMemo(() => parseRawTranscript(transcript), [transcript])

  if (lines.length === 0) {
    return <p className={cn('text-sm text-fg-faint', className)}>No transcript for this call.</p>
  }

  return (
    <div className={cn('max-h-72 space-y-2 overflow-y-auto', className)}>
      {lines.map((line, i) => {
        const isAgent = line.speaker === 'agent'
        return (
          <div key={i} className={cn('flex gap-3', !isAgent && 'flex-row-reverse text-right')}>
            <span
              className={cn(
                'shrink-0 text-2xs font-semibold uppercase tracking-wider',
                isAgent ? 'text-accent' : 'text-fg-muted',
              )}
            >
              {isAgent ? 'Agent' : line.speaker === 'client' ? 'Lead' : line.speaker || 'Line'}
            </span>
            <p className="min-w-0 text-sm leading-relaxed text-fg-secondary">{line.text}</p>
          </div>
        )
      })}
    </div>
  )
}
