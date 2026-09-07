import { ProviderConnections } from './ProviderConnections'
import { TwilioNumbers } from './TwilioNumbers'
import { SenderSettings } from './SenderSettings'

/**
 * Connection tab — composes the provider connection CRUD, the Twilio numbers
 * registry, and the sender/TTS settings. Holds no business logic itself; each
 * section owns its own data loading and mutations through `repo`.
 */
export function ConnectionSettings() {
  return (
    <>
      <ProviderConnections />
      <TwilioNumbers />
      <SenderSettings />
    </>
  )
}
