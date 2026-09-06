import { useState } from 'react'
import { repo } from '@/data/repository'
import { useCampaignContext } from './campaignContext'
import { CallFilters, useCallFilters } from '@/components/calls/CallFilters'
import { CallsTable } from '@/components/calls/CallsTable'
import { CallDrawer } from '@/components/calls/CallDrawer'
import type { Call } from '@/types'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignCalls() {
  const { campaign } = useCampaignContext()
  const calls = repo.getCalls(campaign.id)
  const leads = repo.getLeads(campaign.id)
  const { filters, setFilters, filtered, summary } = useCallFilters(calls)
  const [selected, setSelected] = useState<Call | null>(null)
  const detail = selected ? repo.getCall(campaign.id, selected.id) : null
  const lead = selected ? leads.find((l) => l.id === selected.leadId) : undefined

  return (
    <Reveal className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-fg">Calls</h2>
        <p className="mt-1 text-sm text-fg-muted">{summary.total} calls completed</p>
      </div>
      <CallFilters value={filters} onChange={setFilters} summary={summary} />
      <CallsTable calls={filtered} leads={leads} onSelect={setSelected} />
      <CallDrawer call={detail ?? null} lead={lead} open={!!selected} onClose={() => setSelected(null)} />
    </Reveal>
  )
}
