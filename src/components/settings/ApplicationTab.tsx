import { SchemaSettingsCard } from './SchemaSettingsCard'

/**
 * Settings → Application tab — runtime settings excluding Twilio (which has its
 * own tab) and infrastructure paths (env/code-defined, not user settings).
 */
export function ApplicationTab() {
  return (
    <SchemaSettingsCard
      title="Application"
      description="Runtime settings. Secrets are masked — leave blank to keep current. Twilio settings live in the Twilio tab."
      filter={(f) => !f.restart_required && !f.name.startsWith('twilio_') && f.name !== 'call_transport' && !/^(facebook|instagram|telegram|reddit)_/.test(f.name)}
      hiddenNote="Twilio settings live in the dedicated Twilio tab, social channels in the Social media tab, and voice/model settings are configured per agent under the Agent tab. Infrastructure paths are defined by the environment and are not editable here."
    />
  )
}
