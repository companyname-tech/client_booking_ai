import { useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import type { Recording } from '@/types'
import { NOW } from '@/data/time'
import { formatRelativeCompact, formatDuration } from '@/lib/utils'
import { CallOutcomeBadge } from '@/components/calls/CallBadges'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Select } from '@/components/ui/Select'
import { AISummary } from './AISummary'
import { RecordingPlayer } from './RecordingPlayer'
import { Transcript } from './Transcript'

export function RecordingList({ recordings }: { recordings: Recording[] }) {
  const [search, setSearch] = useState('')
  const [outcome, setOutcome] = useState<string>('all')
  const [selected, setSelected] = useState<Recording | null>(null)

  const filtered = useMemo(() => {
    let list = recordings
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) => r.leadName.toLowerCase().includes(q) || r.leadCompany.toLowerCase().includes(q))
    }
    if (outcome !== 'all') list = list.filter((r) => r.outcome === outcome)
    return list
  }, [recordings, search, outcome])

  if (recordings.length === 0) {
    return <EmptyState title="No recordings available" description="Recordings appear after completed calls." />
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search recordings…" className="sm:max-w-xs" />
        <Select
          value={outcome}
          onChange={(v) => setOutcome(v)}
          ariaLabel="Filter by outcome"
          options={[
            { value: 'all', label: 'All outcomes' },
            { value: 'booked', label: 'Booked' },
            { value: 'interested', label: 'Interested' },
            { value: 'details_requested', label: 'Details requested' },
          ]}
          className="w-full sm:w-44"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((rec) => (
          <div
            key={rec.id}
            className="interactive flex flex-col gap-3 rounded-lg border border-line bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-fg">{rec.leadName}</div>
              <div className="text-xs text-fg-muted">{rec.leadCompany}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <CallOutcomeBadge outcome={rec.outcome} />
                <span className="text-xs tabular text-fg-muted">{formatDuration(rec.durationSec)}</span>
                <span className="text-xs text-fg-muted">{formatRelativeCompact(rec.startedAt, NOW)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-fg-secondary">&ldquo;{rec.summary}&rdquo;</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" leadingIcon={<Play className="size-3" />} onClick={() => setSelected(rec)}>
                Play
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(rec)}>View summary →</Button>
            </div>
          </div>
        ))}
      </div>

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.leadName ?? ''}
        subtitle={selected?.leadCompany}
      >
        {selected && (
          <div className="space-y-6">
            <RecordingPlayer audioUrl={selected.recordingUrl} durationSec={selected.durationSec} />
            <AISummary summary={selected.summary} signals={selected.signals} confidence={selected.confidence} />
            <section>
              <h4 className="mb-3 text-sm font-semibold text-fg">Transcript</h4>
              <Transcript messages={selected.transcript} />
            </section>
          </div>
        )}
      </DetailDrawer>
    </>
  )
}
