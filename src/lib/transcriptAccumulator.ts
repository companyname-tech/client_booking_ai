/**
 * Live transcript accumulator for Realtime relay events.
 *
 * transcript_delta grows one live line per speaker; the final transcript
 * for that turn replaces the live line (OpenAI may refine text from audio).
 */

export type RelaySpeaker = 'user' | 'assistant'

export interface AccumLine {
  speaker: RelaySpeaker
  text: string
  live: boolean
}

export interface AccumEvent {
  type: 'transcript_delta' | 'transcript'
  speaker: RelaySpeaker
  text: string
}

export class TranscriptAccumulator {
  private lines: AccumLine[] = []
  private liveIndex = -1

  getLines(): readonly AccumLine[] {
    return this.lines.map((line) => ({ ...line }))
  }

  get completedCount(): number {
    return this.lines.filter((line) => !line.live).length
  }

  reset(): void {
    this.lines = []
    this.liveIndex = -1
  }

  /** Returns the finalized line when a final transcript closes a turn. */
  push(ev: AccumEvent): AccumLine | null {
    if (!ev.text) return null
    const live = this.lines[this.liveIndex]
    if (ev.type === 'transcript') {
      if (live && live.speaker === ev.speaker) {
        live.text = ev.text
        live.live = false
        this.liveIndex = -1
        return { ...live }
      }
      const line: AccumLine = { speaker: ev.speaker, text: ev.text, live: false }
      this.lines.push(line)
      return { ...line }
    }
    if (live && live.speaker === ev.speaker) {
      live.text += ev.text
      return null
    }
    if (live) live.live = false
    this.lines.push({ speaker: ev.speaker, text: ev.text, live: true })
    this.liveIndex = this.lines.length - 1
    return null
  }
}

export function relaySpeaker(raw: unknown): RelaySpeaker {
  return String(raw ?? '') === 'user' ? 'user' : 'assistant'
}

export function relayRole(raw: RelaySpeaker): 'user' | 'agent' {
  return raw === 'user' ? 'user' : 'agent'
}
