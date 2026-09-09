import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AudioLines,
  CircleCheck,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  Radio,
  Square,
  TriangleAlert,
  ListChecks,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { repo } from '@/api/repository'
import { SpotifyStylePlayer, type SpotifyStylePlayerHandle } from '@/components/recordings/SpotifyStylePlayer'
import { TrainingSyncedTranscript } from '@/components/recordings/TrainingSyncedTranscript'
import { ExtractedTalkReview } from '@/components/admin/ExtractedTalkReview'
import { TrainingMockCalendar } from '@/components/admin/TrainingMockCalendar'
import { buildTimedTranscript } from '@/lib/trainingTranscript'
import {
  relayRole,
  relaySpeaker,
  TranscriptAccumulator,
} from '@/lib/transcriptAccumulator'
import type {
  TrainingCampaignRow,
  TrainingTalkTurn,
  TrainingSessionResult,
} from '@/types/training'
import { cn } from '@/lib/utils'
import {
  formatEngagementRules,
  parseEngagementRules,
  type EngagementRule,
} from '@/lib/engagementRules'
import {
  clearPendingTalk,
  loadPendingTalk,
  savePendingTalk,
  type PendingTalk,
} from '@/lib/pendingTrainingTalk'

/** 24 kHz mono PCM16 — the codec the /agent/rtc realtime bridge expects. */
const PCM_RATE = 24000
const PCM_BUFFER = 1024

type Phase = 'idle' | 'connecting' | 'live' | 'grading' | 'done' | 'error'

interface TranscriptLine {
  id: number
  speaker: 'user' | 'agent'
  text: string
  live?: boolean
}

type CompletePayload = {
  transcript: TrainingTalkTurn[]
  agentId: string
  durationS: number
  conversationId: string
}

type CompleteReply = Awaited<ReturnType<typeof repo.completeTrainingTalk>>

