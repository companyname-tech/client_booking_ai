import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { repo } from '@/data/repository'
import { useCampaignContext } from './campaignContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { LeadFilters, useLeadFilters } from '@/components/leads/LeadFilters'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { LeadDrawer } from '@/components/leads/LeadDrawer'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { GenerateLeadsModal } from '@/components/leads/hub/GenerateLeadsModal'
import type { Lead } from '@/types'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignLeads() {
  const { campaign } = useCampaignContext()
  const { data: leads, loading, error, reload } = useAsyncData(() => repo.getLeads(campaign.id), [campaign.id])
  const { filters, setFilters, filtered } = useLeadFilters(leads ?? [])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [dialMsg, setDialMsg] = useState('')

  const openView = (lead: Lead) => {
    setEditMode(false)
    setSelected(lead)
  }
  const openEdit = (lead: Lead) => {
    setEditMode(true)
    setSelected(lead)
  }
  const closeDetail = () => {
    setSelected(null)
    setEditMode(false)
  }

  const dialLead = async (lead: Lead) => {
    setDialMsg('')
    try {
      const r = await repo.dialLead(lead.id, campaign.id)
      setDialMsg(`Calling ${lead.name}${r.callSid ? ` — call ${r.callSid}` : ''}…`)
    } catch (e) {
      setDialMsg(e instanceof Error ? `Call failed: ${e.message}` : 'Call failed')
    }
  }
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
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={() => setAddOpen(true)}>
              Add lead
            </Button>
            <Button variant="primary" size="sm" leadingIcon={<Sparkles className="size-3.5" />} onClick={() => setGenOpen(true)}>
              Generate leads
            </Button>
          </div>
        </div>
        <LeadFilters value={filters} onChange={(v) => { setFilters(v); setPage(1) }} total={campaign.metrics.leadsFound} />
      </div>
      <LeadsTable
        leads={filtered}
        onSelect={openView}
        onDial={dialLead}
        onEdit={openEdit}
        page={page}
        onPageChange={setPage}
      />
      {dialMsg && <p aria-live="polite" className="text-xs text-fg-secondary">{dialMsg}</p>}
      <LeadDrawer lead={detail ?? null} open={!!selected} onClose={closeDetail} startInEdit={editMode} onUpdate={closeDetail} />

      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={reload}
        fixedOfferId={campaign.id}
        fixedCampaignName={campaign.name}
      />

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
