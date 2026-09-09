import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Ban, Mail, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { repo } from '@/api/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneField } from '@/components/ui/fields/PhoneField'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import type { DoNotContactEntry, DoNotContactKind } from '@/types/doNotContact'

const PAGE_SIZE = 20

const KIND_OPTIONS: DoNotContactKind[] = ['phone', 'email']

function KindBadge({ kind }: { kind: DoNotContactKind }) {
  const isPhone = kind === 'phone'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium capitalize',
        isPhone
          ? 'border-accent/25 bg-accent-soft/40 text-accent'
          : 'border-violet/25 bg-violet-soft/40 text-violet',
      )}
    >
      {isPhone ? <Phone className="size-3" /> : <Mail className="size-3" />}
      {kind}
    </span>
  )
}

function valueLooksValid(kind: DoNotContactKind, raw: string): boolean {
  const v = raw.trim()
  if (kind === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  // Dialed number with a country code — digits, leading + and separators.
  return /^\+?[0-9][0-9\s().-]{6,}$/.test(v)
}

export default function AdminDoNotContact() {
  const [kind, setKind] = useState<DoNotContactKind>('phone')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // Debounce the server-side search (list can grow; search runs on the BE).
  const searchTimer = useRef<number | null>(null)
  useEffect(() => () => {
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current)
  }, [])
  const onSearchChange = (raw: string) => {
    setSearchInput(raw)
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      const q = raw.trim()
      setPage(1)
      setQuery(q)
    }, 300)
  }

  const { data, loading, error, reload } = useAsyncData(
    () => repo.getDoNotContactPage({ search: query, page, pageSize: PAGE_SIZE }),
    [query, page],
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const [confirmRemove, setConfirmRemove] = useState<DoNotContactEntry | null>(null)
  const [removing, setRemoving] = useState(false)

  const resetForm = () => {
    setValue('')
    setReason('')
    setFormError('')
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!valueLooksValid(kind, value)) {
      setFormError(
        kind === 'email'
          ? 'Enter a valid email address.'
          : 'Enter a valid phone number with its country code (e.g. +972501234567).',
      )
      return
    }
    setSubmitting(true)
    setFormError('')
    setNotice('')
    try {
      await repo.addDoNotContact({ kind, value: value.trim(), reason: reason.trim() || undefined })
      setNotice(`Added ${value.trim()} to the do-not-contact list.`)
      resetForm()
      // Jump back to page 1 so the new row is visible when the total crosses pages.
      setPage(1)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add the entry.')
    } finally {
      setSubmitting(false)
    }
  }

  const runRemove = async () => {
    if (!confirmRemove) return
    setRemoving(true)
    setNotice('')
    try {
      await repo.removeDoNotContact(confirmRemove.id)
      setNotice(`Removed ${confirmRemove.value} — it can be contacted again.`)
      setConfirmRemove(null)
      // Removing the only row on the last page would leave it empty — step back.
      if (items.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        reload()
      }
    } catch (err) {
      setNotice(`Remove failed: ${err instanceof Error ? err.message : String(err)}`)
      setConfirmRemove(null)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="System" />}
          title="Do-not-contact"
          description="Global suppression list — phones and emails here are never called or contacted anywhere in the platform."
          actions={
            <span className="hidden items-center gap-1.5 text-xs text-fg-muted sm:inline-flex">
              <Ban className="size-3.5" />
              Applies to every client, campaign and channel
            </span>
          }
        />

        <form onSubmit={(e) => void handleAdd(e)} className="surface space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-fg">Add an entry</h3>
              <p className="text-xs text-fg-muted">One number or email that must never be connected.</p>
            </div>
            <div role="radiogroup" aria-label="Entry type" className="flex gap-1 rounded-full border border-line bg-surface-2 p-1">
              {KIND_OPTIONS.map((k) => {
                const active = kind === k
                return (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setKind(k)
                      setFormError('')
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                      active
                        ? 'bg-accent text-white'
                        : 'text-fg-secondary hover:text-fg',
                    )}
                  >
                    {k === 'phone' ? <Phone className="size-3" /> : <Mail className="size-3" />}
                    {k}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="text-xs text-fg-muted">{kind === 'phone' ? 'Phone number' : 'Email address'}</span>
              {kind === 'phone' ? (
                <PhoneField
                  id="dnc-value"
                  className="mt-1"
                  value={value}
                  onChange={(next) => {
                    setValue(next)
                    setFormError('')
                  }}
                  placeholder="+972 50 123 4567"
                  aria-label="Phone number to suppress"
                />
              ) : (
                <Input
                  id="dnc-value"
                  className="mt-1"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value)
                    setFormError('')
                  }}
                  placeholder="name@company.com"
                  aria-label="Email address to suppress"
                />
              )}
            </div>
            <div>
              <span className="text-xs text-fg-muted">Reason (optional)</span>
              <Input
                id="dnc-reason"
                className="mt-1"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. customer request, compliance, opted out…"
                aria-label="Reason for suppressing this contact"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" size="sm" leadingIcon={<Plus className="size-3.5" />} disabled={submitting}>
              {submitting ? 'Adding…' : 'Add to do-not-contact'}
            </Button>
            {formError && (
              <p role="alert" aria-live="polite" className="text-xs text-danger">
                {formError}
              </p>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <Input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search a phone or email…"
              className="pl-9"
              aria-label="Search the do-not-contact list"
            />
          </div>
          <p aria-live="polite" className="text-xs text-fg-muted">
            {loading ? 'Loading…' : `${total} suppressed contact${total === 1 ? '' : 's'}`}
          </p>
        </div>

        {notice && (
          <p aria-live="polite" className="text-xs text-fg-secondary">
            {notice}
          </p>
        )}

        {loading ? (
          <LoadingState rows={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : total === 0 ? (
          query ? (
            <EmptyState title="No matches" description="Nothing on the list matches that phone or email." />
          ) : (
            <EmptyState
              title="The do-not-contact list is empty"
              description="Contacts added here are never called or contacted anywhere in the platform — no campaign, client, or channel will ever reach them."
            />
          )
        ) : (
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-2xs text-fg-muted">
                    <th className="px-5 py-2.5">Kind</th>
                    <th className="px-3 py-2.5">Value</th>
                    <th className="px-3 py-2.5">Reason</th>
                    <th className="px-3 py-2.5">Added</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((entry) => (
                    <tr key={entry.id} className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <KindBadge kind={entry.kind} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="select-all font-medium text-fg" title={entry.reason || undefined}>
                          {entry.value}
                        </span>
                      </td>
                      <td className="max-w-[260px] px-3 py-3">
                        <span className="line-clamp-2 text-xs text-fg-muted">{entry.reason || '—'}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-fg-muted">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${entry.value} from the do-not-contact list`}
                            className="hover:text-danger"
                            onClick={() => setConfirmRemove(entry)}
                          >
                            <Trash2 className="size-3.5 text-fg-faint" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
        )}

        <ConfirmDialog
          open={confirmRemove !== null}
          onClose={() => !removing && setConfirmRemove(null)}
          title={`Remove ${confirmRemove?.kind === 'phone' ? 'this phone' : 'this email'}?`}
          body={
            confirmRemove
              ? `"${confirmRemove.value}" will stop being suppressed: campaigns may call or contact it again. This does not delete any lead records.`
              : ''
          }
          confirmLabel="Remove"
          variant="danger"
          busy={removing}
          onConfirm={() => void runRemove()}
        />
      </PageContainer>
    </PageTransition>
  )
}
