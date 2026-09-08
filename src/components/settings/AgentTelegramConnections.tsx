import { useEffect, useState } from 'react'
import { Bot } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import type { Agent } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, SectionHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SecretInput } from './SecretInput'

function AgentTelegramRow({
  agent,
  onUpdated,
}: {
  agent: Agent
  onUpdated: (updated: Agent) => void
}) {
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  async function handleSave() {
    const trimmed = token.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const updated = await repo.saveAgentTelegramConnection(agent.id, trimmed)
      onUpdated(updated)
      setToken('')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const updated = await repo.disconnectAgentTelegram(agent.id)
      onUpdated(updated)
      setToken('')
    } finally {
      setDisconnecting(false)
      setConfirmDisconnect(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 py-4 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-soft text-violet">
              <Bot className="size-3.5" />
            </span>
            <span className="text-sm font-medium text-fg">{agent.name}</span>
            <StatusBadge tone={agent.telegram_configured ? 'success' : 'neutral'}>
              {agent.telegram_configured ? 'Connected' : 'Not connected'}
            </StatusBadge>
          </div>
          <div className="mt-0.5 text-xs text-fg-muted">
            Telegram Bot API token for 1:1 client messaging via this agent.
          </div>
          {agent.telegram_masked && (
            <div className="mt-1.5 text-xs text-fg-muted">token: {agent.telegram_masked}</div>
          )}
        </div>

        <div className="min-w-0 space-y-2">
          <div>
            <div className="mb-1 text-xs text-fg-muted">Bot token</div>
            <SecretInput
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button size="sm" variant="primary" onClick={handleSave} disabled={saving || !token.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDisconnect(true)}
              disabled={!agent.telegram_configured || disconnecting}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        title={`Disconnect Telegram for ${agent.name}?`}
        body="This agent's bot token will be cleared. Reconnect any time from this screen."
        confirmLabel="Disconnect"
        busy={disconnecting}
        onConfirm={() => void handleDisconnect()}
      />
    </>
  )
}

/**
 * Settings → Social media — per-agent Telegram bot connections.
 */
export function AgentTelegramConnections() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getAgents())
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    if (data) setAgents(data)
  }, [data])

  function handleUpdated(updated: Agent) {
    setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  if (loading) return <LoadingState rows={4} />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState title="No data" />

  return (
    <Card flush className="px-5">
      <div className="py-4">
        <SectionHeader
          title="Telegram"
          description="Connect a Telegram bot per agent for 1:1 client messaging. Paste each token from @BotFather."
        />
      </div>
      <div className="divide-y divide-line">
        {agents.length === 0 ? (
          <div className="py-3 text-sm text-fg-muted">
            No agents yet. Create one under Settings → Agent first.
          </div>
        ) : (
          agents.map((agent) => (
            <AgentTelegramRow key={agent.id} agent={agent} onUpdated={handleUpdated} />
          ))
        )}
      </div>
    </Card>
  )
}
