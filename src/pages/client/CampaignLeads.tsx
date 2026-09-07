import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { repo } from '@/data/repository'
import { useCampaignContext } from './campaignContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { LeadFilters, useLeadFilters } from '@/components/leads/LeadFilters'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { GenerateLeadsModal } from '@/components/leads/hub/GenerateLeadsModal'
import type { Lead } from '@/types'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignLeads() {
  const { campaign } = useCampaignContext()
  const { data: leads, loading, error, reload } = useAsyncData(() => repo.getLeads(campaign.id), [campaign.id])
  const { filters, setFilters, filtered } = useLeadFilters(leads ?? [])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [genOpen, setGenOpen] = useState(false)
  const { data: detail } = useAsyncData(
    () => (selected ? repo.getLead(campaign.id, selected.id) : Promise.resolve(null)),
    [campaign.id, selected],
  )

  if (loading) return <LoadingState rows={6} />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <Reveal className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-fg">Leads</h2>
          <Button variant="primary" size="sm" leadingIcon={<Sparkles className="size-3.5" />} onClick={() => setGenOpen(true)}>
            Generate leads
          </Button>
        </div>
        <LeadFilters value={filters} onChange={(v) => { setFilters(v); setPage(1) }} total={campaign.metrics.leadsFound} />
      </div>
      <LeadsTable leads={filtered} onSelect={setSelected} page={page} onPageChange={setPage} />
      <LeadDrawer lead={detail ?? null} open={!!selected} onClose={() => setSelected(null)} />

      <GenerateLeadsModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        campaigns={[{ id: campaign.id, name: campaign.name }]}
        fixedCampaignId={campaign.id}
        onGenerated={reload}
      />
    </Reveal>
  )
}
