import { useState } from 'react'
import { CalendarDays, Check, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useGoogleIntegration } from '@/hooks/useGoogleIntegration'
import { cn } from '@/lib/utils'

/** Google Calendar connection card (Phase 2 contract, pinned §2.2). */
export function GoogleConnectCard({
  clientId,
  onToast,
}: {
  clientId?: string
  onToast?: (text: string, kind: 'ok' | 'err') => void
}) {
  const { state, loading, error, reload, connect, disconnect } = useGoogleIntegration(clientId)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [busy, setBusy] = useState(false)

  const runDisconnect = async () => {
    setBusy(true)
    try {
      await disconnect()
      setConfirmDisconnect(false)
      onToast?.('Google Calendar disconnected', 'ok')
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : 'Disconnect failed', 'err')
      setConfirmDisconnect(false)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="surface p-4 text-sm text-fg-muted">Loading Google connection…</div>

  return (
    <div className="surface space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-fg-muted" />
          <h3 className="text-sm font-semibold text-fg">Google Calendar</h3>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium',
            state.connected ? 'border-success/20 text-success' : 'border-line text-fg-muted',
          )}
        >
          {state.connected ? <Check className="size-3" /> : null}
          {state.connected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      {state.connected ? (
        <div className="space-y-2 text-xs">
          {state.accountEmail && <p className="text-fg">Syncing to <span className="font-medium text-fg-secondary">{state.accountEmail}</span></p>}
          {state.needsReconnect && (
            <p className="rounded-md border border-warning/25 bg-warning-soft/30 px-2 py-1.5 text-warning">
              The connection needs to be re-authorized.
            </p>
          )}
          {state.calendarId && <p className="text-fg-faint">Calendar: {state.calendarId}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={() => void reload()} disabled={busy}>
              Refresh status
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDisconnect(true)} disabled={busy}>
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-fg-muted">
            Connect your Google Calendar so meetings are mirrored with Google Meet invites.
          </p>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" leadingIcon={<ExternalLink className="size-3.5" />} onClick={connect}>
              Connect Google Calendar
            </Button>
            <Button variant="ghost" size="sm" leadingIcon={<RefreshCw className="size-3.5" />} onClick={() => void reload()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        title="Disconnect Google Calendar?"
        body="The Google access will be revoked. Events already on your Google calendar are left in place."
        confirmLabel="Disconnect"
        busy={busy}
        onConfirm={runDisconnect}
      />
    </div>
  )
}
