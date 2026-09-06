import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { NOW } from '@/data/time'
import { formatRelativeCompact } from '@/lib/utils'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { CampaignStatus } from '@/components/campaigns/CampaignStatus'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'

const FILTERS = ['All', 'Awaiting Review', 'Training', 'Approved', 'Live', 'Paused', 'Completed', 'Rejected'] as const

export default function AdminApprovals() {
  const campaigns = repo.getCampaigns()
  const clients = repo.getClients()
  const metas = repo.getAllAdminMeta()
  const [filter, setFilter] = useState<string>('All')

  const rows = useMemo(() => {
    return metas
      .map((m) => {
        const campaign = campaigns.find((c) => c.id === m.campaignId)
        const client = clients.find((c) => c.id === campaign?.clientId)
        return { m, campaign, client }
      })
      .filter((r) => r.campaign)
      .filter((r) => {
        if (filter === 'All') return true
        if (filter === 'Awaiting Review') return ['awaiting_approval', 'submitted'].includes(r.m.workflowStatus)
        if (filter === 'Training') return r.m.workflowStatus === 'training'
        if (filter === 'Approved') return ['approved', 'launching'].includes(r.m.workflowStatus)
        if (filter === 'Live') return r.m.workflowStatus === 'live'
        if (filter === 'Paused') return r.campaign?.status === 'paused'
        if (filter === 'Completed') return r.campaign?.status === 'completed'
        if (filter === 'Rejected') return r.m.workflowStatus === 'rejected'
        return true
      })
  }, [metas, campaigns, clients, filter])

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader eyebrow={<WorkspaceEyebrow name="Super Admin" context="Approvals" />} title="Campaign review queue" description="Review and approve client-submitted campaigns." />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', filter === f ? 'border-line-strong bg-surface-3 text-fg' : 'border-line text-fg-muted')}>
              {f}
            </button>
          ))}
        </div>
        <Reveal>
          <div className="surface overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-2xs text-fg-muted">
                    <th className="px-5 py-2.5">Campaign</th>
                    <th className="px-3 py-2.5">Client</th>
                    <th className="px-3 py-2.5">Submitted</th>
                    <th className="px-3 py-2.5">AI Readiness</th>
                    <th className="px-3 py-2.5">Risk</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ m, campaign, client }) => (
                    <tr key={m.campaignId} className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3 font-medium text-fg">{campaign!.name}</td>
                      <td className="px-3 py-3 text-fg-secondary">{client?.name}</td>
                      <td className="px-3 py-3 text-xs tabular text-fg-muted">{formatRelativeCompact(m.submittedAt, NOW)}</td>
                      <td className="px-3 py-3 tabular text-violet">{m.aiReadiness}%</td>
                      <td className="px-3 py-3 capitalize text-fg-muted">{m.riskLevel}</td>
                      <td className="px-3 py-3"><CampaignStatus status={campaign!.status} size="sm" /></td>
                      <td className="px-5 py-3">
                        <Link to={`/admin/campaigns/${m.campaignId}/review`} className="text-xs font-medium text-accent hover:text-fg">Review →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 p-3 md:hidden">
              {rows.map(({ m, campaign, client }) => (
                <Link key={m.campaignId} to={`/admin/campaigns/${m.campaignId}/review`} className="block rounded-md border border-line bg-surface-1 p-3">
                  <div className="font-medium text-fg">{campaign!.name}</div>
                  <div className="text-xs text-fg-muted">{client?.name} · {m.aiReadiness}% ready</div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </PageContainer>
    </PageTransition>
  )
}
