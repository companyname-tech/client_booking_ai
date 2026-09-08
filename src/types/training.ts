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
  /** Speech start offset in the recording (ms). */
  timestampMs?: number
  /** Speech end offset in the recording (ms), when captured by the relay. */
  timestampEndMs?: number
  segmentId?: string
}

/** Structured contact/booking data the backend deterministically extracted from the talk. */
export interface TrainingExtractedData {
  emails?: { email: string; confirmed?: boolean }[]
  phones?: string[]
  meeting?: { day?: string; time?: string } | null
}

/** What the operator expects the agent to capture during training talks. */
export interface TrainingIntendedData {
  emails: string[]
  phones: string[]
  meeting: { day: string; time: string }
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
  /** Behavior changes the evaluator suggests vs the operator's rules of engagement. */
  flowSuggestions?: string[]
  suggestionsAdded: number
  /** Memory-candidate findings written from this talk (still need validate+publish). */
  memoriesCreated?: number
  deterministic: boolean
  /** Email/phone/meeting captured from the talk (empty when nothing found). */
  extracted?: TrainingExtractedData
  /** Stereo WAV of the talk (operator L / agent R) when the relay saved it. */
  recordingUrl?: string
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

/** One context turn around where the word was said (from the stored talk). */
export interface TrainingSuggestionContextTurn {
  role: 'user' | 'agent' | string
  text: string
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
  /** Source training-talk conversation (when found). */
  conversationId?: string
  /** Transcript excerpt around where the word was said. */
  context?: TrainingSuggestionContextTurn[]
  /** Operator-set timestamp (seconds into the talk); 0 when unset. */
  timestampS?: number
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

/** Lifecycle stage of an agent memory. Only `production` reaches live calls. */
export type MemoryStatus = 'candidate' | 'validated' | 'production' | 'disabled'

/**
 * One agent memory record (GET /admin/memories).
 *
 * These endpoints return the stored document as-is, so the shape is
 * snake_case unlike the camelCase admin training wire.
 */
export interface AgentMemoryRecord {
  memory_id: string
  campaign_id: string
  agent_id: string
  session_id: string
  type: string
  rule: string
  scope: string[]
  language: string
  status: MemoryStatus
  reviewer?: string
  review_rationale?: string
  reviewed_at?: string
  evidence?: { evaluation_id?: string; finding_index?: number; call_id?: string }
}

/** The behavior version live calls are pinned to (GET /admin/behavior-version). */
export interface BehaviorVersion {
  version: string
  campaign_id: string
  agent_id: string
  memory_ids: string[]
  runtime_policy_version: number
  previous_version?: string
  created_at?: string
}

/** One logged GET/DELETE against the training conversation-process API. */
export interface TrainingProcessOperation {
  operationId: string
  method: 'GET' | 'DELETE' | string
  path: string
  status: number
  statusText: string
  durationMs: number
  responsePreview: string
  responseBody?: Record<string, unknown> | unknown[] | null
  modelComment: string
  createdAt: string
  lastRunAt: string
}

export interface TrainingProcessOperationRunResult {
  operation: TrainingProcessOperation
  response: Record<string, unknown>
}

/** One stored training talk session (GET /admin/training/campaigns/{id}/sessions). */
export interface TrainingTalkSession {
  sessionId: string
  conversationId: string
  agentId: string
  startedAt: string
  completedAt: string
  durationS: number
  /** Recording file length when known (prefer over wall-clock durationS for sync). */
  recordingDurationS?: number
  recordingUrl?: string
  transcript: TrainingTalkTurn[]
  score: number
  outcome: 'ready' | 'needs_improvement' | string
  summary: string
  extracted?: TrainingExtractedData
}

/** Operator note pinned to a moment in a training recording. */
export interface TrainingRecordingComment {
  id: string
  timestampS: number
  comment: string
  transcriptSnippet: string
  createdAt: string
  memoryId?: string
  rule?: string
}
