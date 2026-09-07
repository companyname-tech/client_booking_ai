import { useState } from 'react'
import { repo } from '@/data/repository'
import { useCampaignContext } from './campaignContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { CallFilters, useCallFilters } from '@/components/calls/CallFilters'
import { CallsTable } from '@/components/calls/CallsTable'
import { CallDrawer } from '@/components/calls/CallDrawer'
import type { Call } from '@/types'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignCalls() {
  const { campaign } = useCampaignContext()
  const { data: calls, loading, error, reload } = useAsyncData(() => repo.getCalls(campaign.id), [campaign.id])
  const { data: leads } = useAsyncData(() => repo.getLeads(campaign.id), [campaign.id])
  const { filters, setFilters, filtered, summary } = useCallFilters(calls ?? [])
  const [selected, setSelected] = useState<Call | null>(null)
  const { data: detail } = useAsyncData(
    () => (selected ? repo.getCall(campaign.id, selected.id) : Promise.resolve(null)),
    [campaign.id, selected],
  )
  const lead = selected ? leads?.find((l) => l.id === selected.leadId) : undefined

  if (loading) return <LoadingState rows={6} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <Reveal className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-fg">Calls</h2>
        <p className="mt-1 text-sm text-fg-muted">{summary.total} calls completed</p>
      </div>
      <CallFilters value={filters} onChange={setFilters} summary={summary} />
      <CallsTable calls={filtered} leads={leads ?? []} onSelect={setSelected} />
      <CallDrawer call={detail ?? null} lead={lead} open={!!selected} onClose={() => setSelected(null)} />
    </Reveal>
  )
}
