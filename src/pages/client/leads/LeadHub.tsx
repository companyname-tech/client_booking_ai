import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { repo } from '@/data/repository'
import type { EnrichedLead, LeadHubFilters } from '@/types/leadIntelligence'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { LeadHubMetrics } from '@/components/leads/hub/LeadHubMetrics'
import { LeadHubFiltersBar, LeadHubTable } from '@/components/leads/hub/LeadHubTable'
import { LeadSegments, RecommendedLeads } from '@/components/leads/hub/LeadSegments'
import { LeadHubCharts, PriorityLeads } from '@/components/leads/hub/LeadHubCharts'
import { LeadPreviewDrawer } from '@/components/leads/hub/LeadPreviewDrawer'
import { LeadBulkActions, LeadExportButton } from '@/components/leads/hub/LeadBulkActions'
import { GenerateLeadsModal } from '@/components/leads/hub/GenerateLeadsModal'

const DEFAULT_FILTERS: LeadHubFilters = { search: '', status: 'all', intent: 'all' }

export default function LeadHub() {
  const clientData = useAsyncData(() => repo.getCurrentClient(), [])
  const allLeads = useAsyncData(() => repo.getAllLeads(), [])
  const metrics = useAsyncData(() => repo.getLeadHubMetrics(), [])
  const stats = useAsyncData(() => repo.getLeadHubStats(), [])
  const segments = useAsyncData(() => repo.getLeadSegments(), [])
  const campaigns = useAsyncData(async () => {
    const cs = await repo.getCampaigns()
    return cs.map((c) => ({ id: c.id, name: c.name }))
  }, [])
  const recommended = useAsyncData(() => repo.getRecommendedLeads(3), [])
  const priority = useAsyncData(() => repo.getPriorityLeads(4), [])

  const [filters, setFilters] = useState<LeadHubFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [segment, setSegment] = useState<string | undefined>()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<EnrichedLead | null>(null)
  const [toast, setToast] = useState('')
  const [genOpen, setGenOpen] = useState(false)

  const filtered = useAsyncData(
    () => repo.filterLeads(allLeads.data ?? [], { ...filters, segment }),
    [allLeads.data, filters, segment],
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

  const onBulk = async (action: string) => {
    if (action === 'qualified') {
      await Promise.all([...selected].map((id) => repo.setLeadStatus(id, 'interested')))
      notify(`${selected.size} leads marked as qualified.`)
    } else if (action === 'export') {
      notify('Lead export prepared.')
    } else if (action === 'archive') {
      notify(`${selected.size} leads archived.`)
    } else if (action === 'tag') {
      await Promise.all([...selected].map((id) => repo.toggleLeadTag(id, 'Priority')))
      notify('Tag added to selected leads.')
    }
    setSelected(new Set())
    repo.clearLeadSelection()
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6 pb-8">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name={clientData.data?.name ?? 'Workspace'} context="Lead Intelligence" />}
          title="Lead Intelligence"
          description="Every prospect, conversation and opportunity in one place."
          actions={
            <>
              <Button variant="primary" size="sm" leadingIcon={<Sparkles className="size-3.5" />} onClick={() => setGenOpen(true)}>
                Generate leads
              </Button>
              <LeadExportButton onExport={() => notify('Lead export prepared.')} />
            </>
          }
        />

        {toast && (
          <div className="rounded-lg border border-success/20 bg-success-soft/10 px-4 py-3 text-sm text-success">{toast}</div>
        )}

        {metrics.loading && !metrics.data ? (
          <LoadingState rows={4} />
        ) : metrics.error ? (
          <ErrorState message={metrics.error} onRetry={metrics.reload} />
        ) : metrics.data ? (
          <LeadHubMetrics metrics={metrics.data} />
        ) : null}

        <Reveal>
          {segments.loading && !segments.data ? (
            <LoadingState rows={3} />
          ) : segments.error ? (
            <ErrorState message={segments.error} onRetry={segments.reload} />
          ) : segments.data ? (
            <LeadSegments
              segments={segments.data}
              active={segment}
              onSelect={(id) => {
                setSegment(segment === id ? undefined : id)
                setPage(1)
              }}
            />
          ) : null}
        </Reveal>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <Reveal className="surface p-5 sm:p-6">
              {campaigns.loading && !campaigns.data ? (
                <LoadingState rows={2} />
              ) : campaigns.error ? (
                <ErrorState message={campaigns.error} onRetry={campaigns.reload} />
              ) : campaigns.data ? (
                <LeadHubFiltersBar
                  filters={filters}
                  onChange={(f) => { setFilters(f); setPage(1) }}
                  campaigns={campaigns.data}
                  total={filtered.data?.length ?? 0}
                />
              ) : null}
            </Reveal>

            <LeadBulkActions count={selected.size} onAction={onBulk} onClear={() => { setSelected(new Set()); repo.clearLeadSelection() }} />

            <Reveal>
              {allLeads.loading && !allLeads.data ? (
                <LoadingState rows={6} />
              ) : allLeads.error ? (
                <ErrorState message={allLeads.error} onRetry={allLeads.reload} />
              ) : filtered.loading && !filtered.data ? (
                <LoadingState rows={6} />
              ) : filtered.error ? (
                <ErrorState message={filtered.error} onRetry={filtered.reload} />
              ) : (
                <LeadHubTable
                  leads={filtered.data ?? []}
                  selected={selected}
                  onToggle={toggle}
                  onSelect={setPreview}
                  page={page}
                  onPageChange={setPage}
                />
              )}
            </Reveal>
          </div>

          <div className="space-y-4">
            <Reveal>
              {recommended.loading && !recommended.data ? (
                <LoadingState rows={3} />
              ) : recommended.error ? (
                <ErrorState message={recommended.error} onRetry={recommended.reload} />
              ) : recommended.data ? (
                <RecommendedLeads leads={recommended.data} />
              ) : null}
            </Reveal>
            <Reveal>
              {priority.loading && !priority.data ? (
                <LoadingState rows={4} />
              ) : priority.error ? (
                <ErrorState message={priority.error} onRetry={priority.reload} />
              ) : priority.data ? (
                <PriorityLeads items={priority.data} />
              ) : null}
            </Reveal>
          </div>
        </div>

        <Reveal>
          {stats.loading && !stats.data ? (
            <LoadingState rows={4} />
          ) : stats.error ? (
            <ErrorState message={stats.error} onRetry={stats.reload} />
          ) : stats.data ? (
            <LeadHubCharts stats={stats.data} />
          ) : null}
        </Reveal>

        <LeadPreviewDrawer lead={preview} open={!!preview} onClose={() => setPreview(null)} />

        <GenerateLeadsModal
          open={genOpen}
          onClose={() => setGenOpen(false)}
          campaigns={campaigns.data ?? []}
          onGenerated={allLeads.reload}
        />
      </PageContainer>
    </PageTransition>
  )
}
