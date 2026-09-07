import { ProviderConnections } from './ProviderConnections'
import { SenderSettings } from './SenderSettings'

/**
 * Connection tab — composes the provider connection CRUD and the sender/TTS
 * settings. Twilio has its own tab (TwilioTab): the Twilio connection card and
 * the Twilio numbers registry live there, so this tab keeps the other providers
 * (OpenAI/Fish/DeepSeek/Email/Google Meet). Holds no business logic itself;
 * each section owns its own data loading and mutations through `repo`.
 */
export function ConnectionSettings() {
  return (
    <>
      <ProviderConnections exclude={['twilio']} />
      <SenderSettings />
    </>
  )
}