/** Stable per-talk id (idempotency key for the training-complete submit). */
function newConversationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `talk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function waitForTrainingWsClose(ws: WebSocket | null, timeoutMs = 4000): Promise<void> {
  if (!ws || ws.readyState === WebSocket.CLOSED) return Promise.resolve()
  return new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timer)
      ws.removeEventListener('close', onClose)
      resolve()
    }
    const onClose = () => finish()
    const timer = window.setTimeout(finish, timeoutMs)
    ws.addEventListener('close', onClose)
    try {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'stop' }))
      ws.close()
    } catch {
      finish()
    }
  })
}

interface LiveSession {
  ws: WebSocket | null
  micStream: MediaStream | null
  captureCtx: AudioContext | null
  playCtx: AudioContext | null
  processor: ScriptProcessorNode | null
  sources: AudioBufferSourceNode[]
  nextStart: number
  scheduling: boolean
  energyCounter: number
  lastCancelAt: number
}

function freshSession(): LiveSession {
  return {
    ws: null,
    micStream: null,
    captureCtx: null,
    playCtx: null,
    processor: null,
    sources: [],
    nextStart: 0,
    scheduling: false,
    energyCounter: 0,
    lastCancelAt: 0,
  }
}

export function TrainingTalkConsole({
  campaigns,
  agents,
  campaignId,
  agentId,
  onTrainingUpdated,
}: {
  campaigns: TrainingCampaignRow[]
  agents: { agentId: string; name: string }[]
  campaignId: string
  agentId: string
  onTrainingUpdated: () => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [statusText, setStatusText] = useState('Pick a campaign and press Start to rehearse live.')
  const [lines, setLines] = useState<TranscriptLine[]>([])
  const [error, setError] = useState('')
  const [result, setResult] = useState<TrainingSessionResult | null>(null)
  const [recordingSrc, setRecordingSrc] = useState('')
  const [savedTranscript, setSavedTranscript] = useState<TrainingTalkTurn[]>([])
  const [playbackS, setPlaybackS] = useState(0)
  const [audioDurationS, setAudioDurationS] = useState(0)
  const [flowSuggestions, setFlowSuggestions] = useState<string[]>([])
  const [engagementRules, setEngagementRules] = useState<EngagementRule[]>([])
  const [ruleDraft, setRuleDraft] = useState('')
  const [processLoaded, setProcessLoaded] = useState(false)
  const [processBusy, setProcessBusy] = useState(false)
  const [processNotice, setProcessNotice] = useState('')
  const [pendingTalk, setPendingTalk] = useState<PendingTalk | null>(null)
  const [submittingDraft, setSubmittingDraft] = useState(false)
  const liveRef = useRef<LiveSession>(freshSession())
  const turnsRef = useRef<TrainingTalkTurn[]>([])
  const transcriptAccRef = useRef(new TranscriptAccumulator())
  const conversationIdRef = useRef('')
  const startedAtRef = useRef(0)
  const playerRef = useRef<SpotifyStylePlayerHandle>(null)
  const resumeConversationRef = useRef('')

  const playbackDurationS = audioDurationS || result?.durationS || 0
  const playbackLines = useMemo(
    () => buildTimedTranscript(savedTranscript, playbackDurationS),
    [savedTranscript, playbackDurationS],
  )

  const campaign = campaigns.find((c) => c.offerCampaignId === campaignId) ?? null

  useEffect(() => {
    setResult(null)
    setFlowSuggestions([])
    setRecordingSrc('')
    setSavedTranscript([])
    setPlaybackS(0)
    setAudioDurationS(0)
  }, [campaignId])

  // Load any talk whose final save failed earlier (sessionStorage survives a
  // reload) — the transcript is never silently dropped.
  useEffect(() => {
    setPendingTalk(campaignId ? loadPendingTalk(campaignId) : null)
  }, [campaignId])

  // Quietly re-submit a kept talk when the console is idle (e.g. right after a
  // page reload). The backend is idempotent by conversation_id, so this can
  // never create a duplicate session.
  useEffect(() => {
    if (!pendingTalk || !agentId || phase !== 'idle') return
    if (resumeConversationRef.current === pendingTalk.conversationId) return
    resumeConversationRef.current = pendingTalk.conversationId
    void submitDraft(pendingTalk)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTalk, agentId, phase])

  // Load the operator's saved conversation-process description for the picked
  // campaign (the intended flow the findings compare against).
  useEffect(() => {
    setEngagementRules([])
    setRuleDraft('')
    setProcessLoaded(false)
    setProcessNotice('')
    if (!campaignId) return
    let active = true
    repo
      .getConversationProcess(campaignId)
      .then((r) => {
        if (active) {
          setEngagementRules(parseEngagementRules(r.process ?? ''))
          setProcessLoaded(true)
        }
      })
      .catch(() => {
        if (active) {
          setEngagementRules([])
          setProcessLoaded(true)
        }
      })
    return () => {
      active = false
    }
  }, [campaignId])

  const persistEngagementRules = async (nextRules: EngagementRule[], notice = 'Rule saved.') => {
    if (!campaignId) return
    setProcessBusy(true)
    setProcessNotice('')
    try {
      await repo.saveConversationProcess(campaignId, formatEngagementRules(nextRules))
      setEngagementRules(nextRules)
      setProcessNotice(notice)
    } catch (e) {
      setProcessNotice(`Save failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setProcessBusy(false)
    }
  }

  const addEngagementRule = async () => {
    const text = ruleDraft.trim()
    if (!text || processBusy) return
    const next = [...engagementRules, { id: crypto.randomUUID(), text }]
    setRuleDraft('')
    await persistEngagementRules(next, 'Rule added — findings will compare each talk against these rules.')
  }

  const removeEngagementRule = async (ruleId: string) => {
    if (processBusy) return
    const next = engagementRules.filter((rule) => rule.id !== ruleId)
    await persistEngagementRules(next, next.length ? 'Rule removed.' : 'All rules cleared.')
  }

  // Cleanup audio + sockets when the component unmounts mid-talk.
  useEffect(() => {
    return () => stopEngine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pushTurn = useCallback((
    speaker: 'user' | 'agent',
    text: string,
    timing?: { timestampMs?: number; timestampEndMs?: number },
  ) => {
    const timestampMs = timing?.timestampMs ?? (startedAtRef.current ? Date.now() - startedAtRef.current : 0)
    const turn: TrainingTalkTurn = { role: speaker, text, timestampMs }
    if (timing?.timestampEndMs != null && timing.timestampEndMs > 0) {
      turn.timestampEndMs = timing.timestampEndMs
    }
    turnsRef.current.push(turn)
  }, [])

  const stopEngine = useCallback(() => {
    const live = liveRef.current
    if (live.ws) {
      try {
        if (live.ws.readyState === WebSocket.OPEN) live.ws.send(JSON.stringify({ type: 'stop' }))
        live.ws.close()
      } catch {
        /* noop */
      }
    }
    live.ws = null
    live.micStream?.getTracks().forEach((t) => t.stop())
    live.micStream = null
    if (live.processor) live.processor.disconnect()
    live.processor = null
    if (live.captureCtx) void live.captureCtx.close().catch(() => undefined)
    live.captureCtx = null
    if (live.playCtx) void live.playCtx.close().catch(() => undefined)
    live.playCtx = null
    live.sources.forEach((s) => {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
    })
    live.sources = []
    live.scheduling = false
    live.nextStart = 0
    live.energyCounter = 0
    live.lastCancelAt = 0
  }, [])

  const syncTranscriptLines = useCallback(() => {
    setLines(
      transcriptAccRef.current.getLines().map((line, index) => ({
        id: index,
        speaker: relayRole(line.speaker),
        text: line.text,
        live: line.live,
      })),
    )
  }, [])

  const handleControl = useCallback(
    (msg: { type: string; [k: string]: unknown }) => {
      const t = msg.type
      if (t === 'state') {
        const state = String(msg.state ?? '')
        if (state === 'connected') setStatusText('Connected — the agent is live. Role-play a prospect and speak.')
        else if (state === 'listening') setStatusText('Listening…')
        else if (state === 'speaking') setStatusText('Agent speaking…')
        else if (state === 'idle') setStatusText('Idle — speak now')
        else setStatusText(state)
      } else if (t === 'transcript' || t === 'transcript_delta') {
        const speaker = relaySpeaker(msg.speaker)
        const text = String(msg.text ?? '')
        const finalized = transcriptAccRef.current.push({
          type: t,
          speaker,
          text,
        })
        syncTranscriptLines()
        if (t === 'transcript' && finalized) {
          pushTurn(relayRole(finalized.speaker), finalized.text, {
            timestampMs: typeof msg.timestamp_ms === 'number' ? msg.timestamp_ms : undefined,
            timestampEndMs: typeof msg.timestamp_end_ms === 'number' ? msg.timestamp_end_ms : undefined,
          })
        }
      } else if (t === 'error') {
        setError(String(msg.message ?? 'Session error'))
        setStatusText('Session error — see message below.')
      }
    },
    [pushTurn, syncTranscriptLines],
  )

  const playPcm = useCallback((bytes: ArrayBuffer) => {
    const live = liveRef.current
    if (!live.playCtx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      live.playCtx = new Ctx({ sampleRate: PCM_RATE, latencyHint: 'interactive' })
    }
    if (live.playCtx.state === 'suspended') void live.playCtx.resume()
    const int16 = new Int16Array(bytes)
    if (!int16.length) return
    const f32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i += 1) f32[i] = int16[i] / 32768
    const now = live.playCtx.currentTime
    if (!live.scheduling || live.nextStart < now - 0.05) {
      live.nextStart = now + 0.03
      live.scheduling = true
    }
    const dur = f32.length / PCM_RATE
    const buf = live.playCtx.createBuffer(1, f32.length, PCM_RATE)
    buf.getChannelData(0).set(f32)
    const src = live.playCtx.createBufferSource()
    src.buffer = buf
    src.connect(live.playCtx.destination)
    src.start(live.nextStart)
    live.sources.push(src)
    live.nextStart += dur
    src.onended = () => {
      live.sources = live.sources.filter((s) => s !== src)
    }
  }, [])

  const start = useCallback(async () => {
    if (!campaign) return
    if (!agentId) {
      setError('This campaign has no agent attached. Attach an agent to the campaign before training it.')
      setPhase('error')
      return
    }
    setError('')
    setResult(null)
    setRecordingSrc('')
    setSavedTranscript([])
    setPlaybackS(0)
    setAudioDurationS(0)
    setFlowSuggestions([])
    setLines([])
    turnsRef.current = []
    transcriptAccRef.current.reset()
    setPhase('connecting')
    setStatusText('Connecting the realtime voice session…')

    // Mark the campaign as training (per-campaign status via the existing
    // admin training endpoints) — best effort, never blocks the talk.
    void repo.startCampaignTraining(campaign.offerCampaignId).catch(() => undefined)

    conversationIdRef.current = newConversationId()
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl =
      `${proto}://${window.location.host}/api/agent/rtc` +
      `?mode=training&offer_id=${encodeURIComponent(campaign.offerCampaignId)}` +
      `&agent_id=${encodeURIComponent(agentId)}&auto_hangup=0` +
      `&conversation_id=${encodeURIComponent(conversationIdRef.current)}`
    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    liveRef.current.ws = ws
    startedAtRef.current = Date.now()

    ws.onopen = () => setStatusText('Connected — waiting for the agent…')
    ws.onclose = () => {
      const liveWs = liveRef.current.ws
      if (liveWs === ws) liveRef.current.ws = null
    }
    ws.onerror = () => {
      setPhase('error')
      setError('Realtime connection failed. Is the backend up and is the microphone allowed?')
    }
    ws.onmessage = (ev: MessageEvent) => {
      if (typeof ev.data === 'string') {
        try {
          handleControl(JSON.parse(ev.data) as { type: string })
        } catch {
          /* not json */
        }
      } else if (ev.data instanceof ArrayBuffer) {
        playPcm(ev.data)
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: { ideal: PCM_RATE },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      liveRef.current.micStream = stream
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const captureCtx = new Ctx({ sampleRate: PCM_RATE, latencyHint: 'interactive' })
      liveRef.current.captureCtx = captureCtx
      const source = captureCtx.createMediaStreamSource(stream)
      const proc = captureCtx.createScriptProcessor(PCM_BUFFER, 1, 1)
      liveRef.current.processor = proc
      proc.onaudioprocess = (e: AudioProcessingEvent) => {
        const live = liveRef.current
        if (!live.ws || live.ws.readyState !== WebSocket.OPEN) return
        const input = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(input.length)
        let energy = 0
        for (let i = 0; i < input.length; i += 1) {
          const v = Math.max(-32768, Math.min(32767, input[i] * 32768))
          int16[i] = v
          energy += input[i] * input[i]
        }
        live.ws.send(int16.buffer)
        // Barge-in: the operator can interrupt the agent by speaking.
        const rms = Math.sqrt(energy / input.length)
        if (rms > 0.045) {
          live.energyCounter += 1
          if (live.energyCounter >= 2 && live.sources.length > 0) {
            const nowTs = Date.now()
            if (nowTs - live.lastCancelAt > 700) {
              live.lastCancelAt = nowTs
              try {
                live.ws.send(JSON.stringify({ type: 'response.cancel' }))
              } catch {
                /* closing */
              }
              live.sources.forEach((s) => {
                try {
                  s.stop()
                } catch {
                  /* noop */
                }
              })
              live.sources = []
              live.scheduling = false
            }
          }
        } else {
          live.energyCounter = 0
        }
      }
      source.connect(proc)
      const mute = captureCtx.createGain()
      mute.gain.value = 0
      proc.connect(mute)
      mute.connect(captureCtx.destination)
      setPhase('live')
    } catch (e) {
      setPhase('error')
      setError(`Microphone unavailable: ${errText(e)}`)
      stopEngine()
    }
  }, [agentId, campaign, handleControl, playPcm, stopEngine])

  const applyCompleted = useCallback((reply: CompleteReply, transcript: TrainingTalkTurn[]) => {
    if (reply.duplicate) {
      // A retry of an already-recorded conversation — show the stored result.
    }
    setResult(reply.trainingSession)
    setSavedTranscript(transcript)
    setRecordingSrc(reply.trainingSession.recordingUrl ?? '')
    setFlowSuggestions(reply.trainingSession.flowSuggestions ?? [])
    setPhase('done')
    setStatusText(
      `Training talk recorded — the campaign's training state was updated from this real conversation.`,
    )
    onTrainingUpdated()
  }, [onTrainingUpdated])

  // A single transient network failure must not destroy a finished talk: retry
  // briefly before surfacing the error (safe — the backend dedupes by id).
  const saveWithRetry = useCallback(
    async (offerId: string, payload: CompletePayload): Promise<CompleteReply> => {
      let lastError: unknown = null
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          return await repo.completeTrainingTalk(offerId, payload)
        } catch (e) {
          lastError = e
          if (attempt < 3) {
            await new Promise((resolve) =>
              window.setTimeout(resolve, attempt === 1 ? 800 : 2000),
            )
          }
        }
      }
      throw lastError
    },
    [],
  )

  const submitDraft = useCallback(
    async (draft: PendingTalk) => {
      setError('')
      setSubmittingDraft(true)
      setPhase('grading')
      setStatusText('Submitting the saved talk for grading…')
      try {
        const reply = await saveWithRetry(draft.campaignId, {
          transcript: draft.transcript,
          agentId: draft.agentId,
          durationS: draft.durationS,
          conversationId: draft.conversationId,
        })
        clearPendingTalk(draft.campaignId)
        setPendingTalk(null)
        applyCompleted(reply, draft.transcript)
      } catch (e) {
        setPhase('error')
        setError(
          `Could not record the training session: ${errText(e)}. The talk is still kept — retry the save below.`,
        )
      } finally {
        setSubmittingDraft(false)
      }
    },
    [applyCompleted, saveWithRetry],
  )

  const discardDraft = useCallback(() => {
    if (pendingTalk) clearPendingTalk(pendingTalk.campaignId)
    setPendingTalk(null)
  }, [pendingTalk])

  const end = useCallback(async () => {
    setPhase('grading')
    setStatusText('Saving the recording and grading the transcript…')
    const durationS = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0
    const conversationId = conversationIdRef.current || crypto.randomUUID()
    const transcript = turnsRef.current
    const ws = liveRef.current.ws
    try {
      await waitForTrainingWsClose(ws)
      stopEngine()
      // Give the relay a moment to flush trn-<conversation_id>.wav to disk.
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      const reply = await saveWithRetry(campaign!.offerCampaignId, {
        transcript,
        agentId,
        durationS,
        conversationId,
      })
      applyCompleted(reply, transcript)
    } catch (e) {
      const draft: PendingTalk = {
        campaignId: campaign!.offerCampaignId,
        agentId,
        durationS,
        conversationId,
        transcript: transcript.map((turn) => ({ ...turn })),
        failedAt: Date.now(),
      }
      savePendingTalk(draft)
      setPendingTalk(draft)
      setPhase('error')
      setError(
        `Could not record the training session: ${errText(e)}. The talk is kept in this browser — retry the save below.`,
      )
    }
  }, [agentId, campaign, onTrainingUpdated, stopEngine, saveWithRetry, applyCompleted])

  const ready =
    (phase === 'idle' || phase === 'done' || phase === 'error') &&
    !!campaign &&
    !!agentId
  const inTalk = phase === 'connecting' || phase === 'live'

  return (
    <div className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Radio className="size-4 text-accent" />
            Live talk — train the agent with your voice
          </h3>
          <p className="mt-1 text-xs text-fg-muted">
            Speak to the agent in real time (OpenAI Realtime voice). The actual conversation is graded and updates
            the campaign's training state; new names and words land in the pronunciation queue below for review.
          </p>
        </div>
        {campaign && (
          <span className="inline-flex items-center rounded-full border border-line bg-surface-1 px-2.5 py-1 text-2xs font-medium text-fg-muted">
            {campaign.title} · agent:{' '}
            {agents.find((a) => a.agentId === agentId)?.name || agentId || '—'}
          </span>
        )}
      </div>

      {/* Rules of engagement — behaviors the operator sets for this campaign */}
      {campaignId ? (
        <div className="mt-4 rounded-md border border-line bg-surface-1 p-3">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-fg">
              <ListChecks className="size-4 text-accent" />
              Rules of engagement
            </div>
            <p className="mt-0.5 text-xs text-fg-muted">
              Add one behavior at a time — opener, pitch, qualification, booking, close. After each talk,
              findings compare what happened against these rules.
            </p>
          </div>

          {processLoaded && engagementRules.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {engagementRules.map((rule, index) => (
                <li
                  key={rule.id}
                  className="flex items-start gap-2 rounded-md border border-line/70 bg-bg/40 px-2.5 py-2"
                >
                  <span className="shrink-0 pt-0.5 font-mono text-2xs tabular text-fg-muted">{index + 1})</span>
                  <span className="min-w-0 flex-1 text-xs leading-relaxed text-fg">{rule.text}</span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove rule ${index + 1}`}
                    disabled={processBusy}
                    onClick={() => void removeEngagementRule(rule.id)}
                    leadingIcon={<X className="size-3.5 text-danger" />}
                  />
                </li>
              ))}
            </ul>
          ) : processLoaded ? (
            <p className="mt-3 text-xs text-fg-faint">No rules yet — add your first one below.</p>
          ) : null}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={ruleDraft}
              onChange={(e) => setRuleDraft(e.target.value)}
              disabled={processBusy || !processLoaded}
              placeholder='e.g. If cough identified, say "bless you" in the spoken language'
              className="text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void addEngagementRule()
                }
              }}
            />
            <Button
              size="sm"
              variant="primary"
              disabled={processBusy || !processLoaded || !ruleDraft.trim()}
              onClick={() => void addEngagementRule()}
              leadingIcon={processBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              className="shrink-0"
            >
              Add rule
            </Button>
          </div>
          {processNotice ? <p className="mt-2 text-2xs text-fg-secondary">{processNotice}</p> : null}
        </div>
      ) : null}

      {/* Live controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {phase === 'idle' || phase === 'done' || phase === 'error' ? (
          <Button variant="primary" onClick={start} disabled={!ready} leadingIcon={<Mic className="size-4" />}>
            Start live talk
          </Button>
        ) : null}
        {inTalk ? (
          <Button variant="danger" onClick={() => void end()} leadingIcon={<Square className="size-4" />}>
            End talk & grade
          </Button>
        ) : null}
        {phase === 'grading' ? (
          <Button variant="secondary" disabled leadingIcon={<Loader2 className="size-4 animate-spin" />}>
            Grading the conversation…
          </Button>
        ) : null}
        <span className="flex items-center gap-1.5 text-xs text-fg-muted" aria-live="polite">
          {inTalk ? <AudioLines className="size-3.5 animate-pulse text-danger" /> : null}
          {statusText}
        </span>
      </div>

      {/* Live / replay transcript */}
      {recordingSrc && savedTranscript.length > 0 ? (
        <TrainingSyncedTranscript
          className="mt-4"
          lines={playbackLines}
          currentS={playbackS}
          onSeekLine={(line) => {
            playerRef.current?.seekTo(line.startS)
            void playerRef.current?.play().catch(() => undefined)
            setPlaybackS(line.startS)
          }}
          emptyMessage="Press play on the recording — the last 10 seconds of the talk appear here."
        />
      ) : (
        <div className="mt-4 max-h-64 min-h-32 overflow-y-auto rounded-md border border-line bg-bg/40 p-3">
          {lines.length === 0 && !inTalk ? (
            <p className="text-sm text-fg-faint">No conversation yet — the transcript appears live here.</p>
          ) : (
            <ul className="space-y-2">
              {lines.map((l) => (
                <li
                  key={l.id}
                  className={cn('text-sm', l.speaker === 'user' ? 'text-accent' : 'text-fg')}
                >
                  <span className="mr-1.5 font-semibold">{l.speaker === 'user' ? 'You:' : 'Agent:'}</span>
                  <span className={cn(l.live && 'italic text-fg-muted')}>{l.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <TrainingMockCalendar
        texts={lines.map((row) => row.text)}
        turns={savedTranscript}
        extracted={result?.extracted}
      />

      {error ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-danger" role="alert">
          <TriangleAlert className="size-3.5" /> {error}
        </p>
      ) : null}

      {pendingTalk && phase !== 'connecting' && phase !== 'live' && phase !== 'grading' ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-warning/25 bg-warning/5 px-3 py-2 text-xs text-warning">
          <TriangleAlert className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1">
            An earlier talk couldn't be saved (kept at {new Date(pendingTalk.failedAt).toLocaleTimeString()})
            — submit it to load it into this campaign's training, or discard it.
          </span>
          <Button
            size="sm"
            variant="primary"
            disabled={submittingDraft}
            onClick={() => void submitDraft(pendingTalk)}
            leadingIcon={submittingDraft ? <Loader2 className="size-3.5 animate-spin" /> : <Radio className="size-3.5" />}
          >
            {submittingDraft ? 'Submitting…' : 'Submit saved talk'}
          </Button>
          <Button size="sm" variant="ghost" disabled={submittingDraft} onClick={discardDraft} leadingIcon={<X className="size-3.5" />}>
            Discard
          </Button>
        </div>
      ) : null}

      {/* The saved recording of this talk (playback with progress) */}
      {recordingSrc ? (
        <div className="mt-4 rounded-md border border-line bg-surface-1 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-fg-muted">
            <AudioLines className="size-3.5 text-accent" />
            Recording — this talk was saved
          </div>
          <SpotifyStylePlayer
            ref={playerRef}
            src={recordingSrc}
            rowKey={recordingSrc}
            title="Recording — this talk was saved"
            className="max-w-2xl"
            onTimeUpdate={setPlaybackS}
            onDurationChange={setAudioDurationS}
          />
          <p className="mt-1.5 text-2xs text-fg-faint">
            Operator on the left channel, agent on the right — replay to perfect the performance.
          </p>
        </div>
      ) : null}

      {/* Server-graded result of the REAL conversation */}
      {result ? (
        <div className="mt-4 rounded-md border border-line bg-surface-1 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                result.outcome === 'ready' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
              )}
            >
              {result.outcome === 'ready' ? <CircleCheck className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
              {result.outcome === 'ready' ? 'Ready to launch' : 'Needs improvement'}
            </span>
            <span className="text-sm text-fg">
              Score <span className="text-lg font-semibold tabular text-fg">{result.score}</span>/100
            </span>
            {result.suggestionsAdded > 0 ? (
              <span className="text-xs text-fg-muted">
                {result.suggestionsAdded} pronunciation suggestion{result.suggestionsAdded === 1 ? '' : 's'} added
                for review
              </span>
            ) : null}
            {(result.memoriesCreated ?? 0) > 0 ? (
              <span className="text-xs text-fg-muted">
                {result.memoriesCreated} memory candidate{result.memoriesCreated === 1 ? '' : 's'} waiting below
              </span>
            ) : null}
          </div>
          {result.summary ? <p className="mt-2 text-sm text-fg-secondary">{result.summary}</p> : null}
          <ExtractedTalkReview
            campaignId={campaignId}
            sessionId={result.sessionId || result.conversationId}
            extracted={result.extracted}
          />
          {result.strengths.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.strengths.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-2xs font-medium text-success"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}
          {result.gaps.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.gaps.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center rounded-full border border-danger/25 bg-danger/10 px-2 py-0.5 text-2xs font-medium text-danger"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : null}
          {flowSuggestions.length > 0 ? (
            <div className="mt-3 rounded-md border border-warning/20 bg-warning/5 p-3">
              <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-warning">
                <Lightbulb className="size-3.5" />
                Suggested updates to your rules of engagement
              </div>
              <ul className="mt-2 space-y-1.5">
                {flowSuggestions.map((f) => (
                  <li key={f} className="flex items-start justify-between gap-2 text-xs text-fg-secondary">
                    <span className="flex items-start gap-1.5">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-warning" />
                      {f}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={processBusy || !processLoaded}
                      onClick={() =>
                        void persistEngagementRules(
                          [...engagementRules, { id: crypto.randomUUID(), text: f }],
                          'Added to the conversation process — trains the next talk.',
                        )
                      }
                    >
                      Add as rule
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {phase !== 'live' && lines.length > 0 ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-fg-faint">
          <MicOff className="size-3.5" /> Transcript kept locally — start a new talk or reuse the page for another
          campaign.
        </p>
      ) : null}
    </div>
  )
}
