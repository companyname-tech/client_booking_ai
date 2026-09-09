import type { Client } from '@/types'
import { ProviderConnections } from './ProviderConnections'
import { SenderSettings } from './SenderSettings'

/**
 * Connection tab — composes the provider connection CRUD and the sender/TTS
 * settings. Twilio has its own tab (TwilioTab): the Twilio connection card and
 * the Twilio numbers registry live there, so this tab keeps the other providers
 * (OpenAI/Fish/DeepSeek/Email/Google Meet/Zoom). Holds no business logic itself;
 * each section owns its own data loading and mutations through `repo`.
 *
 * `client` provided → client scope: the sender identity section reads/writes the
 * client's own record instead of the global app settings.
 */
export function ConnectionSettings({ client }: { client?: Client | null }) {
  return (
    <>
      <ProviderConnections exclude={['twilio', 'telegram']} />
      <SenderSettings client={client ?? null} />
    </>
  )
}
