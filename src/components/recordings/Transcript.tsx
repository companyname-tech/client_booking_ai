import type { TranscriptMessage } from '@/types'
import { cn } from '@/lib/utils'

export function Transcript({ messages, className }: { messages: TranscriptMessage[]; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {messages.map((m, i) => (
        <div key={i} className={cn('flex gap-3', m.speaker === 'ai' ? '' : 'flex-row-reverse text-right')}>
          <span
            className={cn(
              'shrink-0 text-2xs font-semibold uppercase tracking-wider',
              m.speaker === 'ai' ? 'text-violet' : 'text-fg-muted',
            )}
          >
            {m.speaker === 'ai' ? 'AI Agent' : 'Lead'}
          </span>
          <p className="text-sm leading-relaxed text-fg-secondary">{m.text}</p>
        </div>
      ))}
    </div>
  )
}
