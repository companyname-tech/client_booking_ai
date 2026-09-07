import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { CampaignTable } from '@/components/campaigns/CampaignTable'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'

const FILTERS = ['All', 'Awaiting Review', 'Training', 'Live', 'Paused', 'Completed', 'Rejected'] as const

export default function AdminCampaigns() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('All')
  const { data, loading, error, reload } = useAsyncData(() =>
    Promise.all([repo.getCampaigns(), repo.getAllAdminMeta()]),
  )
  const campaigns = data?.[0] ?? []
  const metas = data?.[1] ?? []

  const filtered = useMemo(() => {
    let list = campaigns
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
    }
    if (filter !== 'All') {
      list = list.filter((c) => {
        const m = metas.find((x) => x.offerCampaignId === c.id)
        if (filter === 'Awaiting Review') return ['awaiting_approval', 'preparing'].includes(c.status) || m?.workflowStatus === 'awaiting_approval'
        if (filter === 'Training') return c.status === 'ai_training'
        if (filter === 'Live') return c.status === 'active'
        if (filter === 'Paused') return c.status === 'paused'
        if (filter === 'Completed') return c.status === 'completed'
        if (filter === 'Rejected') return c.status === 'rejected'
        return true
      })
    }
    return list
  }, [campaigns, metas, search, filter])

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader eyebrow={<WorkspaceEyebrow name="Super Admin" context="Campaigns" />} title="All campaigns" description="Cross-client campaign operations." />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaign, client, ID…" className="sm:max-w-xs" />
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', filter === f ? 'border-line-strong bg-surface-3 text-fg' : 'border-line text-fg-muted')}>
                {f}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <LoadingState rows={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <Reveal>
            <CampaignTable campaigns={filtered} zone="admin" />
          </Reveal>
        )}
        <p className="text-xs text-fg-muted">
          <Link to="/admin/approvals" className="text-accent">Open approval queue →</Link>
        </p>
      </PageContainer>
    </PageTransition>
  )
}
