import { SchemaSettingsCard } from './SchemaSettingsCard'
import { isAgentScopedSetting, isCampaignLeadGenSetting, isTrainingSetting } from './settingsFieldGroups'

/**
 * Settings → Application tab — runtime settings excluding Twilio (which has its
 * own tab), training/orchestrator fields (Training tab), agent voice/model
 * defaults (Agent tab), lead-generation defaults (per campaign), and
 * infrastructure paths (env/code-defined, not user settings).
 */
export function ApplicationTab() {
  return (
    <SchemaSettingsCard
      title="Application"
      description="Runtime settings. Secrets are masked — leave blank to keep current. Twilio settings live in the Twilio tab."
      filter={(f) =>
        !f.restart_required &&
        !f.name.startsWith('twilio_') &&
        f.name !== 'call_transport' &&
        !/^(facebook|instagram|telegram|reddit|google_places)_/.test(f.name) &&
        !isTrainingSetting(f.name) &&
        !isAgentScopedSetting(f.name) &&
        !isCampaignLeadGenSetting(f.name)
      }
      hiddenNote="Twilio settings live in the Twilio tab, social channels in the Social media tab, training and orchestrator settings in the AI training workspace, voice/model settings are configured per agent under the Agent tab, and lead generation params (country, industry, search model) are stored per campaign on the offer. Infrastructure paths are defined by the environment and are not editable here."
    />
  )
}
