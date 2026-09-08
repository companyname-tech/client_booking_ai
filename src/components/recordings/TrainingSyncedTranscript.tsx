import { useEffect, useRef } from 'react'
import { Clock } from 'lucide-react'
import {
  activeTranscriptLine,
  activeWordIndexInLine,
  formatTalkClock,
  splitTranscriptWords,
  transcriptWindowLines,
  TRANSCRIPT_WINDOW_S,
  type TimedTranscriptLine,
} from '@/lib/trainingTranscript'
import { cn } from '@/lib/utils'

export interface TrainingSyncedTranscriptProps {
  lines: TimedTranscriptLine[]
  currentS: number
  windowS?: number
  selectedLineId?: string
  onSeekLine?: (line: TimedTranscriptLine) => void
  className?: string
  emptyMessage?: string
}

function HighlightedLineText({ line, currentS }: { line: TimedTranscriptLine; currentS: number }) {
  const words = splitTranscriptWords(line.text)
  const activeWord = activeWordIndexInLine(line, currentS)
  if (activeWord < 0) return <>{line.text}</>
  return (
    <>
      {words.map((word, index) => (
        <span
          key={`${line.id}-${index}`}
          className={cn(
            'rounded-sm transition-colors',
            index === activeWord && 'bg-accent/35 text-fg ring-1 ring-accent/40',
          )}
        >
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

export function TrainingSyncedTranscript({
  lines,
  currentS,
  windowS = TRANSCRIPT_WINDOW_S,
  selectedLineId,
  onSeekLine,
  className,
  emptyMessage = 'Press play — the last 10 seconds of the talk appear here.',
}: TrainingSyncedTranscriptProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const visible = transcriptWindowLines(lines, currentS, windowS)
  const activeLine = activeTranscriptLine(lines, currentS)
  const winStart = Math.max(0, currentS - windowS)

  useEffect(() => {
    const root = listRef.current
    if (!root || !activeLine) return
    const row = root.querySelector(`[data-line-id="${activeLine.id}"]`)
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeLine?.id, currentS])

  return (
    <div className={cn('rounded-xl border border-line bg-bg/30 p-3', className)}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
        <Clock className="size-3.5 shrink-0" />
        <span>Transcript — last {windowS}s</span>
        <span className="font-mono normal-case text-accent">
          {formatTalkClock(winStart)} – {formatTalkClock(currentS)}
        </span>
        {onSeekLine ? (
          <span className="font-normal normal-case text-fg-faint">· click a timestamp to jump</span>
        ) : null}
      </div>
      {visible.length === 0 ? (
        <p className="text-xs text-fg-faint">{emptyMessage}</p>
      ) : (
        <ul ref={listRef} className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {visible.map((line) => {
            const speaking = activeLine?.id === line.id
            const selected = selectedLineId === line.id
            const body = (
              <>
                <span className="shrink-0 font-mono text-2xs tabular text-accent">
                  {formatTalkClock(line.startS)}
                </span>
                <span className="min-w-0 leading-relaxed">
                  <span className={cn('font-semibold', line.role === 'user' ? 'text-accent' : 'text-fg-muted')}>
                    {line.role === 'user' ? 'You' : 'Agent'}:
                  </span>{' '}
                  <HighlightedLineText line={line} currentS={currentS} />
                </span>
              </>
            )
            if (!onSeekLine) {
              return (
                <li
                  key={line.id}
                  data-line-id={line.id}
                  className={cn(
                    'flex items-start gap-2 rounded-md px-2 py-1.5 text-xs',
                    speaking && 'bg-accent/15 text-fg',
                  )}
                >
                  {body}
                </li>
              )
            }
            return (
              <li key={line.id} data-line-id={line.id}>
                <button
                  type="button"
                  onClick={() => onSeekLine(line)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    speaking && 'bg-accent/15 text-fg',
                    selected && !speaking && 'bg-surface-2 text-fg',
                    !speaking && !selected && 'text-fg-secondary hover:bg-surface-1',
                  )}
                >
                  {body}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
