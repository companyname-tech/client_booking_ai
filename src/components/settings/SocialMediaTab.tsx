import { AgentTelegramConnections } from './AgentTelegramConnections'
import { SchemaSettingsCard } from './SchemaSettingsCard'

/**
 * Settings → Social media tab — per-agent Telegram bot connections plus social
 * channel credentials: Facebook, Instagram, Telegram search, Reddit and the
 * Google Places API key (used by the Google Business/Maps lead-scan source).
 * Agent-scoped voice/model fields are NOT shown here (they live per-agent
 * under the Agent tab).
 */
export function SocialMediaTab() {
  return (
    <>
      <AgentTelegramConnections />
      <SchemaSettingsCard
        title="Social media"
        description="Social channel connections and credentials — Facebook, Instagram, Telegram search, Reddit, Google Business/Maps (Places API)."
        filter={(f) => /^(facebook|instagram|telegram|reddit|google_places)/.test(f.name)}
      />
    </>
  )
}
