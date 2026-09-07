import { useMemo, useState, type ChangeEvent } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Phone, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { repo } from '@/api/repository'
import type { AdminLead } from '@/types/admin'
import type { LeadStatus } from '@/types'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { SelectCheckbox } from '@/components/ui/SelectCheckbox'
import { Select } from '@/components/ui/Select'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LeadScore } from '@/components/leads/LeadScore'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { NOW } from '@/data/time'
import { formatRelativeCompact, initials } from '@/lib/utils'

type SortKey = 'campaign' | 'name' | 'industry' | 'status' | 'score' | 'lastActivity' | 'createdAt'
type SortDir = 'asc' | 'desc'

/** Order-preset options shown in the "Order" dropdown (name / created_at). */
const ORDER_OPTIONS = [
  { value: 'az', label: 'A → Z', sort: { key: 'name', dir: 'asc' } as const },
  { value: 'za', label: 'Z → A', sort: { key: 'name', dir: 'desc' } as const },
  { value: 'newest', label: 'Newest', sort: { key: 'createdAt', dir: 'desc' } as const },
  { value: 'oldest', label: 'Oldest', sort: { key: 'createdAt', dir: 'asc' } as const },
]

const PAGE_SIZE = 15

const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'queued',
  'contacted',
  'interested',
  'details_requested',
  'booked',
  'not_interested',
  'no_response',
  'do_not_contact',
  'unreachable',
]

function outcomeLabel(raw: string): string {
  if (!raw) return ''
  return raw
    .split('_')
    .filter(Boolean)
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ')
}

type LeadAction = 'analyze' | 'dial' | 'approve' | 'reject' | 'delete'

/** Map a raw BE verification_status to the lead-group primary-action tier. */
function leadGroup(verificationStatus: string): 'new' | 'rejected' | 'approved' {
  const v = (verificationStatus || '').toUpperCase()
  if (v === 'REJECTED' || v === 'FAILED') return 'rejected'
  if (v === 'APPROVED' || v === 'VERIFIED') return 'approved'
  return 'new'
}

