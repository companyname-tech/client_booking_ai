import { useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  Check,
  CircleCheck,
  CircleX,
  ContactRound,
  Mail,
  Phone,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  buildExtractedCompareRows,
  filterExtracted,
  type CompareStatus,
} from '@/lib/compareTrainingExtracted'
import {
  emptyDismissed,
  loadDismissedExtracted,
  saveDismissedExtracted,
} from '@/lib/trainingExtractedDismissed'
import {
  emptyIntendedData,
  loadIntendedData,
  saveIntendedData,
} from '@/lib/trainingIntendedData'
import type { TrainingExtractedData, TrainingIntendedData } from '@/types/training'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<CompareStatus, string> = {
  match: 'Match',
  missing: 'Missing',
  extra: 'Extra',
  mismatch: 'Mismatch',
  neutral: 'Review',
}

const STATUS_CLASS: Record<CompareStatus, string> = {
  match: 'text-success',
  missing: 'text-danger',
  extra: 'text-warning',
  mismatch: 'text-danger',
  neutral: 'text-fg-muted',
}

function StatusIcon({ status }: { status: CompareStatus }) {
  if (status === 'match') return <CircleCheck className="size-3.5 text-success" />
  if (status === 'missing' || status === 'mismatch') return <CircleX className="size-3.5 text-danger" />
  return <CircleX className="size-3.5 text-warning" />
}

export interface ExtractedTalkReviewProps {
  campaignId: string
  sessionId: string
  extracted?: TrainingExtractedData
}

