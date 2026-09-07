import { SchemaSettingsCard } from './SchemaSettingsCard'

/**
 * Settings → Social media tab — social channel connections: Facebook,
 * Instagram, Telegram and Reddit credentials. Agent-scoped voice/model fields
 * are NOT shown here (they live per-agent under the Agent tab).
 */
export function SocialMediaTab() {
  return (
    <SchemaSettingsCard
      title="Social media"
      description="Social channel connections and credentials — Facebook, Instagram, Telegram, Reddit."
      filter={(f) => /^(facebook|instagram|telegram|reddit)_/.test(f.name)}
    />
  )
}