function LeadRowActions({
  lead,
  busy,
  onAction,
  onView,
}: {
  lead: AdminLead
  busy: boolean
  onAction: (lead: AdminLead, action: LeadAction) => void
  onView: () => void
}) {
  const group = leadGroup(lead.verificationStatus)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {group === 'new' && (
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Search className="size-3" />}
          disabled={busy}
          onClick={() => onAction(lead, 'analyze')}
        >
          Analyze
        </Button>
      )}
      {group === 'rejected' && (
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<RefreshCw className="size-3" />}
          disabled={busy}
          onClick={() => onAction(lead, 'analyze')}
        >
          Recheck
        </Button>
      )}
      {group === 'approved' && (
        <Button variant="primary" size="sm" disabled={busy} onClick={() => onAction(lead, 'dial')}>
          Call
        </Button>
      )}
      {lead.phone && (
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<Phone className="size-3" />}
          disabled={busy}
          title="Dial this lead's phone (Twilio outbound)"
          onClick={() => onAction(lead, 'dial')}
        >
          Dial
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" disabled={busy} title="Approve" onClick={() => onAction(lead, 'approve')}>
        <Check className="size-3.5" />
      </Button>
      {group === 'rejected' ? (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          title="Delete permanently"
          onClick={() => onAction(lead, 'delete')}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon-sm" disabled={busy} title="Reject" onClick={() => onAction(lead, 'reject')}>
          <X className="size-3.5" />
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onView}>
        View
      </Button>
    </div>
  )
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
  onUpdate,
}: {
  lead: AdminLead | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    title: '',
    company: '',
    industry: '',
    email: '',
    phone: '',
    website: '',
    status: 'new' as LeadStatus,
  })

  if (!lead) return null

  const startEdit = () => {
    setForm({
      name: lead.name,
      title: lead.title ?? '',
      company: lead.company ?? '',
      industry: lead.industry ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      website: lead.website ?? '',
      status: lead.status,
    })
    setEditing(true)
  }

  const set = (k: 'name' | 'title' | 'company' | 'industry' | 'email' | 'phone' | 'website') =>
    (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      await repo.updateLead(lead.id, form)
      onUpdate?.()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent'

  if (editing) {
    return (
      <DetailDrawer
        open={open}
        onClose={onClose}
        title={lead.name}
        subtitle={lead.company ? `${lead.title} · ${lead.company}` : lead.title || undefined}
      >
        <form
          className="space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <div>
            <span className="text-xs text-fg-muted">Name</span>
            <input className={inputClass} value={form.name} onChange={set('name')} />
          </div>
          <div>
            <span className="text-xs text-fg-muted">Job title</span>
            <input className={inputClass} value={form.title} onChange={set('title')} />
          </div>
          <div>
            <span className="text-xs text-fg-muted">Company</span>
            <input className={inputClass} value={form.company} onChange={set('company')} />
          </div>
          <div>
            <span className="text-xs text-fg-muted">Industry</span>
            <input className={inputClass} value={form.industry} onChange={set('industry')} />
          </div>
          <div>
            <span className="text-xs text-fg-muted">Email</span>
            <input className={inputClass} value={form.email} onChange={set('email')} />
          </div>
          <div>
            <span className="text-xs text-fg-muted">Phone</span>
            <input className={inputClass} value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <span className="text-xs text-fg-muted">Website</span>
            <input className={inputClass} value={form.website} onChange={set('website')} />
          </div>
          <div>
            <span className="text-xs text-fg-muted">Status</span>
            <Select
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v as LeadStatus }))}
              ariaLabel="Lead status"
              placeholder="— Status —"
              options={LEAD_STATUSES.map((s) => ({ value: s, label: s.replaceAll('_', ' ') }))}
              className="w-full"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </DetailDrawer>
    )
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={lead.name}
      subtitle={lead.company ? `${lead.title} · ${lead.company}` : lead.title || undefined}
    >
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={startEdit}>
            Edit
          </Button>
        </div>
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
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' })
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<AdminLead | null>(null)
  const [adding, setAdding] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  const runAction = async (lead: AdminLead, action: LeadAction) => {
    setBusyId(lead.id)
    setActionMsg('')
    try {
      if (action === 'analyze') {
        await repo.verifyLead(lead.id)
        setActionMsg(`Verification queued for ${lead.name}`)
      } else if (action === 'dial') {
        if (!window.confirm(`Call ${lead.name} at ${lead.phone || 'their number'}? This places a real outbound call.`)) return
        const r = await repo.dialLead(lead.id, lead.offerCampaignId)
        setActionMsg(`Calling ${r.to || 'lead'}${r.callSid ? ` — SID ${r.callSid}` : ''}`)
      } else if (action === 'approve') {
        await repo.manualVerifyLead(lead.id, 'approve')
        setActionMsg(`Approved ${lead.name}`)
      } else if (action === 'reject') {
        await repo.manualVerifyLead(lead.id, 'reject')
        setActionMsg(`Rejected ${lead.name}`)
      } else if (action === 'delete') {
        if (!window.confirm(`Delete "${lead.name}"? This permanently removes the lead record.`)) return
        await repo.deleteLead(lead.id)
        setActionMsg(`Deleted ${lead.name}`)
      }
      reload()
    } catch (e) {
      setActionMsg(`${action} failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusyId(null)
    }
  }

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
        case 'createdAt':
          return (a.createdAt ?? '').localeCompare(b.createdAt ?? '') * dir
      }
    })
  }, [leads, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const selection = useBulkSelection(filtered.map((l) => l.id))

  const runBulkDelete = async () => {
    const ids = filtered.filter((l) => selection.selected.has(l.id)).map((l) => l.id)
    if (ids.length === 0) return
    setBulkBusy(true)
    try {
      const res = await repo.bulkDeleteLeads(ids)
      setActionMsg(`Deleted ${res.affected ?? ids.length} lead${ids.length === 1 ? '' : 's'}`)
      selection.clear()
      setConfirmBulk(false)
      setPage(1)
      reload()
    } catch (e) {
      setActionMsg(`Bulk delete failed: ${e instanceof Error ? e.message : String(e)}`)
      setConfirmBulk(false)
    } finally {
      setBulkBusy(false)
    }
  }

  const onSort = (key: SortKey) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
    setPage(1)
  }

  /** Active order-preset value for the dropdown, or '' while a column-header sort is active. */
  const orderValue = ORDER_OPTIONS.find((o) => o.sort.key === sort.key && o.sort.dir === sort.dir)?.value ?? ''

  const onOrderChange = (v: string) => {
    const preset = ORDER_OPTIONS.find((o) => o.value === v)
    if (!preset) return
    setSort({ ...preset.sort })
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
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
          <Select
            ariaLabel="Order leads"
            value={orderValue}
            onChange={onOrderChange}
            placeholder="Order…"
            options={ORDER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            className="w-full shrink-0 sm:w-40"
          />
          <Button variant="primary" size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={() => setAdding(true)}>
            Add lead
          </Button>
        </div>

        <BulkActionBar
          count={selection.count}
          noun="leads"
          onClear={selection.clear}
          onDelete={() => setConfirmBulk(true)}
          busy={bulkBusy}
        />

        {loading ? (
          <LoadingState rows={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No leads found" description="Try adjusting your search." />
        ) : (
          <>
            <p className="text-xs text-fg-muted">{filtered.length} leads</p>
            {actionMsg && (
              <p aria-live="polite" className="text-xs text-fg-secondary">
                {actionMsg}
              </p>
            )}

            <div className="surface overflow-hidden">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-2xs text-fg-muted">
                      <th className="w-10 px-3 py-2.5">
                        <SelectCheckbox
                          checked={selection.allChecked}
                          indeterminate={selection.someChecked}
                          onChange={selection.toggleAll}
                          label="Select all leads"
                        />
                      </th>
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
                        <td className="px-3 py-3">
                          <SelectCheckbox
                            checked={selection.selected.has(lead.id)}
                            onChange={() => selection.toggle(lead.id)}
                            label={`Select ${lead.name}`}
                          />
                        </td>
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
                          <LeadRowActions lead={lead} busy={busyId === lead.id} onAction={runAction} onView={() => setPreview(lead)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 p-3 md:hidden">
                <div className="flex items-center gap-2 px-1">
                  <SelectCheckbox
                    checked={selection.allChecked}
                    indeterminate={selection.someChecked}
                    onChange={selection.toggleAll}
                    label="Select all leads"
                  />
                  <span className="text-2xs text-fg-muted">Select all</span>
                </div>
                {slice.map((lead) => (
                  <div key={lead.id} className="rounded-md border border-line bg-surface-1 p-3">
                    <div className="mb-2">
                      <SelectCheckbox
                        checked={selection.selected.has(lead.id)}
                        onChange={() => selection.toggle(lead.id)}
                        label={`Select ${lead.name}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreview(lead)}
                      className="interactive w-full text-left"
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
                    <div className="mt-2 border-t border-line pt-2">
                      <LeadRowActions lead={lead} busy={busyId === lead.id} onAction={runAction} onView={() => setPreview(lead)} />
                    </div>
                  </div>
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

        <AddLeadModal open={adding} onClose={() => setAdding(false)} onAdded={reload} />
        <LeadExtraDrawer lead={preview} open={!!preview} onClose={() => setPreview(null)} onUpdate={reload} />
        <ConfirmDialog
          open={confirmBulk}
          onClose={() => setConfirmBulk(false)}
          title={`Delete ${selection.count} selected lead${selection.count === 1 ? '' : 's'}?`}
          body={`This permanently deletes ${selection.count} lead record${selection.count === 1 ? '' : 's'} from the platform-wide inventory. This cannot be undone.`}
          busy={bulkBusy}
          onConfirm={runBulkDelete}
        />
      </PageContainer>
    </PageTransition>
  )
}
