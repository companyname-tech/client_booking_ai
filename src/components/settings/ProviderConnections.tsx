import { useState, type ReactNode } from 'react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { ConnectionKey, ConnectionsState, EmailConnection, ProviderConnection } from '@/types/settings'
import { Card, SectionHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SecretInput } from './SecretInput'

interface FieldSpec {
  field: string
  label: string
  kind: 'text' | 'secret' | 'textarea'
  prefill?: string
}

function fieldsFor(conn: ProviderConnection): FieldSpec[] {
  switch (conn.key) {
    case 'openai':
      return [{ field: 'openai_api_key', label: 'API key', kind: 'secret' }]
    case 'fish':
      return [{ field: 'fish_api_key', label: 'API key', kind: 'secret' }]
    case 'deepseek':
      return [{ field: 'deepseek_api_key', label: 'API key', kind: 'secret' }]
    case 'whatsapp':
      return [{ field: 'whatsapp_api_key', label: 'API key', kind: 'secret' }]
    case 'twilio':
      return [
        { field: 'twilio_account_sid', label: 'Account SID', kind: 'text' },
        { field: 'twilio_auth_token', label: 'Auth token', kind: 'secret' },
      ]
    case 'google_meet':
      return [
        { field: 'google_meet_host_email', label: 'Host / organizer email', kind: 'text', prefill: conn.host_email ?? '' },
        { field: 'google_meet_access_token', label: 'OAuth access token', kind: 'secret' },
        { field: 'google_meet_service_account_json', label: 'Service account JSON', kind: 'textarea' },
      ]
    case 'zoom':
      return [
        { field: 'zoom_account_id', label: 'Account ID', kind: 'text' },
        { field: 'zoom_client_id', label: 'Client ID', kind: 'text' },
        { field: 'zoom_client_secret', label: 'Client secret', kind: 'secret' },
      ]
    case 'telegram':
      return [{ field: 'telegram_bot_token', label: 'Bot token', kind: 'secret' }]
    case 'email':
      return []
  }
}

// Non-secret fields whose value is always sent (even when empty), so host/port/user can be cleared.
const ALWAYS_SEND = new Set([
  'smtp_host',
  'smtp_port',
  'smtp_user',
  'google_meet_host_email',
  'zoom_account_id',
  'zoom_client_id',
])

function initialValues(conn: ProviderConnection, email: EmailConnection): Record<string, string> {
  if (conn.key === 'email') {
    return {
      smtp_host: email.smtp_host,
      smtp_port: email.smtp_port,
      smtp_user: email.smtp_user,
      smtp_password: '',
      sendgrid_api_key: '',
    }
  }
  const values: Record<string, string> = {}
  for (const f of fieldsFor(conn)) values[f.field] = f.prefill ?? ''
  return values
}

