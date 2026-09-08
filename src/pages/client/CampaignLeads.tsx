import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Sparkles, Upload } from 'lucide-react'
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
import { ImportLeadsModal } from '@/components/leads/hub/ImportLeadsModal'
import type { Lead } from '@/types'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/motion/Reveal'

export default function CampaignLeads() {
  const { campaign } = useCampaignContext()
  const { data: leads, loading, error, reload } = useAsyncData(() => repo.getLeads(campaign.id), [campaign.id])
  const refreshLeads = useCallback(() => reload({ silent: true }), [reload])
  const genCampaigns = useMemo(
    () => [{ id: campaign.id, name: campaign.name, leadGen: campaign.leadGen }],
    [campaign.id, campaign.name, campaign.leadGen],
  )
  const { filters, setFilters, filtered, counts } = useLeadFilters(leads ?? [])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null)
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

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
  // A drawer save must refresh the list too — otherwise the edited lead stays
  // stale in the table until the page reloads (same pattern as add/generate/import).
  const handleDrawerUpdated = () => {
    closeDetail()
    refreshLeads()
  }

  const verifyLead = async (lead: Lead, action: 'approve' | 'reject') => {
    setBusyLeadId(lead.id)
    setToast({ text: action === 'approve' ? `Approved ${lead.name}` : `Rejected ${lead.name}` })
    try {
      await repo.manualVerifyLead(lead.id, action)
      refreshLeads()
    } catch (e) {
      setToast({
        text: e instanceof Error ? `${action} failed: ${e.message}` : `${action} failed`,
        isError: true,
      })
    } finally {
      setBusyLeadId(null)
    }
  }

  const dialLead = async (lead: Lead) => {
    setToast({ text: `Calling to ${lead.name}` })
    try {
      await repo.dialLead(lead.id, campaign.id)
    } catch (e) {
      setToast({
        text: e instanceof Error ? `Call failed: ${e.message}` : 'Call failed',
        isError: true,
      })
    }
  }
  const { data: detail } = useAsyncData(
    () => (selected ? repo.getLead(campaign.id, selected.id) : Promise.resolve(null)),
    [campaign.id, selected],
  )

  const body = loading ? (
    <LoadingState rows={6} />
  ) : error ? (
    <ErrorState message={error} onRetry={reload} />
  ) : (
    <Reveal className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-fg">Leads</h2>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leadingIcon={<Upload className="size-3.5" />} onClick={() => setImportOpen(true)}>
              Upload CSV
            </Button>
            <Button variant="secondary" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={() => setAddOpen(true)}>
              Add lead
            </Button>
            <Button variant="primary" size="sm" leadingIcon={<Sparkles className="size-3.5" />} onClick={() => setGenOpen(true)}>
              Generate leads
            </Button>
          </div>
        </div>
        <LeadFilters
          value={filters}
          onChange={(v) => { setFilters(v); setPage(1) }}
          total={filtered.length}
          counts={counts}
        />
      </div>
      <LeadsTable
        leads={filtered}
        onSelect={openView}
        onDial={dialLead}
        onEdit={openEdit}
        onApprove={(lead) => void verifyLead(lead, 'approve')}
        onReject={(lead) => void verifyLead(lead, 'reject')}
        busyLeadId={busyLeadId}
        page={page}
        onPageChange={setPage}
      />
    </Reveal>
  )

  return (
    <>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-5 right-5 z-50 rounded-md border bg-surface-2 px-4 py-2.5 text-sm shadow-2',
            toast.isError ? 'border-danger text-danger' : 'border-accent/40 text-fg',
          )}
        >
          {toast.text}
        </div>
      )}
      {body}
      <LeadDrawer lead={detail ?? null} open={!!selected} onClose={closeDetail} startInEdit={editMode} onUpdate={handleDrawerUpdated} />
      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={refreshLeads}
        fixedOfferId={campaign.id}
        fixedCampaignName={campaign.name}
      />
      <GenerateLeadsModal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        campaigns={genCampaigns}
        fixedCampaignId={campaign.id}
        leadGenDefaults={campaign.leadGen}
        onGenerated={refreshLeads}
      />
      <ImportLeadsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        campaigns={[{ id: campaign.id, name: campaign.name }]}
        fixedCampaignId={campaign.id}
        onImported={refreshLeads}
      />
    </>
  )
}
