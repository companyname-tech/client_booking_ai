import { useMemo, useState } from 'react'
import { repo } from '@/data/repository'
import type { EnrichedLead, LeadHubFilters } from '@/types/leadIntelligence'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { LeadHubMetrics } from '@/components/leads/hub/LeadHubMetrics'
import { LeadHubFiltersBar, LeadHubTable } from '@/components/leads/hub/LeadHubTable'
import { LeadSegments, RecommendedLeads } from '@/components/leads/hub/LeadSegments'
import { LeadHubCharts, PriorityLeads } from '@/components/leads/hub/LeadHubCharts'
import { LeadPreviewDrawer } from '@/components/leads/hub/LeadPreviewDrawer'
import { LeadBulkActions, LeadExportButton } from '@/components/leads/hub/LeadBulkActions'

const DEFAULT_FILTERS: LeadHubFilters = { search: '', status: 'all', intent: 'all' }

export default function LeadHub() {
  const client = repo.getCurrentClient()
  const allLeads = useMemo(() => repo.getAllLeads(), [])
  const metrics = repo.getLeadHubMetrics()
  const stats = repo.getLeadHubStats(allLeads)
  const segments = repo.getLeadSegments()
  const campaigns = repo.getCampaigns().map((c) => ({ id: c.id, name: c.name }))

  const [filters, setFilters] = useState<LeadHubFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [segment, setSegment] = useState<string | undefined>()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<EnrichedLead | null>(null)
  const [toast, setToast] = useState('')

  const filtered = useMemo(
    () => repo.filterLeads(allLeads, { ...filters, segment }),
    [allLeads, filters, segment],
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    repo.toggleLeadSelection(id)
  }

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3000)
  }

  const onBulk = (action: string) => {
    if (action === 'qualified') {
      selected.forEach((id) => repo.setLeadStatus(id, 'interested'))
      notify(`${selected.size} leads marked as qualified.`)
    } else if (action === 'export') {
      notify('Lead export prepared.')
    } else if (action === 'archive') {
      notify(`${selected.size} leads archived (mock).`)
    } else if (action === 'tag') {
      selected.forEach((id) => repo.toggleLeadTag(id, 'Priority'))
      notify('Tag added to selected leads.')
    }
    setSelected(new Set())
    repo.clearLeadSelection()
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6 pb-8">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name={client.name} context="Lead Intelligence" />}
          title="Lead Intelligence"
          description="Every prospect, conversation and opportunity in one place."
          actions={<LeadExportButton onExport={() => notify('Lead export prepared.')} />}
        />

        {toast && (
          <div className="rounded-lg border border-success/20 bg-success-soft/10 px-4 py-3 text-sm text-success">{toast}</div>
        )}

        <LeadHubMetrics metrics={metrics} />

        <Reveal>
          <LeadSegments
            segments={segments}
            active={segment}
            onSelect={(id) => {
              setSegment(segment === id ? undefined : id)
              setPage(1)
            }}
          />
        </Reveal>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Reveal className="surface p-5 sm:p-6">
              <LeadHubFiltersBar
                filters={filters}
                onChange={(f) => { setFilters(f); setPage(1) }}
                campaigns={campaigns}
                total={filtered.length}
              />
            </Reveal>

            <LeadBulkActions count={selected.size} onAction={onBulk} onClear={() => { setSelected(new Set()); repo.clearLeadSelection() }} />

            <Reveal>
              <LeadHubTable
                leads={filtered}
                selected={selected}
                onToggle={toggle}
                onSelect={setPreview}
                page={page}
                onPageChange={setPage}
              />
            </Reveal>
          </div>

          <div className="space-y-4">
            <Reveal><RecommendedLeads leads={repo.getRecommendedLeads(3)} /></Reveal>
            <Reveal><PriorityLeads items={repo.getPriorityLeads(4)} /></Reveal>
          </div>
        </div>

        <Reveal><LeadHubCharts stats={stats} /></Reveal>

        <LeadPreviewDrawer lead={preview} open={!!preview} onClose={() => setPreview(null)} />
      </PageContainer>
    </PageTransition>
  )
}
