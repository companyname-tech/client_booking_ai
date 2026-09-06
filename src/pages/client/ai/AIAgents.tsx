import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { agentStatusMeta } from '@/lib/status'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Bot } from 'lucide-react'

export default function AIAgents() {
  const agents = repo.getAgents()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => {
        const meta = agentStatusMeta[agent.status]
        return (
          <Link
            key={agent.id}
            to={`/client/ai/agents/${agent.id}`}
            className="interactive surface block p-5 transition-colors hover:bg-surface-3/50"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-violet-soft text-violet">
                <Bot className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-fg">{agent.name}</h3>
                <p className="text-sm text-fg-muted">{agent.voice}</p>
                <StatusBadge tone={meta.tone} live={meta.live} size="sm" className="mt-2">{meta.label}</StatusBadge>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div><dt className="text-fg-muted">Calls today</dt><dd className="font-medium tabular">{agent.callsToday}</dd></div>
              <div><dt className="text-fg-muted">Success rate</dt><dd className="font-medium tabular">{agent.successRate}%</dd></div>
            </dl>
          </Link>
        )
      })}
    </div>
  )
}
