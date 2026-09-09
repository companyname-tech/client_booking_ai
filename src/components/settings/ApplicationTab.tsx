import { SchemaSettingsCard } from './SchemaSettingsCard'
import {
  isAgentScopedSetting,
  isCampaignLeadGenSetting,
  isLeadsRuntimeSetting,
  isTrainingSetting,
} from './settingsFieldGroups'

/**
 * Settings → Application tab — runtime settings excluding Twilio (which has its
 * own tab), lead sources & enrichment provider fields (Lead sources tab),
 * training/orchestrator fields (Training tab), agent voice/model defaults
 * (Agent tab), lead-generation defaults (per campaign), and infrastructure
 * paths (env/code-defined, not user settings).
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
        !/^(facebook|instagram|telegram|reddit|google_places|google_maps|katana|crawlee|phoneinfoga|theharvester|maigret|spiderfoot)_/.test(
          f.name,
        ) &&
        !isTrainingSetting(f.name) &&
        !isAgentScopedSetting(f.name) &&
        !isCampaignLeadGenSetting(f.name) &&
        !isLeadsRuntimeSetting(f.name)
      }
      hiddenNote="Twilio settings live in the Twilio tab, lead source & enrichment providers (Google Places/Maps, Katana, Crawlee, PhoneInfoga, theHarvester, Maigret, SpiderFoot) live in the Lead sources tab, training and orchestrator settings in the AI training workspace, voice/model settings are configured per agent under the Agent tab, lead generation job limits and verification concurrency are on the Leads screen, and lead generation params (country, industry, search model) are stored per campaign on the offer. Infrastructure paths are defined by the environment and are not editable here."
    />
  )
}
