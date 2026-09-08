import type { TrainingTalkTurn } from '@/types/training'

export interface TimedTranscriptLine {
  id: string
  role: 'user' | 'agent'
  text: string
  startS: number
  endS: number
}

export const TRANSCRIPT_WINDOW_S = 10

export function formatTalkClock(sec: number): string {
  const total = Math.max(0, Math.floor(sec || 0))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function splitTranscriptWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

function turnWeight(turn: TrainingTalkTurn): number {
  const words = splitTranscriptWords(turn.text).length
  return Math.max(1, words, Math.ceil(turn.text.length / 12))
}

function estimatedSpeechDurationS(text: string, role: 'user' | 'agent'): number {
  const words = splitTranscriptWords(text).length
  const wordsPerSecond = role === 'agent' ? 2.6 : 2.2
  return Math.max(0.35, Math.min(words / wordsPerSecond, 45))
}

/** Spread turns across *durationS* proportional to how much was said. */
function estimatedStarts(transcript: TrainingTalkTurn[], durationS: number): number[] {
  const weights = transcript.map(turnWeight)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || transcript.length
  let used = 0
  return weights.map((weight) => {
    const start = (used / totalWeight) * durationS
    used += weight
    return start
  })
}

function hasRecordingBounds(transcript: TrainingTalkTurn[]): boolean {
  return transcript.some((turn) => (turn.timestampEndMs ?? 0) > 0)
}

function resolveTurnBounds(
  turn: TrainingTalkTurn,
  role: 'user' | 'agent',
): { startS: number; endS: number } | null {
  const startMs = turn.timestampMs ?? 0
  const endMs = turn.timestampEndMs ?? 0
  if (endMs > 0) {
    const startS = Math.max(0, startMs) / 1000
    const endS = Math.max(startS + 0.2, endMs / 1000)
    return { startS, endS }
  }
  if (startMs <= 0) return null
  const endS = startMs / 1000
  const startS = Math.max(0, endS - estimatedSpeechDurationS(turn.text, role))
  return { startS, endS }
}

function scaleBoundsToDuration(
  bounds: { startS: number; endS: number }[],
  durationS: number,
): { startS: number; endS: number }[] {
  const maxEnd = bounds.reduce((max, row) => Math.max(max, row.endS), 0)
  if (maxEnd <= 0) return bounds
  const target = Math.max(durationS, 0.1)
  const scale = Math.abs(maxEnd - target) / target > 0.02 ? target / maxEnd : 1
  return bounds.map((row) => ({
    startS: row.startS * scale,
    endS: row.endS * scale,
  }))
}

export function buildTimedTranscript(
  transcript: TrainingTalkTurn[],
  durationS: number,
): TimedTranscriptLine[] {
  if (!transcript.length) return []
  const total = Math.max(durationS, 0.1)

  let bounds: { startS: number; endS: number }[]
  if (hasRecordingBounds(transcript)) {
    bounds = transcript.map((turn) => {
      const role = turn.role === 'agent' ? 'agent' : 'user'
      return resolveTurnBounds(turn, role) ?? { startS: 0, endS: 0 }
    })
    bounds = scaleBoundsToDuration(bounds, total)
  } else {
    const hasLegacyTimes = transcript.some((turn) => (turn.timestampMs ?? 0) > 0)
    if (hasLegacyTimes) {
      bounds = transcript.map((turn) => {
        const role = turn.role === 'agent' ? 'agent' : 'user'
        return resolveTurnBounds(turn, role) ?? { startS: 0, endS: 0 }
      })
      bounds = scaleBoundsToDuration(bounds, total)
    } else {
      const starts = estimatedStarts(transcript, total)
      bounds = starts.map((startS, index) => ({
        startS,
        endS: starts[index + 1] ?? total,
      }))
    }
  }

  const lines = transcript.map((turn, index) => ({
    id: turn.segmentId || `${index}-${turn.role}`,
    role: (turn.role === 'agent' ? 'agent' : 'user') as 'user' | 'agent',
    text: turn.text,
    startS: bounds[index]?.startS ?? 0,
    endS: bounds[index]?.endS ?? total,
  }))

  lines.sort((a, b) => a.startS - b.startS)
  for (let index = 0; index < lines.length; index += 1) {
    const nextStart = lines[index + 1]?.startS
    lines[index].endS = nextStart ?? Math.max(lines[index].endS, total)
    if (lines[index].endS < lines[index].startS) {
      lines[index].endS = lines[index].startS + 0.25
    }
  }

  return lines
}

export function activeTranscriptLine(
  lines: TimedTranscriptLine[],
  currentS: number,
): TimedTranscriptLine | null {
  if (!lines.length) return null
  for (const line of lines) {
    if (currentS >= line.startS && currentS < line.endS) return line
  }
  if (currentS >= lines[lines.length - 1].startS) return lines[lines.length - 1]
  return lines[0]
}

/** Lines that overlap the rolling playback window ending at *currentS*. */
export function transcriptWindowLines(
  lines: TimedTranscriptLine[],
  currentS: number,
  windowS = TRANSCRIPT_WINDOW_S,
): TimedTranscriptLine[] {
  if (!lines.length) return []
  const winStart = Math.max(0, currentS - windowS)
  const winEnd = currentS + 0.05
  return lines
    .filter((line) => line.endS >= winStart && line.startS <= winEnd)
    .sort((a, b) => a.startS - b.startS)
}

/** Index of the word currently being spoken inside *line*, or -1 when outside it. */
export function activeWordIndexInLine(line: TimedTranscriptLine, currentS: number): number {
  const words = splitTranscriptWords(line.text)
  if (!words.length) return -1
  const start = line.startS
  const end = Math.max(line.endS, start + 0.25)
  if (currentS < start || currentS >= end) return -1
  const progress = (currentS - start) / (end - start)
  const index = Math.floor(progress * words.length)
  return Math.min(words.length - 1, Math.max(0, index))
}
