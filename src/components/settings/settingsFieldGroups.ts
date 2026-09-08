/** Runtime settings owned by the Training settings page (call learning + orchestrator). */
export const TRAINING_SETTINGS_FIELDS = new Set([
  'outcome_model',
  'semantic_confidence_high',
  'semantic_confidence_medium',
  'critical_fact_confirmation_enabled',
  'component_level_correction_enabled',
  'training_memory_enabled',
  'max_runtime_memories',
  'post_call_normalization_enabled',
  'call_orchestrator_enabled',
  'call_orchestrator_shadow_mode',
])

export function isTrainingSetting(name: string): boolean {
  return TRAINING_SETTINGS_FIELDS.has(name)
}

/** Global runtime defaults that are edited per agent under Settings → Agent. */
export const AGENT_SCOPED_SETTINGS_FIELDS = new Set([
  'call_language',
  'tts_model',
  'tts_voice',
  'tts_response_format',
  'tts_instructions',
  'fish_tts_model',
  'fish_reference_id',
  'fish_tts_format',
  'agent_model',
  'verification_model',
])

export function isAgentScopedSetting(name: string): boolean {
  return AGENT_SCOPED_SETTINGS_FIELDS.has(name)
}

/** Lead-generation runtime settings owned per campaign (offer gen_* defaults + search policy). */
export const CAMPAIGN_LEAD_GEN_SETTINGS_FIELDS = new Set([
  'search_model',
  'lead_generation_free_only',
  // Deprecated globals — landing binding is per campaign (offer_id + offer.agent_id).
  'landing_agent_id',
  'landing_offer_id',
])

export function isCampaignLeadGenSetting(name: string): boolean {
  return CAMPAIGN_LEAD_GEN_SETTINGS_FIELDS.has(name)
}

export type TrainingSettingsGroup = {
  id: string
  title: string
  description: string
  fields: readonly string[]
}

/** Logical groupings for the standalone training settings page. */
export const TRAINING_SETTING_GROUPS: TrainingSettingsGroup[] = [
  {
    id: 'evaluation',
    title: 'Outcome & evaluation',
    description: 'Model and normalization used when grading calls and publishing training findings.',
    fields: ['outcome_model', 'post_call_normalization_enabled'],
  },
  {
    id: 'memory',
    title: 'Live memory',
    description: 'Retrieve validated training memories during live calls.',
    fields: ['training_memory_enabled', 'max_runtime_memories'],
  },
  {
    id: 'semantic',
    title: 'Semantic confidence gates',
    description: 'Thresholds and confirmation rules before the agent commits facts on a call.',
    fields: [
      'semantic_confidence_high',
      'semantic_confidence_medium',
      'critical_fact_confirmation_enabled',
      'component_level_correction_enabled',
    ],
  },
  {
    id: 'orchestrator',
    title: 'Call orchestrator',
    description: 'Hybrid Realtime turn gate — when enabled, the orchestrator owns response plans instead of VAD auto-responses.',
    fields: ['call_orchestrator_enabled', 'call_orchestrator_shadow_mode'],
  },
]
