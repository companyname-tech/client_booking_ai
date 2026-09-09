import { useEffect, useState, type ReactNode } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { AppSettings, TtsProvider } from '@/types/settings'
import type { Client } from '@/types'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { StatusBadge } from '@/components/ui/StatusBadge'

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
      <div>
        <div className="text-sm font-medium text-fg">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-fg-muted">{hint}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/**
 * Sender identity (WhatsApp from-number, email from-address/name) and the
 * voice TTS provider used on calls.
 *
 * Scope:
 * - `client` prop provided → CLIENT scope: the values are stored on the
 *   client's own record (repo.updateClient) and are the sender identity for
 *   that client (falling back to the global default when blank). TTS voice is
 *   agent/global, so it is hidden here — a client never edits a global engine.
 * - `client` omitted (admin) → GLOBAL scope: repo settings, incl. TTS provider.
 */
export function SenderSettings({ client }: { client?: Client | null }) {
  const clientScope = Boolean(client && client.id)

  const globalSettings = useAsyncData(() => repo.getSettings())
  const { data: globalData, loading: globalLoading, error: globalError, reload: reloadGlobal } = globalSettings

  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [whatsappFrom, setWhatsappFrom] = useState('')
  const [emailFromAddress, setEmailFromAddress] = useState('')
  const [emailFromName, setEmailFromName] = useState('')
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>('openai')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Global mode: hydrate from the app settings response.
  useEffect(() => {
    if (globalData) {
      setSettings(globalData)
      setWhatsappFrom(globalData.whatsapp_from_phone ?? '')
      setEmailFromAddress(globalData.email_from_address ?? '')
      setEmailFromName(globalData.email_from_name ?? '')
      setTtsProvider(globalData.tts_provider)
    }
  }, [globalData])

  // Client mode: hydrate from the client's own record.
  useEffect(() => {
    if (clientScope && client) {
      setWhatsappFrom(client.whatsappFromPhone ?? '')
      setEmailFromAddress(client.emailFromAddress ?? '')
      setEmailFromName(client.emailFromName ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const patch = {
        whatsappFromPhone: whatsappFrom.trim(),
        emailFromAddress: emailFromAddress.trim(),
        emailFromName: emailFromName.trim(),
      }
      if (clientScope && client) {
        await repo.updateClient(client.id, patch)
      } else {
        const next = await repo.saveSettings({ ...patch, tts_provider: ttsProvider })
        setSettings(next)
      }
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (clientScope) {
    if (!client) return <EmptyState title="No client data" />
  } else if (globalLoading) {
    return <LoadingState rows={4} />
  } else if (globalError) {
    return <ErrorState message={globalError} onRetry={reloadGlobal} />
  } else if (!settings) {
    return <EmptyState title="No data" />
  }

  const whatsappConfigured = clientScope
    ? Boolean(whatsappFrom.trim())
    : Boolean(settings?.whatsapp_configured)
  const ttsConfigured =
    (settings?.tts_provider === 'fish' ? settings?.tts_fish_configured : settings?.tts_openai_configured) ?? false

  return (
    <Card flush className="px-5">
      <div className="py-4">
        <SectionHeader
          title="Senders & voice"
          description={
            clientScope
              ? 'Sender identity for this client. Messages and emails appear to come from these addresses (falls back to the platform default when blank).'
              : 'Default sender identity and the text-to-speech provider used on calls.'
          }
        />
      </div>
      <div className="divide-y divide-line">
        <Row label="WhatsApp sender" hint="Phone number messages appear to come from.">
          <div className="flex items-center gap-2">
            <Input value={whatsappFrom} onChange={(e) => setWhatsappFrom(e.target.value)} placeholder="+972****4567" />
            <StatusBadge tone={whatsappConfigured ? 'success' : 'neutral'} subtle>
              {whatsappConfigured ? 'Configured' : 'Not configured'}
            </StatusBadge>
          </div>
        </Row>

        <Row label="Email sender address" hint="From: address on outbound email.">
          <div className="flex items-center gap-2">
            <Input value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)} placeholder="sarah@acmegrowth.com" />
            <StatusBadge tone={emailFromAddress.trim() ? 'success' : 'neutral'} subtle>
              {emailFromAddress.trim() ? 'Set' : 'Default'}
            </StatusBadge>
          </div>
        </Row>

        <Row label="Email sender name" hint="From: display name on outbound email.">
          <Input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} placeholder="Acme Growth" />
        </Row>

        {!clientScope && (
          <Row label="Voice TTS provider" hint="Which engine generates the agent's voice.">
            <div className="flex flex-col gap-2">
              <SegmentedControl<TtsProvider>
                value={ttsProvider}
                onChange={setTtsProvider}
                options={[
                  { value: 'openai', label: 'OpenAI' },
                  { value: 'fish', label: 'Fish Audio' },
                ]}
              />
              <span className="text-xs text-fg-muted">
                {settings?.tts_provider === 'fish' ? 'Fish Audio' : 'OpenAI'}{' '}
                {ttsConfigured ? '✓ key set' : '✗ no API key'}
              </span>
            </div>
          </Row>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line py-3">
        {saved && <span className="mr-auto text-xs text-success">Saved</span>}
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : clientScope ? 'Save client sender' : 'Save senders'}
        </Button>
      </div>
    </Card>
  )
}
