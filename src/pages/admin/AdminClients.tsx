import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { SelectCheckbox } from '@/components/ui/SelectCheckbox'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { cn } from '@/lib/utils'
import { CopyableName } from '@/components/ui/CopyableName'
import type { Client } from '@/types'

const PAGE_SIZE = 10

export default function AdminClients() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [plan, setPlan] = useState<'all' | Client['plan']>('all')
  const [page, setPage] = useState(1)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkNotice, setBulkNotice] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQ(search)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const { data, loading, error, reload } = useAsyncData(
    () => repo.getClients({ q, page, pageSize: PAGE_SIZE }),
    [q, page],
  )
  const { data: campaigns } = useAsyncData(() => repo.getCampaigns(), [])

  const clients = data?.items ?? []
  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const campaignCount = (clientId: string) => (campaigns ?? []).filter((c) => c.clientId === clientId).length

  const planFiltered = plan === 'all' ? clients : clients.filter((c) => c.plan === plan)
  const selection = useBulkSelection(planFiltered.map((c) => c.id))

  const runBulkDelete = async () => {
    const ids = planFiltered.filter((c) => selection.selected.has(c.id)).map((c) => c.id)
    if (ids.length === 0) return
    setBulkBusy(true)
    setBulkNotice('')
    try {
      const res = await repo.bulkDeleteClients(ids)
      setBulkNotice(
        res.failed ? `Deleted ${res.affected}, ${res.failed} failed` : `Deleted ${res.affected} client${res.affected === 1 ? '' : 's'}`,
      )
      selection.clear()
      setConfirmBulk(false)
      if (page > 1 && planFiltered.length === ids.length) setPage(page - 1)
      void reload()
    } catch (e) {
      setBulkNotice(`Bulk delete failed: ${e instanceof Error ? e.message : String(e)}`)
      setConfirmBulk(false)
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Clients" />}
          title="Clients"
          description="Client workspaces and their campaigns."
          actions={
            <Button variant="primary" leadingIcon={<Plus />} onClick={() => navigate('/admin/clients/new/settings')}>
              Add client
            </Button>
          }
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            aria-label="Search clients"
            placeholder="Search name, industry or contact email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full lg:max-w-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'starter', 'growth', 'enterprise'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlan(p)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                  plan === p ? 'border-line-strong bg-surface-3 text-fg' : 'border-line text-fg-muted hover:text-fg',
                )}
              >
                {p === 'all' ? 'All plans' : p}
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => void reload()} className="lg:ml-auto">
            Refresh
          </Button>
        </div>
        <BulkActionBar
          count={selection.count}
          noun="clients"
          onClear={selection.clear}
          onDelete={() => setConfirmBulk(true)}
          busy={bulkBusy}
        />
        {bulkNotice && <p aria-live="polite" className="text-xs text-fg-secondary">{bulkNotice}</p>}
        {loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : planFiltered.length === 0 ? (
          <EmptyState title="No clients found" description="Try a different search or filter, or add a client workspace." />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {planFiltered.map((client) => (
              <div
                key={client.id}
                className="surface group flex flex-col gap-3 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <SelectCheckbox
                      checked={selection.selected.has(client.id)}
                      onChange={() => selection.toggle(client.id)}
                      label={`Select ${client.name}`}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/clients/${client.id}`)}
                      className="interactive ring-focus shrink-0 rounded-md outline-none"
                      aria-label={`Open ${client.name}`}
                    >
                      <Avatar name={client.name} size="lg" className="rounded-md" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <CopyableName
                        name={client.name}
                        id={client.id}
                        compact
                        className="font-medium text-fg"
                        onCopied={setBulkNotice}
                      />
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/clients/${client.id}`)}
                        className="interactive block w-full truncate text-left text-xs text-fg-muted hover:text-fg"
                      >
                        {client.industry || 'No industry set'}
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Settings for ${client.name}`}
                      onClick={() => navigate(`/admin/clients/${client.id}/settings`)}
                    >
                      <Settings className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Per-client statistics + meta (kept from the M-0002 guardrail). */}
                <div className="grid grid-cols-3 gap-2 border-t border-line pt-3">
                  <div>
                    <div className="text-2xs uppercase tracking-wide text-fg-muted">Plan</div>
                    <div className="mt-0.5 text-sm capitalize text-fg">{client.plan}</div>
                  </div>
                  <div>
                    <div className="text-2xs uppercase tracking-wide text-fg-muted">Campaigns</div>
                    <div className="mt-0.5 text-sm font-semibold tabular text-fg">{campaignCount(client.id)}</div>
                  </div>
                  <div>
                    <div className="text-2xs uppercase tracking-wide text-fg-muted">Created</div>
                    <div className="mt-0.5 text-sm text-fg-muted">
                      {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>

                <p className="truncate text-xs text-fg-muted">
                  {client.primaryContact?.name
                    ? `${client.primaryContact.name}${client.primaryContact.email ? ` · ${client.primaryContact.email}` : ''}`
                    : client.primaryContact?.email || 'No primary contact'}
                </p>
              </div>
            ))}
          </div>
        )}
        {total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-fg-muted">{total} clients · Page {page} of {pages}</p>
            <div className="flex gap-2">
              <Button disabled={page <= 1} onClick={() => setPage(page - 1)} leadingIcon={<ChevronLeft />}>Previous</Button>
              <Button disabled={page >= pages} onClick={() => setPage(page + 1)} trailingIcon={<ChevronRight />}>Next</Button>
            </div>
          </div>
        )}
      </PageContainer>
      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        title={`Delete ${selection.count} selected client${selection.count === 1 ? '' : 's'}?`}
        body={`This permanently deletes ${selection.count} client workspace${selection.count === 1 ? '' : 's'} and their campaigns. This cannot be undone.`}
        busy={bulkBusy}
        onConfirm={runBulkDelete}
      />
    </PageTransition>
  )
}
