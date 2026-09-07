import { useMemo, useState } from 'react'
import { Phone } from 'lucide-react'
import { repo } from '@/data/repository'
import { useAsyncData } from '@/hooks/useAsyncData'
import { PageTransition } from '@/components/motion/PageTransition'
import { PageContainer, PageHeader, WorkspaceEyebrow } from '@/components/layout/PageHeader'
import { Reveal } from '@/components/motion/Reveal'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDuration } from '@/lib/utils'
import { callHistoryOutcomeLabel, callHistoryOutcomeTone } from '@/lib/status'

/** "2026-09-07T12:34:56" → "2026-09-07 12:34" (matches the old call-history screen). */
function fmtWhen(iso: string): string {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '—'
}

export default function AdminCalls() {
  const { data, loading, error, reload } = useAsyncData(() => repo.getCallHistory())
  const calls = data ?? []
  const [search, setSearch] = useState('')
  const [outcome, setOutcome] = useState('all')

  const outcomeOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const c of calls) if (c.outcome) seen.add(c.outcome)
    return Array.from(seen)
  }, [calls])

  const filtered = useMemo(() => {
    let list = calls
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => `${c.leadName} ${c.phone}`.toLowerCase().includes(q))
    }
    if (outcome !== 'all') list = list.filter((c) => c.outcome === outcome)
    return list
  }, [calls, search, outcome])

  return (
    <PageTransition>
      <PageContainer className="space-y-6">
        <PageHeader
          eyebrow={<WorkspaceEyebrow name="Super Admin" context="Operations" />}
          title="Calls"
          description="Call history across every agent and campaign."
        />
        {loading ? (
          <LoadingState rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : calls.length === 0 ? (
          <EmptyState
            icon={<Phone />}
            title="No calls yet"
            description="Recorded calls will appear here after the AI reaches out to leads."
          />
        ) : (
          <Reveal className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lead or phone…"
                className="sm:max-w-xs"
              />
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="interactive rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm text-fg"
              >
                <option value="all">All outcomes</option>
                {outcomeOptions.map((o) => (
                  <option key={o} value={o}>
                    {callHistoryOutcomeLabel(o)}
                  </option>
                ))}
              </select>
              <span className="self-center text-xs text-fg-muted sm:ml-auto">
                {filtered.length} of {calls.length} calls
              </span>
            </div>

            <div className="surface overflow-hidden">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-2xs text-fg-muted">
                      <th className="px-5 py-2.5 font-medium">When</th>
                      <th className="px-3 py-2.5 font-medium">Lead</th>
                      <th className="px-3 py-2.5 font-medium">Phone</th>
                      <th className="px-3 py-2.5 font-medium">Outcome</th>
                      <th className="px-3 py-2.5 font-medium">Duration</th>
                      <th className="px-5 py-2.5 font-medium">Recording</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-xs tabular text-fg-muted">{fmtWhen(c.startedAt)}</td>
                        <td className="px-3 py-3 font-medium text-fg">{c.leadName || '—'}</td>
                        <td className="px-3 py-3 tabular text-fg-secondary">{c.phone || '—'}</td>
                        <td className="px-3 py-3">
                          <StatusBadge tone={callHistoryOutcomeTone(c.outcome)}>
                            {callHistoryOutcomeLabel(c.outcome)}
                          </StatusBadge>
                        </td>
                        <td className="px-3 py-3 tabular text-fg-secondary">
                          {c.durationSec ? formatDuration(c.durationSec) : '—'}
                        </td>
                        <td className="px-5 py-3">
                          {c.audioUrl ? (
                            <audio controls preload="none" src={c.audioUrl} className="h-8 max-w-[280px]" />
                          ) : (
                            <span className="text-fg-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 p-3 md:hidden">
                {filtered.map((c) => (
                  <div key={c.id} className="rounded-md border border-line bg-surface-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-fg">{c.leadName || '—'}</div>
                      <StatusBadge tone={callHistoryOutcomeTone(c.outcome)}>
                        {callHistoryOutcomeLabel(c.outcome)}
                      </StatusBadge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-fg-muted">
                      <span>{fmtWhen(c.startedAt)}</span>
                      <span>·</span>
                      <span>{c.phone || '—'}</span>
                      <span>·</span>
                      <span>{c.durationSec ? formatDuration(c.durationSec) : '—'}</span>
                    </div>
                    {c.audioUrl && (
                      <audio controls preload="none" src={c.audioUrl} className="mt-2 h-8 w-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </PageContainer>
    </PageTransition>
  )
}