export function ExtractedTalkReview({ campaignId, sessionId, extracted }: ExtractedTalkReviewProps) {
  const [intended, setIntended] = useState<TrainingIntendedData>(emptyIntendedData())
  const [draftEmail, setDraftEmail] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  const [dismissed, setDismissed] = useState(emptyDismissed())
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!campaignId) return
    setIntended(loadIntendedData(campaignId))
  }, [campaignId])

  useEffect(() => {
    if (!sessionId) return
    setDismissed(loadDismissedExtracted(sessionId))
  }, [sessionId])

  const visibleExtracted = useMemo(
    () => filterExtracted(extracted, dismissed),
    [extracted, dismissed],
  )

  const compareRows = useMemo(
    () => buildExtractedCompareRows(intended, visibleExtracted),
    [intended, visibleExtracted],
  )

  const hasIntended =
    intended.emails.length > 0
    || intended.phones.length > 0
    || !!(intended.meeting.day || intended.meeting.time)

  const persistIntended = (next: TrainingIntendedData) => {
    const saved = saveIntendedData(campaignId, next)
    setIntended(saved)
    setNotice('Intended data saved — comparison updates below.')
  }

  const dismissEmail = (email: string) => {
    const norm = email.trim().toLowerCase()
    const next = {
      ...dismissed,
      emails: [...new Set([...dismissed.emails, norm])],
    }
    setDismissed(saveDismissedExtracted(sessionId, next))
  }

  const dismissPhone = (phone: string) => {
    const norm = phone.replace(/\D/g, '')
    const next = {
      ...dismissed,
      phones: [...new Set([...dismissed.phones, norm])],
    }
    setDismissed(saveDismissedExtracted(sessionId, next))
  }

  const dismissMeeting = () => {
    setDismissed(saveDismissedExtracted(sessionId, { ...dismissed, meeting: true }))
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-md border border-line bg-surface-1/50 p-3">
        <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
          <Target className="size-3.5 text-accent" />
          Intended data for this campaign
        </div>
        <p className="mt-1 text-xs text-fg-muted">
          Set what the agent should capture — after each talk we compare extracted values against this.
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="rounded-md border border-line/60 bg-bg/40 p-2.5">
            <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
              <Mail className="size-3.5" />
              Emails
            </div>
            <ul className="space-y-1">
              {intended.emails.map((email) => (
                <li key={email} className="flex items-center justify-between gap-2 text-sm text-fg">
                  <span className="truncate">{email}</span>
                  <button
                    type="button"
                    aria-label={`Remove intended email ${email}`}
                    onClick={() =>
                      persistIntended({ ...intended, emails: intended.emails.filter((row) => row !== email) })
                    }
                    className="rounded p-1 text-fg-faint hover:text-danger"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                placeholder="lev@example.com"
                className="text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const next = draftEmail.trim()
                    if (!next) return
                    persistIntended({ ...intended, emails: [...intended.emails, next] })
                    setDraftEmail('')
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!draftEmail.trim()}
                onClick={() => {
                  const next = draftEmail.trim()
                  if (!next) return
                  persistIntended({ ...intended, emails: [...intended.emails, next] })
                  setDraftEmail('')
                }}
                leadingIcon={<Plus className="size-3.5" />}
              >
                Add
              </Button>
            </div>
          </div>
          <div className="rounded-md border border-line/60 bg-bg/40 p-2.5">
            <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
              <Phone className="size-3.5" />
              Phones
            </div>
            <ul className="space-y-1">
              {intended.phones.map((phone) => (
                <li key={phone} className="flex items-center justify-between gap-2 text-sm text-fg">
                  <span className="truncate">{phone}</span>
                  <button
                    type="button"
                    aria-label={`Remove intended phone ${phone}`}
                    onClick={() =>
                      persistIntended({ ...intended, phones: intended.phones.filter((row) => row !== phone) })
                    }
                    className="rounded p-1 text-fg-faint hover:text-danger"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input
                value={draftPhone}
                onChange={(e) => setDraftPhone(e.target.value)}
                placeholder="+972…"
                className="text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const next = draftPhone.trim()
                    if (!next) return
                    persistIntended({ ...intended, phones: [...intended.phones, next] })
                    setDraftPhone('')
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!draftPhone.trim()}
                onClick={() => {
                  const next = draftPhone.trim()
                  if (!next) return
                  persistIntended({ ...intended, phones: [...intended.phones, next] })
                  setDraftPhone('')
                }}
                leadingIcon={<Plus className="size-3.5" />}
              >
                Add
              </Button>
            </div>
          </div>
          <div className="rounded-md border border-line/60 bg-bg/40 p-2.5">
            <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
              <CalendarClock className="size-3.5" />
              Meeting
            </div>
            <div className="grid gap-2">
              <Input
                value={intended.meeting.day}
                onChange={(e) => setIntended({ ...intended, meeting: { ...intended.meeting, day: e.target.value } })}
                placeholder="Monday"
                className="text-xs"
              />
              <Input
                value={intended.meeting.time}
                onChange={(e) => setIntended({ ...intended, meeting: { ...intended.meeting, time: e.target.value } })}
                placeholder="11:00"
                className="text-xs"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => persistIntended(intended)}
              leadingIcon={<Check className="size-3.5" />}
            >
              Save meeting
            </Button>
          </div>
        </div>
        {notice ? <p className="mt-2 text-2xs text-fg-secondary">{notice}</p> : null}
      </div>

      <div className="rounded-md border border-accent/20 bg-accent/5 p-3">
        <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-accent">
          <ContactRound className="size-3.5" />
          Extracted from this talk
        </div>
        {!hasIntended ? (
          <p className="mt-2 text-xs text-fg-muted">
            Add intended data above to compare what the agent captured vs what you expected.
          </p>
        ) : null}

        {compareRows.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="border-b border-line/70 text-2xs uppercase tracking-wide text-fg-muted">
                  <th className="px-2 py-1.5 font-semibold">Field</th>
                  <th className="px-2 py-1.5 font-semibold">Intended</th>
                  <th className="px-2 py-1.5 font-semibold">Extracted</th>
                  <th className="px-2 py-1.5 font-semibold">Status</th>
                  <th className="px-2 py-1.5 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.id} className="border-b border-line/40">
                    <td className="px-2 py-2 font-medium text-fg">{row.field}</td>
                    <td className="px-2 py-2 text-fg-secondary">{row.intended}</td>
                    <td className="px-2 py-2 text-fg">{row.extracted}</td>
                    <td className={cn('px-2 py-2 font-medium', STATUS_CLASS[row.status])}>
                      <span className="inline-flex items-center gap-1">
                        <StatusIcon status={row.status} />
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">
                      {row.status === 'extra' ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Remove extracted value"
                          onClick={() => {
                            if (row.field === 'Email') dismissEmail(row.extracted)
                            else if (row.field === 'Phone') dismissPhone(row.extracted)
                            else dismissMeeting()
                          }}
                          leadingIcon={<Trash2 className="size-3.5 text-danger" />}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-xs text-fg-muted">
            No email, phone, or meeting time was captured in this talk.
          </p>
        )}

        {(visibleExtracted.emails?.length ?? 0) > 0
        || (visibleExtracted.phones?.length ?? 0) > 0
        || visibleExtracted.meeting ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(visibleExtracted.emails ?? []).map((entry) => (
              <div key={entry.email} className="flex items-start justify-between gap-2 rounded-md border border-line/60 bg-bg/40 p-2.5">
                <div className="min-w-0">
                  <div className="text-2xs font-semibold uppercase tracking-wide text-fg-muted">Email</div>
                  <p className="mt-1 truncate text-sm font-medium text-fg">{entry.email}</p>
                  <p className="text-2xs text-fg-muted">
                    {entry.confirmed ? 'confirmed' : 'unverified'}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove extracted email ${entry.email}`}
                  onClick={() => dismissEmail(entry.email)}
                  className="rounded p-1 text-fg-faint hover:text-danger"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {(visibleExtracted.phones ?? []).map((phone) => (
              <div key={phone} className="flex items-start justify-between gap-2 rounded-md border border-line/60 bg-bg/40 p-2.5">
                <div className="min-w-0">
                  <div className="text-2xs font-semibold uppercase tracking-wide text-fg-muted">Phone</div>
                  <p className="mt-1 text-sm font-medium text-fg">{phone}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove extracted phone ${phone}`}
                  onClick={() => dismissPhone(phone)}
                  className="rounded p-1 text-fg-faint hover:text-danger"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {visibleExtracted.meeting && (visibleExtracted.meeting.day || visibleExtracted.meeting.time) ? (
              <div className="flex items-start justify-between gap-2 rounded-md border border-line/60 bg-bg/40 p-2.5">
                <div className="min-w-0">
                  <div className="text-2xs font-semibold uppercase tracking-wide text-fg-muted">Meeting</div>
                  <p className="mt-1 text-sm font-medium text-fg">
                    {[visibleExtracted.meeting.day, visibleExtracted.meeting.time].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove extracted meeting"
                  onClick={dismissMeeting}
                  className="rounded p-1 text-fg-faint hover:text-danger"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
