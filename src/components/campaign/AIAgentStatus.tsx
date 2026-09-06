import { Bot } from 'lucide-react'
import type { Agent } from '@/types'
import { agentStatusMeta } from '@/lib/status'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatusDot } from '@/components/ui/StatusDot'

export function AIAgentStatus({ agent }: { agent: Agent }) {
  const meta = agentStatusMeta[agent.status]

  return (
    <div className="surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-violet-soft text-violet ring-1 ring-violet/20">
          <Bot className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="label-caps">AI Agent</div>
          <div className="mt-0.5 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-fg">{agent.name}</h3>
            <StatusBadge tone={meta.tone} live={meta.live} size="sm">
              {meta.label}
            </StatusBadge>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-fg-muted">Voice</dt><dd className="font-medium text-fg">{agent.voice}</dd></div>
        <div><dt className="text-fg-muted">Language</dt><dd className="font-medium text-fg">{agent.language}</dd></div>
        <div className="col-span-2"><dt className="text-fg-muted">Mode</dt><dd className="font-medium text-fg">Outbound booking</dd></div>
      </dl>

      <div className="mt-4 rounded-md border border-line bg-surface-1 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          <StatusDot tone="success" live size={6} />
          Current activity
        </div>
        <p className="mt-1 text-sm text-fg-secondary">&ldquo;Calling qualified prospects&rdquo;</p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
        <div>
          <dt className="text-2xs text-fg-muted">Calls today</dt>
          <dd className="text-lg font-semibold tabular text-fg">{agent.callsToday}</dd>
        </div>
        <div>
          <dt className="text-2xs text-fg-muted">Conversations</dt>
          <dd className="text-lg font-semibold tabular text-fg">{Math.round(agent.callsToday * 0.37)}</dd>
        </div>
        <div>
          <dt className="text-2xs text-fg-muted">Bookings</dt>
          <dd className="text-lg font-semibold tabular text-fg">{Math.round(agent.callsToday * 0.08)}</dd>
        </div>
      </dl>
    </div>
  )
}
