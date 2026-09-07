import { ProviderConnections } from './ProviderConnections'
import { TwilioNumbers } from './TwilioNumbers'
import { SchemaSettingsCard } from './SchemaSettingsCard'

/**
 * Settings → Twilio tab — every Twilio setting in one standalone tab:
 *
 * 1. The Twilio **connection card** (Account SID + Auth token, Save/Disconnect,
 *    connected state) — moved out of the Connection tab's provider list.
 * 2. The Twilio numbers registry (voice/WhatsApp sender numbers).
 * 3. The remaining Twilio call settings (transport, from-number, media-stream
 *    base URLs, voice). Credential rows (account SID / auth token) are excluded
 *    here because the connection card above owns them.
 *
 * Composes existing cards; holds no business logic itself.
 */
export function TwilioTab() {
  return (
    <>
      <ProviderConnections
        only={['twilio']}
        title="Twilio"
        description="Twilio account used for outbound calls and WhatsApp messaging. Credentials are stored encrypted and never shown in full."
      />
      <TwilioNumbers />
      <SchemaSettingsCard
        title="Twilio call settings"
        description="Call transport, sender number and media-stream base URLs. Leave secret fields blank to keep the current value."
        filter={(f) =>
          (f.name.startsWith('twilio_') && f.name !== 'twilio_account_sid' && f.name !== 'twilio_auth_token') ||
          f.name === 'call_transport'
        }
      />
    </>
  )
}
