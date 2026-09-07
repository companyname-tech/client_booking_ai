import { useEffect, useState, type ReactNode } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

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
 * Settings → Templates tab — WhatsApp and email message templates.
 * These persist via the shared `PUT /settings` surface (kept in their own tab
 * per the user's rule: templates never live inside the connection cards).
 */
export function TemplatesTab() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getSettings())
  const [whatsapp, setWhatsapp] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) {
      setWhatsapp(data.whatsapp_message_template)
      setSubject(data.email_subject_template)
      setBody(data.email_body_template)
    }
  }, [data])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await repo.saveSettings({
        whatsapp_message_template: whatsapp,
        email_subject_template: subject,
        email_body_template: body,
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState title="No data" />

  return (
    <Card flush className="px-5">
      <div className="py-4">
        <SectionHeader
          title="Templates"
          description="Message templates used for WhatsApp follow-ups and booking emails. Use {first_name}, {agent_name}, {company} and {booking_link} placeholders."
        />
      </div>
      <div className="divide-y divide-line">
        <Row label="WhatsApp message template" hint="Sent as a WhatsApp follow-up after a call.">
          <Textarea value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} rows={4} />
        </Row>
        <Row label="Email subject template" hint="Subject line of outbound booking emails.">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Row>
        <Row label="Email body template" hint="Body of outbound booking emails.">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
        </Row>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line py-3">
        {saved && <span className="mr-auto text-xs text-success">Saved</span>}
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save templates'}
        </Button>
      </div>
    </Card>
  )
}
