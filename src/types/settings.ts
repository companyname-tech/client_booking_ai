/**
 * Settings / Connections — backend contract types.
 *
 * Mirrors the leads_to_conversion backend:
 *   - GET/PUT /settings          → AppSettings (senders, templates, caller identity, tts, auto-hangup)
 *   - GET/PUT /connections       → ConnectionsState (provider credentials, secrets masked on read)
 *   - DELETE /connections/{key}  → disconnect one provider
 *   - GET/POST /twilio-numbers, PUT/DELETE /twilio-numbers/{id} → sender-number registry
 *   - GET/POST /fish-voices, DELETE /fish-voices/{reference_id} → named Fish voice registry
 *   - GET /settings/schema       → schema-driven Application tab fields
 *   - GET/POST /agents, GET/PUT/DELETE /agents/{id} → operational agent editing
 *
 * Secret values are never returned raw; `masked`/`masked_*` fields carry a
 * `first3…last4` style preview only. Blank secret inputs mean "leave unchanged".
 */

export type ConnectionKind = 'model' | 'channel' | 'meeting'

export type ConnectionKey =
  | 'openai'
  | 'fish'
  | 'deepseek'
  | 'twilio'
  | 'whatsapp'
  | 'email'
  | 'google_meet'

export interface ProviderConnection {
  key: ConnectionKey
  /** Human label, e.g. "ChatGPT (OpenAI)". */
  label: string
  kind: ConnectionKind
  description: string
  configured: boolean
  /** Masked token preview — never the raw secret. */
  masked?: string
  /** Email only: which transport backs the email connection. */
  provider?: 'smtp' | 'twilio'
  /** Google Meet only: account that hosts the meeting. */
  host_email?: string
}

export interface EmailConnection {
  provider: 'smtp' | 'twilio'
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_use_tls: string // "true" | "false"
  configured: boolean
  masked_password: string
  masked_sendgrid_key: string
}

export interface ConnectionsState {
  connections: ProviderConnection[]
  email: EmailConnection
}

export interface TwilioNumber {
  id: string
  label: string
  phone: string
  voice: boolean
  whatsapp: boolean
}

export interface FishVoice {
  name: string
  reference_id: string
}

export interface SettingsSchemaField {
  name: string
  label: string
  type: 'string' | 'integer' | 'number' | 'boolean'
  secret: boolean
  restart_required: boolean
}

export type TtsProvider = 'openai' | 'fish'
export type AutoHangup = 'true' | 'false'

export interface AppSettings {
  whatsapp_from_phone: string
  whatsapp_message_template: string
  email_from_address: string
  email_from_name: string
  email_subject_template: string
  email_body_template: string
  caller_display_name: string
  caller_company_name: string
  auto_hangup: AutoHangup
  tts_provider: TtsProvider
  // Computed flags returned by GET /settings:
  whatsapp_configured: boolean
  email_configured: boolean
  email_provider: 'smtp' | 'twilio'
  google_meet_configured: boolean
  google_meet_host_email: string
  integrations_live: boolean
  tts_openai_configured: boolean
  tts_fish_configured: boolean
  twilio_configured: boolean
}

// ---------------------------------------------------------------------------
// Agents — operational editing (voice/language/identity/models)
// ---------------------------------------------------------------------------

export type AgentRole =
  | 'cold_call_seller'
  | 'appointment_setter'
  | 'sales_follow_up'
  | 'customer_support'
  | 'custom'

export interface AgentVoiceOption {
  value: string
  label: string
}

export interface ModelOption {
  value: string
  label: string
}

export interface AgentModels {
  audio: ModelOption[]
  transcription: ModelOption[]
}
