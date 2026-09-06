import { repo } from '@/data/repository'
import { useCampaignContext } from './campaignContext'
import { Reveal } from '@/components/motion/Reveal'
import { IntegrationCard } from '@/components/onboarding/IntegrationCard'
import type { IntegrationState } from '@/types'
import { useState } from 'react'

export default function CampaignIntegrations() {
  const { campaign } = useCampaignContext()
  const workspaceIntegrations = repo.getIntegrations()
  const [states, setStates] = useState<Record<string, IntegrationState>>({
    gmail: workspaceIntegrations.find((i) => i.provider === 'gmail')?.state ?? 'disconnected',
    calendly: workspaceIntegrations.find((i) => i.provider === 'calendly')?.state ?? 'disconnected',
    zoom: workspaceIntegrations.find((i) => i.provider === 'zoom')?.state ?? 'connected',
  })

  return (
    <Reveal className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-fg">Integrations</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Connection state for tools used by <span className="text-fg-secondary">{campaign.name}</span>.
        </p>
      </div>
      <div className="grid gap-4">
        <IntegrationCard provider="gmail" state={states.gmail} onConnect={() => setStates((s) => ({ ...s, gmail: 'connected' }))} />
        <IntegrationCard provider="calendly" state={states.calendly} onConnect={() => setStates((s) => ({ ...s, calendly: 'connected' }))} />
        <IntegrationCard provider="zoom" state={states.zoom} onConnect={() => setStates((s) => ({ ...s, zoom: 'connected' }))} optional />
      </div>
      <p className="text-xs text-fg-muted">
        Manage workspace integrations in Settings.
      </p>
    </Reveal>
  )
}
