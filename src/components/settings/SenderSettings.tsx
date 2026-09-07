import { useEffect, useState, type ReactNode } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { AppSettings, TtsProvider } from '@/types/settings'
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

export function SenderSettings() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getSettings())
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [whatsappFrom, setWhatsappFrom] = useState('')
  const [emailFromAddress, setEmailFromAddress] = useState('')
  const [emailFromName, setEmailFromName] = useState('')
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>('openai')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) {
      setSettings(data)
      setWhatsappFrom(data.whatsapp_from_phone)
      setEmailFromAddress(data.email_from_address)
      setEmailFromName(data.email_from_name)
      setTtsProvider(data.tts_provider)
    }
  }, [data])

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    setSaved(false)
    try {
      const next = await repo.saveSettings({
        whatsapp_from_phone: whatsappFrom.trim(),
        email_from_address: emailFromAddress.trim(),
        email_from_name: emailFromName.trim(),
        tts_provider: ttsProvider,
      })
      setSettings(next)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!settings) return <EmptyState title="No data" />

  const ttsConfigured =
    settings.tts_provider === 'fish' ? settings.tts_fish_configured : settings.tts_openai_configured

  return (
    <Card flush className="px-5">
      <div className="py-4">
        <SectionHeader
          title="Senders & voice"
          description="Default sender identity and the text-to-speech provider used on calls."
        />
      </div>
      <div className="divide-y divide-line">
        <Row label="WhatsApp sender" hint="Phone number messages appear to come from.">
          <div className="flex items-center gap-2">
            <Input value={whatsappFrom} onChange={(e) => setWhatsappFrom(e.target.value)} placeholder="+972501234567" />
            <StatusBadge tone={settings.whatsapp_configured ? 'success' : 'neutral'} subtle>
              {settings.whatsapp_configured ? 'Configured' : 'Not configured'}
            </StatusBadge>
          </div>
        </Row>

        <Row label="Email sender address" hint="From: address on outbound email.">
          <Input value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)} placeholder="sarah@acmegrowth.com" />
        </Row>

        <Row label="Email sender name" hint="From: display name on outbound email.">
          <Input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} placeholder="Acme Growth" />
        </Row>

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
              {settings.tts_provider === 'fish' ? 'Fish Audio' : 'OpenAI'}{' '}
              {ttsConfigured ? '✓ key set' : '✗ no API key'}
            </span>
          </div>
        </Row>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line py-3">
        {saved && <span className="mr-auto text-xs text-success">Saved</span>}
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save senders'}
        </Button>
      </div>
    </Card>
  )
}
