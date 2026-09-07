import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { repo } from '@/api/repository'
import type { AdminLead } from '@/types/admin'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LeadScore } from '@/components/leads/LeadScore'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import { NOW } from '@/data/time'
import { formatRelativeCompact, initials } from '@/lib/utils'

type SortKey = 'campaign' | 'name' | 'industry' | 'status' | 'score' | 'lastActivity'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 15

function outcomeLabel(raw: string): string {
  if (!raw) return ''
  return raw
    .split('_')
    .filter(Boolean)
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ')
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th className="px-3 py-2.5 font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
        className="inline-flex items-center gap-1 text-2xs font-medium text-fg-muted transition-colors hover:text-fg"
      >
        {label}
        {active ? (
          dir === 'asc' ? (
            <ArrowUp className="size-3 text-accent" />
          ) : (
            <ArrowDown className="size-3 text-accent" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </button>
    </th>
  )
}

function LeadExtraDrawer({
  lead,
  open,
  onClose,
}: {
  lead: AdminLead | null
  open: boolean
  onClose: () => void
}) {
  if (!lead) return null
  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={lead.name}
      subtitle={lead.company ? `${lead.title} · ${lead.company}` : lead.title || undefined}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <LeadStatusBadge status={lead.status} />
          {lead.verificationStatus && lead.verificationStatus !== 'UNVERIFIED' && (
            <StatusBadge tone="info">{outcomeLabel(lead.verificationStatus) || lead.verificationStatus}</StatusBadge>
          )}
        </div>
        <LeadScore score={lead.score} />

        <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-fg-muted">Campaign</dt>
            <dd className="mt-0.5 text-fg">{lead.campaignName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">Industry</dt>
            <dd className="mt-0.5 text-fg">{lead.industry || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">Email</dt>
            <dd className="mt-0.5 break-all text-fg">{lead.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">Phone</dt>
            <dd className="mt-0.5 text-fg">{lead.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">Website</dt>
            <dd className="mt-0.5 truncate text-fg">
              {lead.website ? (
                <a href={lead.website} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  {lead.website}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">Last call outcome</dt>
            <dd className="mt-0.5 text-fg">{outcomeLabel(lead.lastCallOutcome) || '—'}</dd>
          </div>
          {lead.meetingLink && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-fg-muted">Meeting link</dt>
              <dd className="mt-0.5 truncate">
                <a href={lead.meetingLink} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  {lead.meetingLink}
                </a>
              </dd>
            </div>
          )}
          {lead.lastCallSummary && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-fg-muted">Last call summary</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-fg">{lead.lastCallSummary}</dd>
            </div>
          )}
          {lead.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-fg-muted">Notes</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-fg">{lead.notes}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-xs text-fg-muted">Created</dt>
            <dd className="mt-0.5 text-fg">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-fg-muted">Lead ID</dt>
            <dd className="mt-0.5 font-mono text-2xs text-fg-muted">{lead.id}</dd>
          </div>
        </dl>
      </div>
    </DetailDrawer>
  )
}

export default function AdminLeads() {
  const { data: leads, loading, error, reload } = useAsyncData(() => repo.getAdminLeads(), [])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'lastActivity', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<AdminLead | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = leads ?? []
    if (q) {
      rows = rows.filter((l) =>
        [l.name, l.company, l.title, l.email, l.phone, l.industry, l.campaignName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      switch (sort.key) {
        case 'campaign':
          return a.campaignName.localeCompare(b.campaignName) * dir
        case 'name':
          return a.name.localeCompare(b.name) * dir
        case 'industry':
          return (a.industry ?? '').localeCompare(b.industry ?? '') * dir
        case 'status':
          return a.status.localeCompare(b.status) * dir
        case 'score':
          return (a.score - b.score) * dir
        case 'lastActivity':
          return (a.lastContactAt ?? '').localeCompare(b.lastContactAt ?? '') * dir
      }
    })
  }, [leads, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const onSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
    setPage(1)
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Leads" />}
          title="Leads"
          description="Platform-wide lead inventory — every lead across every campaign."
        />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search lead, company, campaign, email, phone…"
            className="pl-9"
            aria-label="Search leads"
          />
        </div>

        {loading ? (
          <LoadingState rows={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No leads found" description="Try adjusting your search." />
        ) : (
          <>
            <p className="text-xs text-fg-muted">{filtered.length} leads</p>

            <div className="surface overflow-hidden">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-2xs text-fg-muted">
                      <SortHeader label="Campaign" sortKey="campaign" current={sort.key} dir={sort.dir} onSort={onSort} />
                      <SortHeader label="Lead" sortKey="name" current={sort.key} dir={sort.dir} onSort={onSort} />
                      <th className="px-3 py-2.5 font-medium">Contact</th>
                      <SortHeader label="Industry" sortKey="industry" current={sort.key} dir={sort.dir} onSort={onSort} />
                      <SortHeader label="Status" sortKey="status" current={sort.key} dir={sort.dir} onSort={onSort} />
                      <SortHeader label="Score" sortKey="score" current={sort.key} dir={sort.dir} onSort={onSort} />
                      <SortHeader label="Last activity" sortKey="lastActivity" current={sort.key} dir={sort.dir} onSort={onSort} />
                      <th className="px-4 py-2.5 font-medium">Extra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map((lead) => (
                      <tr key={lead.id} className="interactive border-b border-line last:border-0 hover:bg-white/[0.02]">
                        <td className="max-w-[160px] truncate px-3 py-3 text-fg-secondary">{lead.campaignName || '—'}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-2xs font-semibold text-fg-secondary">
                              {initials(lead.name)}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-medium text-fg">{lead.name}</div>
                              <div className="truncate text-xs text-fg-muted">{lead.company || lead.title || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="space-y-0.5 text-xs">
                            <div className="break-all text-fg-secondary">{lead.email || '—'}</div>
                            <div className="text-fg-muted">{lead.phone || ''}</div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-fg-secondary">{lead.industry || '—'}</td>
                        <td className="px-3 py-3">
                          <LeadStatusBadge status={lead.status} size="sm" />
                        </td>
                        <td className="px-3 py-3">
                          <LeadScore score={lead.score} compact />
                        </td>
                        <td className="px-3 py-3 text-xs tabular text-fg-muted">
                          {lead.lastContactAt ? formatRelativeCompact(lead.lastContactAt, NOW) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => setPreview(lead)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 p-3 md:hidden">
                {slice.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setPreview(lead)}
                    className="interactive w-full rounded-md border border-line bg-surface-1 p-3 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-fg">{lead.name}</div>
                        <div className="truncate text-xs text-fg-muted">
                          {lead.campaignName ? `${lead.campaignName} · ` : ''}
                          {lead.company || lead.title || '—'}
                        </div>
                      </div>
                      <LeadScore score={lead.score} compact />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <LeadStatusBadge status={lead.status} size="sm" />
                      <span className="text-2xs text-fg-muted">
                        {lead.lastContactAt ? formatRelativeCompact(lead.lastContactAt, NOW) : 'No activity'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-line px-5 py-3">
                  <Button variant="ghost" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                    Previous
                  </Button>
                  <span className="text-xs tabular text-fg-muted">
                    Page {safePage} of {totalPages}
                  </span>
                  <Button variant="ghost" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        <LeadExtraDrawer lead={preview} open={!!preview} onClose={() => setPreview(null)} />
      </PageContainer>
    </PageTransition>
  )
}
