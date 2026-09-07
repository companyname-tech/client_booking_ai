/**
 * AI training talk sessions — backend contract types.
 *
 * Mirrors the leads_to_conversion admin training endpoints (section 3.17 of
 * docs/API.md):
 *   - WS /agent/rtc?mode=training&offer_id=…&agent_id=…  → the LIVE talk
 *   - POST /admin/campaigns/{offer_id}/training/start | complete
 *   - GET /admin/training/campaigns                     → per-campaign status
 *   - GET /admin/training/suggestions (+accept/dismiss) → lexicon review queue
 *
 * The BE wire for these admin endpoints is already camelCase; the FE types
 * mirror the wire 1:1 (unlike the legacy snake_case Tier-B DTOs).
 */
import type { TrainingStatus } from '@/types/admin'

/** One spoken turn of a training talk (as collected by the live session). */
export interface TrainingTalkTurn {
  role: 'user' | 'agent'
  text: string
}

/** Wire shape of a finished training session stored on the campaign. */
export interface TrainingSessionResult {
  sessionId: string
  conversationId: string
  agentId: string
  startedAt: string
  completedAt: string
  durationS: number
  /** 0..100 — computed server-side from the REAL transcript. */
  score: number
  /** ready | needs_improvement */
  outcome: 'ready' | 'needs_improvement'
  summary: string
  strengths: string[]
  gaps: string[]
  suggestionsAdded: number
  deterministic: boolean
}

/** POST …/training/complete (transcript mode) response. */
export interface TrainingTalkCompleteResult {
  meta: {
    offerCampaignId: string
    workflowStatus: string
    trainingStatus: TrainingStatus
    trainingScore?: number
    [key: string]: unknown
  }
  trainingSession: TrainingSessionResult
  /** true when the same conversation_id was already submitted. */
  duplicate?: boolean
}

/** Row of GET /admin/training/campaigns (enriched training status list). */
export interface TrainingCampaignRow {
  offerCampaignId: string
  status: TrainingStatus
  title: string
  agentId: string
  agentName: string
  trainingState: 'not_started' | 'in_progress' | 'completed' | string
  trainingScore: number
  trainingSessions: number
  pendingSuggestions: number
}

/** Pronunciation suggestion harvested from a training talk (pending review). */
export interface TrainingSuggestion {
  suggestionId: string
  word: string
  pronounceAs: string
  language: 'en' | 'he' | string
  note: string
  source: string
  offerCampaignId: string
  offerTitle: string
  agentId: string
  agentName: string
  status: 'pending' | 'accepted' | 'dismissed'
  createdAt: string
}

/** POST /admin/training/suggestions/{id}/accept body + reply. */
export interface AcceptTrainingSuggestionInput {
  /** main = global lexicon · agent = that agent's own lexicon */
  scope: 'main' | 'agent'
  agentId?: string
  word?: string
  pronounceAs?: string
  language?: string
}

export interface AcceptTrainingSuggestionResult {
  ok: boolean
  alreadyResolved?: boolean
  status: string
  scope?: string
  word?: string
  pronounceAs?: string
  language?: string
}
