import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Loader2, MessageSquarePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { SpotifyStylePlayer, type SpotifyStylePlayerHandle } from '@/components/recordings/SpotifyStylePlayer'
import { TrainingSyncedTranscript } from '@/components/recordings/TrainingSyncedTranscript'
import { repo } from '@/api/repository'
import type { TrainingRecordingComment, TrainingTalkSession } from '@/types/training'
import {
  activeTranscriptLine,
  buildTimedTranscript,
  formatTalkClock,
  type TimedTranscriptLine,
} from '@/lib/trainingTranscript'
import { loadRecordingComments } from '@/lib/trainingRecordingComments'

interface TrainingRecordingReviewProps {
  campaignId: string
  refreshToken?: number
  onChanged?: () => void
}

export function TrainingRecordingReview({
  campaignId,
  refreshToken = 0,
  onChanged,
}: TrainingRecordingReviewProps) {
  const [sessions, setSessions] = useState<TrainingTalkSession[]>([])
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [currentS, setCurrentS] = useState(0)
  const [selectedLineId, setSelectedLineId] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [comments, setComments] = useState<TrainingRecordingComment[]>([])
  const [notice, setNotice] = useState('')
  const [audioDurationS, setAudioDurationS] = useState(0)
  const playerRef = useRef<SpotifyStylePlayerHandle>(null)

  const session = sessions.find((row) => row.sessionId === sessionId) ?? sessions[0] ?? null
  const effectiveDurationS = audioDurationS > 0
    ? audioDurationS
    : session?.recordingDurationS || session?.durationS || 0
  const timedLines = useMemo(
    () => (effectiveDurationS > 0 ? buildTimedTranscript(session?.transcript ?? [], effectiveDurationS) : []),
    [session, effectiveDurationS],
  )
  const activeLine = activeTranscriptLine(timedLines, currentS)
  const selectedLine = timedLines.find((line) => line.id === selectedLineId) ?? activeLine

  const loadSessions = useCallback(async () => {
    if (!campaignId) {
      setSessions([])
      setSessionId('')
      return
    }
    setLoading(true)
    setError('')
    try {
      const rows = await repo.getTrainingTalkSessions(campaignId)
      setSessions(rows)
      setSessionId((prev) => (rows.some((row) => row.sessionId === prev) ? prev : rows[0]?.sessionId ?? ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSessions([])
      setSessionId('')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions, refreshToken])

  useEffect(() => {
    if (!campaignId || !session?.sessionId) {
      setComments([])
      return
    }
    let cancelled = false
    setCurrentS(0)
    setAudioDurationS(0)
    setSelectedLineId('')
    setCommentDraft('')
    void (async () => {
      try {
        let rows = await repo.listTrainingRecordingComments(campaignId, session.sessionId)
        const local = loadRecordingComments(session.sessionId)
        if (rows.length === 0 && local.length > 0) {
          for (const item of [...local].reverse()) {
            await repo.addTrainingRecordingComment(campaignId, session.sessionId, {
              comment: item.comment,
              timestampS: item.timestampS,
              transcriptSnippet: item.transcriptSnippet,
            })
          }
          rows = await repo.listTrainingRecordingComments(campaignId, session.sessionId)
          onChanged?.()
        }
        if (!cancelled) setComments(rows)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
          setComments([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [campaignId, session?.sessionId, onChanged])

  const seekToLine = (line: TimedTranscriptLine) => {
    setSelectedLineId(line.id)
    playerRef.current?.seekTo(line.startS)
    void playerRef.current?.play().catch(() => undefined)
    setCurrentS(line.startS)
  }

  const saveComment = async () => {
    if (!session || !selectedLine || busy) return
    const text = commentDraft.trim()
    if (!text) return
    setBusy(true)
    setError('')
    try {
      await repo.addTrainingRecordingComment(campaignId, session.sessionId, {
        comment: text,
        timestampS: selectedLine.startS,
        transcriptSnippet: selectedLine.text,
      })
      setComments(await repo.listTrainingRecordingComments(campaignId, session.sessionId))
      setCommentDraft('')
      setNotice(
        `Comment saved at ${formatTalkClock(selectedLine.startS)}. It trains the next talk; publish the memory to pin it.`,
      )
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const removeComment = async (commentId: string) => {
    if (!session || busy) return
    setBusy(true)
    setError('')
    try {
      await repo.deleteTrainingRecordingComment(campaignId, session.sessionId, commentId)
      setComments(await repo.listTrainingRecordingComments(campaignId, session.sessionId))
      setNotice('Comment removed — it will not train the next talk.')
      onChanged?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const subtitle = activeLine
    ? `${activeLine.role === 'user' ? 'You' : 'Agent'}: ${activeLine.text}`
    : ''

  if (!campaignId) {
    return (
      <div className="surface p-5">
        <p className="text-sm text-fg-faint">Pick a campaign to review training recordings.</p>
      </div>
    )
  }

  return (
    <div className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <AudioLines className="size-4 text-accent" />
            Training talk recordings
          </h3>
          <p className="mt-1 text-xs text-fg-muted">
            Replay a talk, click a timestamp, and save what the agent should do differently.
            That comment trains the next talk.
          </p>
        </div>
        {sessions.length > 0 ? (
          <Select
            value={sessionId}
            onChange={setSessionId}
            ariaLabel="Training talk session"
            options={sessions.map((row) => ({
              value: row.sessionId,
              label: `${formatTalkClock(row.durationS)} · score ${row.score} · ${new Date(row.completedAt || row.startedAt).toLocaleString()}`,
            }))}
            className="min-w-[220px]"
          />
        ) : null}
      </div>

      {error ? <p className="mt-3 text-xs text-danger" role="alert">{error}</p> : null}
      {notice ? <p className="mt-3 text-xs text-fg-secondary">{notice}</p> : null}

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-fg-muted">
          <Loader2 className="size-4 animate-spin" />
          Loading recordings…
        </div>
      ) : !session ? (
        <p className="mt-4 text-sm text-fg-faint">No training talks recorded for this campaign yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <SpotifyStylePlayer
              ref={playerRef}
              src={session.recordingUrl ?? ''}
              rowKey={session.sessionId}
              title={`Talk · ${formatTalkClock(effectiveDurationS || session.durationS)}`}
              subtitle={subtitle}
              onTimeUpdate={setCurrentS}
              onDurationChange={setAudioDurationS}
            />
          </div>

          <TrainingSyncedTranscript
            lines={timedLines}
            currentS={currentS}
            selectedLineId={selectedLineId}
            onSeekLine={seekToLine}
          />

          <div className="lg:col-span-2 rounded-xl border border-line bg-surface-1/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
              <MessageSquarePlus className="size-3.5" />
              Comment at timestamp
              {selectedLine ? (
                <span className="font-mono text-accent">{formatTalkClock(selectedLine.startS)}</span>
              ) : null}
            </div>
            {selectedLine ? (
              <p className="mb-2 text-xs italic text-fg-muted">“{selectedLine.text}”</p>
            ) : (
              <p className="mb-2 text-xs text-fg-faint">Select a transcript line to attach your comment.</p>
            )}
            <Textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
              placeholder="What should the agent do differently at this moment?"
              className="text-xs"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                disabled={!selectedLine || !commentDraft.trim() || busy}
                onClick={() => void saveComment()}
              >
                {busy ? 'Saving…' : 'Save comment'}
              </Button>
            </div>

            {comments.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-line pt-3">
                {comments.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-2 rounded-md border border-line/60 bg-bg/40 p-2">
                    <div className="min-w-0">
                      <span className="font-mono text-2xs text-accent">{formatTalkClock(row.timestampS)}</span>
                      <p className="mt-0.5 text-xs text-fg">{row.comment}</p>
                      <p className="mt-1 text-2xs italic text-fg-muted">“{row.transcriptSnippet}”</p>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Remove comment"
                      disabled={busy}
                      onClick={() => void removeComment(row.id)}
                      leadingIcon={<Trash2 className="size-3.5 text-danger" />}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
