import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { AgentReadiness } from '@/components/ai/AIOperations'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatNumber } from '@/lib/utils'
import { Reveal } from '@/components/motion/Reveal'

export default function AIAgentDetail() {
  const { id } = useParams()
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      if (!id) return null
      const [profile, agents] = await Promise.all([repo.getAIAgentProfile(id), repo.getAgents()])
      return { profile, agent: agents.find((a) => a.id === id) }
    },
    [id],
  )

  if (loading) return <LoadingState rows={6} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const profile = data?.profile
  const agent = data?.agent

  if (!profile || !agent) {
    return <EmptyState title="Agent not found" action={<Link to="/client/ai/agents" className="text-accent">Back to agents</Link>} />
  }

  const { activityToday: act } = profile

  return (
    <div className="space-y-6">
      <Link to="/client/ai/agents" className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> Agents
      </Link>

      <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">{profile.name}</h1>
          <p className="text-sm text-fg-muted">{profile.role}</p>
          <StatusBadge tone="success" live className="mt-2">Active</StatusBadge>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-fg">Configuration</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Language', profile.language],
              ['Tone', profile.tone],
              ['Objective', profile.objective],
              ['Qualification', profile.qualification],
              ['Booking', profile.booking],
              ['Meeting', profile.meetingDuration],
              ['Fallback', profile.fallback],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-2">
                <dt className="text-fg-muted">{k}</dt>
                <dd className="font-medium text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <Reveal><AgentReadiness readiness={profile.readiness} breakdown={profile.readinessBreakdown} /></Reveal>
      </div>

      <section className="surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-fg">Agent activity today</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { label: 'Calls', value: act.calls, delta: act.deltas.calls },
            { label: 'Conversations', value: act.conversations, delta: act.deltas.conversations },
            { label: 'Bookings', value: act.bookings, delta: act.deltas.bookings },
            { label: 'Follow-ups', value: act.followUps, delta: act.deltas.followUps },
            { label: 'Escalations', value: act.escalations, delta: act.deltas.escalations },
          ].map((m) => (
            <div key={m.label}>
              <div className="text-2xs text-fg-muted">{m.label}</div>
              <div className="text-xl font-semibold tabular text-fg">{formatNumber(m.value)}</div>
              <div className="text-2xs text-success">+{m.delta}% vs yesterday</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
