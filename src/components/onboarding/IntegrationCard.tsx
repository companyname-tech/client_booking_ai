import { useEffect, useState } from 'react'
import { Calendar, Loader2, Mail, Video } from 'lucide-react'
import type { IntegrationProvider, IntegrationState } from '@/types'
import { integrationStateMeta } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'

const ICONS = { gmail: Mail, calendly: Calendar, zoom: Video } as const

const COPY: Record<IntegrationProvider, { title: string; description: string }> = {
  gmail: {
    title: 'Gmail',
    description: 'Receive booking notifications and campaign communication.',
  },
  calendly: {
    title: 'Calendly',
    description: 'Let the AI book qualified meetings directly into your availability.',
  },
  zoom: {
    title: 'Zoom',
    description: 'Automatically create meeting links for booked calls.',
  },
}

export interface IntegrationCardProps {
  provider: IntegrationProvider
  state: IntegrationState
  onConnect: () => void
  optional?: boolean
}

export function IntegrationCard({ provider, state, onConnect, optional }: IntegrationCardProps) {
  const [localState, setLocalState] = useState(state)
  const [connecting, setConnecting] = useState(false)
  const Icon = ICONS[provider]
  const displayState: IntegrationState = connecting ? 'pending' : localState
  const meta = integrationStateMeta[displayState]
  const copy = COPY[provider]

  useEffect(() => setLocalState(state), [state])

  const connect = () => {
    if (localState === 'connected' || connecting) return
    setConnecting(true)
    window.setTimeout(() => {
      setConnecting(false)
      setLocalState('connected')
      onConnect()
    }, 1200)
  }

  return (
    <div
      className={cn(
        'surface interactive flex flex-col gap-4 p-5 transition-colors',
        localState === 'connected' && 'border-line-strong bg-surface-3/50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-surface-3 ring-1 ring-white/[0.06]">
            <Icon className="size-5 text-fg-secondary" strokeWidth={1.75} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-fg">{copy.title}</h3>
              {optional && <span className="text-2xs text-fg-muted">Optional</span>}
            </div>
            <p className="mt-0.5 text-xs text-fg-muted">{copy.description}</p>
          </div>
        </div>
        <StatusBadge tone={meta.tone} live={connecting}>
          {connecting ? 'Connecting…' : meta.label}
        </StatusBadge>
      </div>
      {localState === 'connected' && (
        <p className="text-2xs text-fg-muted">Last synced · Just now</p>
      )}
      <Button
        variant={localState === 'connected' ? 'ghost' : 'secondary'}
        size="sm"
        className="self-start"
        disabled={connecting || localState === 'connected'}
        leadingIcon={connecting ? <Loader2 className="animate-spin" /> : undefined}
        onClick={connect}
      >
        {localState === 'connected' ? 'Connected' : connecting ? 'Connecting…' : `Connect ${copy.title}`}
      </Button>
    </div>
  )
}
