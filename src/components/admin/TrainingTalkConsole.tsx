import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AudioLines,
  CircleCheck,
  Loader2,
  Mic,
  MicOff,
  Radio,
  Square,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { repo } from '@/api/repository'
import type {
  TrainingCampaignRow,
  TrainingTalkTurn,
  TrainingSessionResult,
} from '@/types/training'
import { cn } from '@/lib/utils'

/** 24 kHz mono PCM16 — the codec the /agent/rtc realtime bridge expects. */
const PCM_RATE = 24000
const PCM_BUFFER = 1024

type Phase = 'idle' | 'connecting' | 'live' | 'grading' | 'done' | 'error'

interface TranscriptLine {
  id: number
  speaker: 'user' | 'agent'
  text: string
}

let lineSeq = 0
function nextId(): number {
  lineSeq += 1
  return lineSeq
}

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

function trainingLabel(status: string): string {
  const map: Record<string, string> = {
    not_started: 'Not started',
    ready: 'Ready',
    training: 'Training…',
    trained: 'Trained',
    needs_improvement: 'Needs improvement',
  }
  return map[status] ?? status
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
  onTrainingUpdated,
}: {
  campaigns: TrainingCampaignRow[]
  agents: { agentId: string; name: string }[]
  onTrainingUpdated: () => void
}) {
  const [campaignId, setCampaignId] = useState('')
  const [agentId, setAgentId] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [statusText, setStatusText] = useState('Pick a campaign and press Start to rehearse live.')
  const [lines, setLines] = useState<TranscriptLine[]>([])
  const [error, setError] = useState('')
  const [result, setResult] = useState<TrainingSessionResult | null>(null)
  const liveRef = useRef<LiveSession>(freshSession())
  const turnsRef = useRef<TrainingTalkTurn[]>([])
  const conversationIdRef = useRef('')
  const startedAtRef = useRef(0)
  const currentLineRef = useRef<TranscriptLine | null>(null)

  const campaign = campaigns.find((c) => c.offerCampaignId === campaignId) ?? null

  useEffect(() => {
    if (campaign) {
      setAgentId((prev) => {
        if (agents.some((a) => a.agentId === campaign.agentId)) return campaign.agentId || prev
        return prev || campaign.agentId || (agents[0]?.agentId ?? '')
      })
    }
  }, [campaignId, campaign, agents])

  // Cleanup audio + sockets when the component unmounts mid-talk.
  useEffect(() => {
    return () => stopEngine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pushTurn = useCallback((speaker: 'user' | 'agent', text: string) => {
    turnsRef.current.push({ role: speaker, text })
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
      } else if (t === 'transcript') {
        const speaker = String(msg.speaker ?? '') === 'user' ? 'user' : 'agent'
        const text = String(msg.text ?? '')
        if (!text) return
        const line: TranscriptLine = { id: nextId(), speaker, text }
        currentLineRef.current = null
        setLines((prev) => [...prev, line])
        pushTurn(speaker, text)
      } else if (t === 'error') {
        setError(String(msg.message ?? 'Session error'))
        setStatusText('Session error — see message below.')
      }
    },
    [pushTurn],
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
    setLines([])
    turnsRef.current = []
    setPhase('connecting')
    setStatusText('Connecting the realtime voice session…')

    // Mark the campaign as training (per-campaign status via the existing
    // admin training endpoints) — best effort, never blocks the talk.
    void repo.startCampaignTraining(campaign.offerCampaignId).catch(() => undefined)

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl =
      `${proto}//${window.location.host}/api/agent/rtc` +
      `?mode=training&offer_id=${encodeURIComponent(campaign.offerCampaignId)}` +
      `&agent_id=${encodeURIComponent(agentId)}&auto_hangup=0`
    const ws = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    liveRef.current.ws = ws
    conversationIdRef.current = newConversationId()
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

  const end = useCallback(async () => {
    stopEngine()
    setPhase('grading')
    setStatusText('Submitting the real conversation — grading the transcript…')
    const durationS = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0
    const conversationId = conversationIdRef.current || crypto.randomUUID()
    const transcript = turnsRef.current
    try {
      const reply = await repo.completeTrainingTalk(campaign!.offerCampaignId, {
        transcript,
        agentId,
        durationS,
        conversationId,
      })
      if (reply.duplicate) {
        // A retry of an already-recorded conversation — show the stored result.
      }
      setResult(reply.trainingSession)
      setPhase('done')
      setStatusText(
        `Training talk recorded — the campaign's training state was updated from this real conversation.`,
      )
      onTrainingUpdated()
    } catch (e) {
      setPhase('error')
      setError(`Could not record the training session: ${errText(e)}`)
    }
  }, [agentId, campaign, onTrainingUpdated, stopEngine])

  const ready = phase === 'idle' && !!campaign && !!agentId
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

      {/* Pick campaign + agent */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-fg-secondary">Campaign to train</span>
          <select
            value={campaignId}
            onChange={(e) => {
              setCampaignId(e.target.value)
              setResult(null)
            }}
            disabled={inTalk}
            className="w-full rounded-md border border-line bg-surface-1 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          >
            <option value="">Choose a campaign…</option>
            {campaigns.map((c) => (
              <option key={c.offerCampaignId} value={c.offerCampaignId}>
                {c.title || c.offerCampaignId} — {trainingLabel(c.status)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-fg-secondary">Agent to talk to</span>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={inTalk}
            className="w-full rounded-md border border-line bg-surface-1 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          >
            {agents.length === 0 && <option value="">No agents yet</option>}
            {agents.map((a) => (
              <option key={a.agentId} value={a.agentId}>
                {a.name || '(unnamed)'}
              </option>
            ))}
          </select>
        </label>
      </div>

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

      {/* Live transcript */}
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
                {l.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-danger" role="alert">
          <TriangleAlert className="size-3.5" /> {error}
        </p>
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
          </div>
          {result.summary ? <p className="mt-2 text-sm text-fg-secondary">{result.summary}</p> : null}
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
