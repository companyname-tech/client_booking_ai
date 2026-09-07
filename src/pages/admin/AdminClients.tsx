import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { ClientFormModal } from '@/components/admin/ClientFormModal'
import type { Client } from '@/types'

const PAGE_SIZE = 10

export default function AdminClients() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null })
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

  const selection = useBulkSelection(clients.map((c) => c.id))

  const runBulkDelete = async () => {
    const ids = clients.filter((c) => selection.selected.has(c.id)).map((c) => c.id)
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
      if (page > 1 && clients.length === ids.length) setPage(page - 1)
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
            <Button variant="primary" leadingIcon={<Plus />} onClick={() => setModal({ open: true, client: null })}>
              Add client
            </Button>
          }
        />
        <div className="flex items-center gap-3">
          <Input
            aria-label="Search clients"
            placeholder="Search name, industry or contact email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="ghost" onClick={reload}>Refresh</Button>
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
        ) : clients.length === 0 ? (
          <EmptyState title="No clients found" description="Try a different search, or add a client workspace." />
        ) : (
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-2xs text-fg-muted">
                    <th className="w-10 px-3 py-2.5">
                      <SelectCheckbox
                        checked={selection.allChecked}
                        indeterminate={selection.someChecked}
                        onChange={selection.toggleAll}
                        label="Select all clients on this page"
                      />
                    </th>
                    <th className="px-5 py-2.5">Client</th>
                    <th className="px-3 py-2.5">Contact</th>
                    <th className="px-3 py-2.5">Plan</th>
                    <th className="px-3 py-2.5">Campaigns</th>
                    <th className="px-3 py-2.5">Created</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="interactive cursor-pointer border-b border-line last:border-0 hover:bg-white/[0.03]"
                      onClick={() => setModal({ open: true, client })}
                    >
                      <td className="px-3 py-3">
                        <SelectCheckbox
                          checked={selection.selected.has(client.id)}
                          onChange={() => selection.toggle(client.id)}
                          label={`Select ${client.name}`}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={client.name} size="md" className="rounded-md" />
                          <div>
                            <div className="font-medium text-fg">{client.name}</div>
                            <div className="text-xs text-fg-muted">{client.industry || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-fg-secondary">
                        {client.primaryContact?.name || '—'}{' '}
                        {client.primaryContact?.email ? `· ${client.primaryContact.email}` : ''}
                      </td>
                      <td className="px-3 py-3 capitalize text-fg-secondary">{client.plan}</td>
                      <td className="px-3 py-3 tabular text-fg-secondary">{campaignCount(client.id)}</td>
                      <td className="px-3 py-3 text-fg-muted">
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/admin/clients/${client.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-medium text-accent"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
      <ClientFormModal
        open={modal.open}
        client={modal.client}
        onClose={() => setModal({ open: false, client: null })}
        onSaved={reload}
      />
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
