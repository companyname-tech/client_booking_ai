import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Reveal } from '@/components/motion/Reveal'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

export default function AdminClients() {
  const { data, loading, error, reload } = useAsyncData(() =>
    Promise.all([repo.getClients(), repo.getCampaigns()]),
  )
  const clients = data?.[0] ?? []
  const campaigns = data?.[1] ?? []

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader eyebrow={<WorkspaceEyebrow name="Super Admin" context="Clients" />} title="Clients" description="All workspaces on the platform." />
        {loading ? (
          <LoadingState rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : clients.length === 0 ? (
          <EmptyState title="No clients yet" description="Workspaces will appear here once they are onboarded." />
        ) : (
          <Reveal>
            <div className="surface overflow-hidden">
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-b border-line text-left text-2xs text-fg-muted">
                    <th className="px-5 py-2.5">Client</th>
                    <th className="px-3 py-2.5">Campaigns</th>
                    <th className="px-3 py-2.5">Active</th>
                    <th className="px-3 py-2.5">Bookings</th>
                    <th className="px-3 py-2.5">Plan</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const clientCampaigns = campaigns.filter((c) => c.clientId === client.id)
                    const active = clientCampaigns.filter((c) => c.status === 'active').length
                    const bookings = clientCampaigns.reduce((s, c) => s + c.metrics.bookings, 0)
                    return (
                      <tr key={client.id} className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={client.name} size="md" className="rounded-md" />
                            <div>
                              <div className="font-medium text-fg">{client.name}</div>
                              <div className="text-xs text-fg-muted">{client.industry}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 tabular">{clientCampaigns.length}</td>
                        <td className="px-3 py-3 tabular">{active}</td>
                        <td className="px-3 py-3 tabular">{bookings}</td>
                        <td className="px-3 py-3 capitalize">{client.plan}</td>
                        <td className="px-5 py-3">
                          <Link to={`/admin/clients/${client.id}`} className="text-xs font-medium text-accent">View →</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="space-y-2 p-3 md:hidden">
                {clients.map((client) => (
                  <Link key={client.id} to={`/admin/clients/${client.id}`} className="flex items-center gap-3 rounded-md border border-line p-3">
                    <Avatar name={client.name} size="md" className="rounded-md" />
                    <div>
                      <div className="font-medium text-fg">{client.name}</div>
                      <div className="text-xs text-fg-muted">{client.industry}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </PageContainer>
    </PageTransition>
  )
}
