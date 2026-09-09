import type { TrainingTalkTurn } from '@/types/training'

/**
 * A finished training talk whose final `training/complete` submission did not
 * reach the backend (transient network failure). Kept in sessionStorage so a
 * reload cannot destroy it — the backend grades idempotently by
 * conversation_id, so re-submitting the same talk is always safe.
 */
export interface PendingTalk {
  campaignId: string
  agentId: string
  durationS: number
  conversationId: string
  transcript: TrainingTalkTurn[]
  failedAt: number
}

const KEY_PREFIX = 'pending-training-talk:'

function storageKey(campaignId: string): string {
  return `${KEY_PREFIX}${campaignId}`
}

export function savePendingTalk(talk: PendingTalk): void {
  try {
    window.sessionStorage.setItem(storageKey(talk.campaignId), JSON.stringify(talk))
  } catch {
    // Storage full/unavailable — the in-memory state still offers Retry.
  }
}

export function loadPendingTalk(campaignId: string): PendingTalk | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(campaignId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingTalk
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.campaignId !== 'string' ||
      typeof parsed.conversationId !== 'string' ||
      !Array.isArray(parsed.transcript)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearPendingTalk(campaignId: string): void {
  try {
    window.sessionStorage.removeItem(storageKey(campaignId))
  } catch {
    // noop
  }
}
