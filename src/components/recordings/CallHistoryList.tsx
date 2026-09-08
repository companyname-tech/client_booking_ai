import { Fragment, useMemo, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import type { CallHistoryEntry } from '@/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { RecordingAudio } from '@/components/recordings/RecordingAudio'
import { RawTranscript } from '@/components/recordings/RawTranscript'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { callOutcomeLabel, fmtDuration, fmtWhen } from '@/lib/callHistory'
import { CopyableName } from '@/components/ui/CopyableName'

function newestFirst(recordings: CallHistoryEntry[]): CallHistoryEntry[] {
  return [...recordings].sort((a, b) =>
    (b.startedAt || b.id || '').localeCompare(a.startedAt || a.id || ''),
  )
}

export function CallHistoryList({ recordings }: { recordings: CallHistoryEntry[] }) {
  const [search, setSearch] = useState('')
  const [outcome, setOutcome] = useState('all')
  const [transcriptOpen, setTranscriptOpen] = useState<string | null>(null)

  const distinctOutcomes = useMemo(
    () => Array.from(new Set(recordings.map((r) => r.outcome))).filter(Boolean).sort(),
    [recordings],
  )

  const filtered = useMemo(() => {
    let list = newestFirst(recordings)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) => r.leadName.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q),
      )
    }
    if (outcome !== 'all') list = list.filter((r) => r.outcome === outcome)
    return list
  }, [recordings, search, outcome])

  if (recordings.length === 0) {
    return (
      <EmptyState
        title="No recorded calls yet"
        description="A recording appears here after each completed call."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by lead or phone…"
          className="sm:max-w-xs"
        />
        <Select
          value={outcome}
          onChange={(v) => setOutcome(v)}
          ariaLabel="Filter by outcome"
          options={[
            { value: 'all', label: 'All outcomes' },
            ...distinctOutcomes.map((o) => ({ value: o, label: callOutcomeLabel(o) })),
          ]}
          className="w-full sm:w-44"
        />
        <span className="self-center text-xs text-fg-muted">
          {filtered.length} of {recordings.length} recordings
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matching recordings" description="Try a different search or filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-1">
                {['When', 'Lead', 'Phone', 'Outcome', 'Duration', 'Recording', 'Transcript'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wider text-fg-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => {
                const hasTranscript = Boolean(rec.transcript?.trim())
                const open = transcriptOpen === rec.id
                return (
                  <Fragment key={rec.id}>
                    <tr className="border-b border-line/50 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{fmtWhen(rec.startedAt)}</td>
                      <td className="px-3 py-2">
                        {rec.leadId || rec.leadName ? (
                          <CopyableName
                            name={rec.leadName || 'Unknown lead'}
                            id={rec.leadId || rec.id}
                            compact
                            className="font-medium text-fg"
                          />
                        ) : (
                          <span className="font-medium text-fg">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{rec.phone || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{callOutcomeLabel(rec.outcome)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-fg-secondary">{fmtDuration(rec.durationSec)}</td>
                      <td className="px-3 py-2">
                        {rec.audioUrl ? (
                          <RecordingAudio src={rec.audioUrl} rowKey={rec.id} className="max-w-[280px]" />
                        ) : (
                          <span className="text-fg-faint">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {hasTranscript ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            leadingIcon={<MessageSquareText className="size-3.5" />}
                            onClick={() => setTranscriptOpen(open ? null : rec.id)}
                          >
                            {open ? 'Hide' : 'View'}
                          </Button>
                        ) : (
                          <span className="text-fg-faint">—</span>
                        )}
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-b border-line/50 bg-surface-1/50 last:border-0">
                        <td colSpan={7} className="px-4 py-3">
                          <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                            Conversation transcript
                          </h4>
                          <RawTranscript transcript={rec.transcript ?? ''} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