function ConnectionRow({
  conn,
  email,
  onSave,
  onDisconnect,
}: {
  conn: ProviderConnection
  email: EmailConnection
  onSave: (patch: Record<string, string>) => Promise<void>
  onDisconnect: () => Promise<void>
}) {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(conn, email))
  const [emailProvider, setEmailProvider] = useState<'smtp' | 'twilio'>(email.provider)
  const [tls, setTls] = useState(email.smtp_use_tls !== 'false')
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const setField = (field: string) => (value: string) => setValues((v) => ({ ...v, [field]: value }))

  function buildPatch(): Record<string, string> {
    const patch: Record<string, string> = {}
    for (const [k, v] of Object.entries(values)) {
      const trimmed = v.trim()
      if (ALWAYS_SEND.has(k)) patch[k] = trimmed
      else if (trimmed) patch[k] = trimmed
    }
    if (conn.key === 'email') {
      patch.email_provider = emailProvider
      patch.smtp_use_tls = tls ? 'true' : 'false'
    }
    return patch
  }

  async function handleSave() {
    const patch = buildPatch()
    if (!Object.keys(patch).length) return
    setSaving(true)
    try {
      await onSave(patch)
      // Clear one-time secret fields; keep visible non-secret values.
      setValues((prev) => {
        const next = { ...prev }
        for (const f of fieldsFor(conn)) if (f.kind !== 'text') next[f.field] = ''
        if (conn.key === 'email') {
          next.smtp_password = ''
          next.sendgrid_api_key = ''
        }
        return next
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await onDisconnect()
    } finally {
      setDisconnecting(false)
    }
  }

  const fields = fieldsFor(conn)
  const isEmail = conn.key === 'email'

  return (
    <div className="grid gap-4 py-4 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg">{conn.label}</span>
          <StatusBadge tone={conn.configured ? 'success' : 'neutral'}>
            {conn.configured ? 'Connected' : 'Not connected'}
          </StatusBadge>
        </div>
        <div className="mt-0.5 text-xs text-fg-muted">{conn.description}</div>
        {conn.masked && <div className="mt-1.5 text-xs text-fg-muted">token: {conn.masked}</div>}
        {conn.key === 'twilio' && conn.masked && (
          <div className="mt-1 text-xs text-fg-muted">account SID: {conn.masked}</div>
        )}
        {conn.key === 'google_meet' && conn.masked && (
          <div className="mt-1 text-xs text-fg-muted">token: {conn.masked}</div>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        {isEmail ? (
          <>
            <SegmentedControl<'smtp' | 'twilio'>
              size="sm"
              value={emailProvider}
              onChange={setEmailProvider}
              options={[
                { value: 'smtp', label: 'SMTP' },
                { value: 'twilio', label: 'Twilio (SendGrid)' },
              ]}
            />
            {emailProvider === 'smtp' ? (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <FieldHint>SMTP host</FieldHint>
                    <Input value={values.smtp_host} onChange={(e) => setField('smtp_host')(e.target.value)} placeholder="smtp.example.com" />
                  </div>
                  <div>
                    <FieldHint>Port</FieldHint>
                    <Input value={values.smtp_port} onChange={(e) => setField('smtp_port')(e.target.value)} placeholder="587" />
                  </div>
                </div>
                <div>
                  <FieldHint>SMTP user</FieldHint>
                  <Input value={values.smtp_user} onChange={(e) => setField('smtp_user')(e.target.value)} placeholder="user@example.com" />
                </div>
                <div>
                  <FieldHint>SMTP password{email.masked_password ? ` (${email.masked_password})` : ''}</FieldHint>
                  <SecretInput value={values.smtp_password} onChange={(e) => setField('smtp_password')(e.target.value)} placeholder="Leave blank to keep current" />
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg-secondary">
                  <input type="checkbox" checked={tls} onChange={(e) => setTls(e.target.checked)} className="size-4 accent-[var(--color-accent)]" />
                  STARTTLS
                </label>
              </div>
            ) : (
              <div>
                <FieldHint>SendGrid API key{email.masked_sendgrid_key ? ` (${email.masked_sendgrid_key})` : ''}</FieldHint>
                <SecretInput value={values.sendgrid_api_key} onChange={(e) => setField('sendgrid_api_key')(e.target.value)} placeholder="Leave blank to keep current" />
              </div>
            )}
          </>
        ) : (
          fields.map((f) => (
            <div key={f.field}>
              <FieldHint>{f.label}</FieldHint>
              {f.kind === 'secret' ? (
                <SecretInput value={values[f.field]} onChange={(e) => setField(f.field)(e.target.value)} placeholder="Leave blank to keep current" />
              ) : f.kind === 'textarea' ? (
                <Textarea value={values[f.field]} onChange={(e) => setField(f.field)(e.target.value)} placeholder="… paste a service-account JSON (server-to-server)" />
              ) : (
                <Input value={values[f.field]} onChange={(e) => setField(f.field)(e.target.value)} />
              )}
            </div>
          ))
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button size="sm" variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDisconnect} disabled={!conn.configured || disconnecting}>
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function FieldHint({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-xs text-fg-muted">{children}</div>
}

export function ProviderConnections({
  only,
  exclude,
  title = 'Providers',
  description = 'Connect the model, channel and meeting providers the AI uses. Tokens are stored encrypted and never shown in full.',
}: {
  /** When set, only these connection cards render (e.g. ['twilio'] on the Twilio tab). */
  only?: ConnectionKey[]
  /** Cards to skip (e.g. ['twilio'] so the Connection tab keeps the other providers). */
  exclude?: ConnectionKey[]
  title?: string
  description?: string
}) {
  const { data, loading, error, reload } = useAsyncData(() => repo.getConnections())
  const [state, setState] = useState<ConnectionsState | null>(null)
  const [disconnectKey, setDisconnectKey] = useState<ConnectionKey | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleSave(patch: Record<string, string>) {
    setState(await repo.saveConnection(patch))
  }

  async function confirmDisconnect() {
    if (!disconnectKey) return
    setDisconnecting(true)
    try {
      setState(await repo.disconnectConnection(disconnectKey))
    } finally {
      setDisconnecting(false)
      setDisconnectKey(null)
    }
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState title="No data" />

  const connections = state ?? data
  const visible = connections.connections.filter(
    (conn) => (!only || only.includes(conn.key)) && !(exclude ?? []).includes(conn.key),
  )

  return (
    <Card flush className="px-5">
      <div className="py-4">
        <SectionHeader title={title} description={description} />
      </div>
      <div className="divide-y divide-line">
        {visible.length === 0 ? (
          <div className="py-3 text-sm text-fg-muted">Nothing to configure here.</div>
        ) : (
          visible.map((conn) => (
            <ConnectionRow
              key={conn.key}
              conn={conn}
              email={connections.email}
              onSave={handleSave}
              onDisconnect={async () => {
                setDisconnectKey(conn.key)
              }}
            />
          ))
        )}
      </div>
      <ConfirmDialog
        open={!!disconnectKey}
        onClose={() => setDisconnectKey(null)}
        title={`Disconnect ${disconnectKey ?? 'provider'}?`}
        body="Its stored credentials will be cleared. Reconnect any time from this screen."
        confirmLabel="Disconnect"
        busy={disconnecting}
        onConfirm={() => void confirmDisconnect()}
      />
    </Card>
  )
}
