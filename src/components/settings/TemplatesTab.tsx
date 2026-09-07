import { useEffect, useState, type ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { EmailTemplate, MessageTemplate } from '@/types/settings'

const inputLabelClass = 'mb-1.5 block text-xs font-medium text-fg-muted'

const PLACEHOLDERS: { token: string; meaning: string }[] = [
  { token: '{first_name}', meaning: 'lead contact first name' },
  { token: '{lead_name}', meaning: 'lead / business name' },
  { token: '{company}', meaning: 'prospect company (verified or lead name)' },
  { token: '{offer_name}', meaning: 'the offer / campaign name' },
  { token: '{agent_name}', meaning: 'the AI agent that called' },
  { token: '{booking_link}', meaning: 'the lead’s booking (Meet) link' },
]

function uniqueKey(prefix: string, taken: string[]): string {
  let key = prefix
  let n = 2
  while (taken.includes(key)) {
    key = `${prefix}_${n}`
    n += 1
  }
  return key
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className={inputLabelClass}>{children}</div>
}

/**
 * Settings → Templates tab — multiple named WhatsApp + email templates.
 *
 * Each channel keeps an ordered list of templates (add / edit / remove). The
 * FIRST template of a channel is the DEFAULT one (used when a send flow does
 * not pick a template); the `key` of every template is the id a send flow
 * passes as `template_key` to pick which follow-up/booking scenario's message
 * is sent. Placeholders are resolved at SEND TIME from the actual lead/offer —
 * see the placeholder legend at the bottom of the tab.
 */
export function TemplatesTab() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getSettings())
  const [whatsapp, setWhatsapp] = useState<MessageTemplate[]>([])
  const [email, setEmail] = useState<EmailTemplate[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      setWhatsapp(
        data.whatsapp_templates ??
          (data.whatsapp_message_template
            ? [{ key: 'default', name: 'Default', body: data.whatsapp_message_template }]
            : []),
      )
      setEmail(
        data.email_templates ??
          (data.email_subject_template || data.email_body_template
            ? [
                {
                  key: 'default',
                  name: 'Default',
                  subject: data.email_subject_template ?? '',
                  body: data.email_body_template ?? '',
                },
              ]
            : []),
      )
    }
  }, [data])

  const patchWhatsapp = (index: number, patch: Partial<MessageTemplate>) => {
    setWhatsapp((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)))
  }
  const patchEmail = (index: number, patch: Partial<EmailTemplate>) => {
    setEmail((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)))
  }

  const addWhatsapp = () => {
    setWhatsapp((prev) => {
      const key = uniqueKey(
        prev.length === 0 ? 'default' : 'template',
        prev.map((t) => t.key),
      )
      return [...prev, { key, name: '', body: '' }]
    })
    setSaved(false)
    setErrorMsg(null)
  }
  const addEmail = () => {
    setEmail((prev) => {
      const key = uniqueKey(
        prev.length === 0 ? 'default' : 'template',
        prev.map((t) => t.key),
      )
      return [...prev, { key, name: '', subject: '', body: '' }]
    })
    setSaved(false)
    setErrorMsg(null)
  }

  const removeWhatsapp = (index: number) => {
    setWhatsapp((prev) => prev.filter((_, i) => i !== index))
    setSaved(false)
    setErrorMsg(null)
  }
  const removeEmail = (index: number) => {
    setEmail((prev) => prev.filter((_, i) => i !== index))
    setSaved(false)
    setErrorMsg(null)
  }

  const validate = (): string | null => {
    for (const t of whatsapp) {
      if (!t.key.trim()) return 'Every WhatsApp template needs a key.'
      if (!t.name.trim()) return 'Every WhatsApp template needs a name.'
    }
    for (const t of email) {
      if (!t.key.trim()) return 'Every email template needs a key.'
      if (!t.name.trim()) return 'Every email template needs a name.'
    }
    const waKeys = whatsapp.map((t) => t.key.trim())
    if (new Set(waKeys).size !== waKeys.length) return 'WhatsApp template keys must be unique.'
    const emailKeys = email.map((t) => t.key.trim())
    if (new Set(emailKeys).size !== emailKeys.length) return 'Email template keys must be unique.'
    return null
  }

  async function handleSave() {
    const problem = validate()
    if (problem) {
      setErrorMsg(problem)
      return
    }
    setSaving(true)
    setSaved(false)
    setErrorMsg(null)
    try {
      const updated = await repo.saveSettings({
        whatsapp_templates: whatsapp,
        email_templates: email,
      })
      // Re-sync from the persisted response (server normalizes/strips).
      setWhatsapp(updated.whatsapp_templates ?? whatsapp)
      setEmail(updated.email_templates ?? email)
      setSaved(true)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to save templates')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState title="No data" />

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* WhatsApp templates                                               */}
      {/* ---------------------------------------------------------------- */}
      <Card flush className="px-5">
        <div className="py-4">
          <SectionHeader
            title="WhatsApp templates"
            description="Messages used for WhatsApp follow-ups. The first template is the default when a send flow picks no specific one."
            action={
              <Button variant="secondary" size="sm" leadingIcon={<Plus />} onClick={addWhatsapp}>
                Add template
              </Button>
            }
          />
        </div>
        <div className="space-y-3 pb-4">
          {whatsapp.length === 0 ? (
            <div className="rounded-md border border-dashed border-line px-3 py-6 text-center text-sm text-fg-muted">
              No WhatsApp templates yet — add one for each follow-up scenario.
            </div>
          ) : (
            whatsapp.map((t, i) => (
              <div key={`${t.key}-${i}`} className="rounded-lg border border-line bg-surface-1 p-4">
                <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                  <div>
                    <FieldLabel>Key (send-time id)</FieldLabel>
                    <Input
                      value={t.key}
                      onChange={(e) => patchWhatsapp(i, { key: e.target.value })}
                      placeholder="e.g. booking_confirmation"
                      className="font-mono"
                      spellCheck={false}
                    />
                  </div>
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={t.name}
                      onChange={(e) => patchWhatsapp(i, { name: e.target.value })}
                      placeholder="e.g. Booking confirmation"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <FieldLabel>Message</FieldLabel>
                  <Textarea
                    value={t.body}
                    onChange={(e) => patchWhatsapp(i, { body: e.target.value })}
                    rows={3}
                    placeholder="Hi {first_name}, here is everything about {offer_name}…"
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="danger" size="sm" leadingIcon={<Trash2 />} onClick={() => removeWhatsapp(i)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Email templates                                                  */}
      {/* ---------------------------------------------------------------- */}
      <Card flush className="px-5">
        <div className="py-4">
          <SectionHeader
            title="Email templates"
            description="Subject + body used for outbound booking emails. The first template is the default when a send flow picks no specific one."
            action={
              <Button variant="secondary" size="sm" leadingIcon={<Plus />} onClick={addEmail}>
                Add template
              </Button>
            }
          />
        </div>
        <div className="space-y-3 pb-4">
          {email.length === 0 ? (
            <div className="rounded-md border border-dashed border-line px-3 py-6 text-center text-sm text-fg-muted">
              No email templates yet — add one for each booking / follow-up email.
            </div>
          ) : (
            email.map((t, i) => (
              <div key={`${t.key}-${i}`} className="rounded-lg border border-line bg-surface-1 p-4">
                <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                  <div>
                    <FieldLabel>Key (send-time id)</FieldLabel>
                    <Input
                      value={t.key}
                      onChange={(e) => patchEmail(i, { key: e.target.value })}
                      placeholder="e.g. booking_confirmation"
                      className="font-mono"
                      spellCheck={false}
                    />
                  </div>
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={t.name}
                      onChange={(e) => patchEmail(i, { name: e.target.value })}
                      placeholder="e.g. Booking confirmation"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <FieldLabel>Subject</FieldLabel>
                  <Input
                    value={t.subject}
                    onChange={(e) => patchEmail(i, { subject: e.target.value })}
                    placeholder="Your meeting with {offer_name}"
                  />
                </div>
                <div className="mt-3">
                  <FieldLabel>Body</FieldLabel>
                  <Textarea
                    value={t.body}
                    onChange={(e) => patchEmail(i, { body: e.target.value })}
                    rows={5}
                    placeholder={'Hi {first_name},\n\nYour booking is confirmed: {booking_link}\n\n{agent_name} from {company}'}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="danger" size="sm" leadingIcon={<Trash2 />} onClick={() => removeEmail(i)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Placeholder legend */}
      <Card flush className="px-5">
        <div className="py-4">
          <SectionHeader
            title="Placeholders"
            description="Dynamic values resolved from the actual lead and offer when the message is SENT — store them in any template."
          />
        </div>
        <div className="flex flex-wrap gap-2 pb-4">
          {PLACEHOLDERS.map((p) => (
            <span
              key={p.token}
              className="inline-flex items-center gap-2 rounded-md border border-line bg-surface-1 px-2.5 py-1.5"
            >
              <code className="font-mono text-xs text-accent">{p.token}</code>
              <span className="text-xs text-fg-muted">{p.meaning}</span>
            </span>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {errorMsg && <span className="mr-auto text-xs text-danger">{errorMsg}</span>}
        {saved && <span className="mr-auto text-xs text-success">Saved</span>}
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save templates'}
        </Button>
      </div>
    </div>
  )
}
