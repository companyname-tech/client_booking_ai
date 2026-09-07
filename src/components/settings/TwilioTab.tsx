import { SchemaSettingsCard } from './SchemaSettingsCard'

/**
 * Settings → Twilio tab — every Twilio call setting in one standalone tab:
 * account SID, auth token, from-number, media-stream base URLs, voice, transport.
 */
export function TwilioTab() {
  return (
    <SchemaSettingsCard
      title="Twilio"
      description="Twilio call configuration — credentials, from-number, voice, and media-stream base URLs."
      filter={(f) => f.name.startsWith('twilio_') || f.name === 'call_transport'}
    />
  )
}
