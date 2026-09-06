import type { CampaignDraft } from '@/types/campaignDraft'
import type { IntegrationState } from '@/types'
import { IntegrationCard } from '../IntegrationCard'

export function IntegrationsStep({
  draft,
  onChange,
}: {
  draft: CampaignDraft
  onChange: (patch: Partial<CampaignDraft['integrations']>) => void
}) {
  const set = (key: keyof CampaignDraft['integrations'], state: IntegrationState) => {
    onChange({ [key]: state })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
      <IntegrationCard
        provider="gmail"
        state={draft.integrations.gmail}
        onConnect={() => set('gmail', 'connected')}
      />
      <IntegrationCard
        provider="calendly"
        state={draft.integrations.calendly}
        onConnect={() => set('calendly', 'connected')}
      />
      <IntegrationCard
        provider="zoom"
        state={draft.integrations.zoom}
        onConnect={() => set('zoom', 'connected')}
        optional
      />
    </div>
  )
}
