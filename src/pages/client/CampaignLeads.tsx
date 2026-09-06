import { useState } from 'react'
import { repo } from '@/data/repository'
import { useCampaignContext } from './campaignContext'
import { LeadFilters, useLeadFilters } from '@/components/leads/LeadFilters'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import type { Lead } from '@/types'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignLeads() {
  const { campaign } = useCampaignContext()
  const leads = repo.getLeads(campaign.id)
  const { filters, setFilters, filtered } = useLeadFilters(leads)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Lead | null>(null)
  const detail = selected ? repo.getLead(campaign.id, selected.id) : null

  return (
    <Reveal className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-fg">Leads</h2>
        <LeadFilters value={filters} onChange={(v) => { setFilters(v); setPage(1) }} total={campaign.metrics.leadsFound} />
      </div>
      <LeadsTable leads={filtered} onSelect={setSelected} page={page} onPageChange={setPage} />
      <LeadDrawer lead={detail ?? null} open={!!selected} onClose={() => setSelected(null)} />
    </Reveal>
  )
}
